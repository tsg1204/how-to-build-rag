import { openaiClient } from '@/app/libs/openai';
import { canonicalUrl } from '@/app/libs/url';
import type { Chunk, RerankedDoc } from './types';

export type PayloadToChunkOptions = {
  retrievalScoreById: Map<string, number>;
  rerankRank: number;
  rerankScore?: number | null;
};

/** Map a reranked doc + payload to Chunk for generateAnswer. */
export function payloadToChunk(
  r: RerankedDoc,
  options: PayloadToChunkOptions,
): Chunk {
  const p = r.payload ?? {};
  const retrievalScore = options.retrievalScoreById.get(String(r.id)) ?? null;
  const rerankScore = options.rerankScore ?? r.rerankScore ?? r.score ?? null;

  return {
    id: r.id,
    text: r.text ?? '',
    citation: {
      publisher: (p.publisher ?? null) as string | null | undefined,
      title: (p.title ?? null) as string | null | undefined,
      url: (p.url ?? p.source ?? null) as string | null | undefined,
      section_path: (p.section_path ?? null) as string | null | undefined,
      published_date: (p.published_date ?? null) as string | null | undefined,
      published_date_text: (p.published_date_text ?? null) as
        | string
        | null
        | undefined,
      retrieved_at: (p.retrieved_at ?? p.fetched_at ?? null) as
        | string
        | null
        | undefined,
      chunk_index: (p.chunk_index ?? null) as number | null | undefined,
    },
    debug: {
      retrieval_score: retrievalScore,
      rerank_rank: options.rerankRank,
      rerank_score: rerankScore,
    },
  };
}

function parseDateOrNull(s?: string | null) {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

// pick best available date for ordering (published_date first, then retrieved_at)
function bestCitationDate(c: {
  published_date?: string | null;
  retrieved_at?: string | null;
}) {
  return parseDateOrNull(c.published_date) ?? parseDateOrNull(c.retrieved_at);
}

export async function generateAnswer(params: {
  query: string;
  chunks: Chunk[];
}) {
  const { query, chunks } = params;

  if (!chunks.length) {
    return {
      state: 'not_covered',
      message:
        "This question isn't covered by the current dataset. Try rephrasing it or ask about another RAG topic.",
    };
  }

  const context = chunks
    .map(
      (c, i) =>
        `[#${i + 1}] ${c.text}\nSOURCE: ${c.citation.title ?? 'Unknown'} — ${
          c.citation.section_path ?? 'General'
        }`,
    )
    .join('\n\n');

  const prompt = `
      You are a technical assistant for building RAG systems.
      Answer the question ONLY using the provided context.
      If the context is insufficient, say "Not covered by the dataset."

      Format EXACTLY as:
      Return markdown.

      Use this exact structure and formatting:
      ## Goal
      1–2 sentences

      ## Steps
      - bullet point
      - bullet point
      - bullet point

      ## Pitfalls
      - bullet point
      - bullet point

      ## How to test
      - bullet point
      - bullet point

      Do NOT include a "Citations" section.
      Do NOT mention sources in the answer text.
      If the context is insufficient, write: "Not covered by the dataset."

      Question:
      ${query}

      Context:
      ${context}
      `.trim();

  // We intentionally use a small, fast model here.
  // In this RAG system the LLM's role is controlled synthesis:
  // - structure retrieved content (Goal / Steps / Pitfalls / How to test)
  // - follow strict formatting and refusal rules
  // - avoid hallucination (knowledge comes from retrieval, not the model)
  //
  // Retrieval quality matters more than raw model intelligence in v1,
  // so a lightweight model gives better latency, cost, and reliability.
  // This can be swapped for a larger model in v2 if deeper reasoning is needed.
  const MODEL = 'gpt-4.1-mini';

  const resp = await openaiClient.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    messages: [{ role: 'user', content: prompt }],
  });

  const rawCitations = chunks.map((c, i) => ({
    ref: `#${i + 1}`,
    ...c.citation,
    _origIndex: i, // keep original relevance order
  }));

  // Dedupe by canonical URL + section + title, keep first, cap to 5
  const MAX_CITATIONS = 5;
  const seen = new Set<string>();
  const deduped: typeof rawCitations = [];

  for (const c of rawCitations) {
    const key = `${canonicalUrl(c.url)}::${(c.section_path ?? '').trim()}::${(c.title ?? '').trim()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(c);
  }

  // Prefer newer content when possible (newest first), but keep relevance as fallback
  deduped.sort((a, b) => {
    const da = bestCitationDate(a);
    const db = bestCitationDate(b);

    if (da && db) return db.getTime() - da.getTime(); // newer first
    if (da && !db) return -1;
    if (!da && db) return 1;
    return a._origIndex - b._origIndex; // fallback: original order
  });

  const citations = deduped
    .slice(0, MAX_CITATIONS)
    .map(({ _origIndex, ...c }) => c);

  return {
    state: 'answer',
    answer: resp.choices[0]?.message?.content ?? '',
    citations,
  };
}

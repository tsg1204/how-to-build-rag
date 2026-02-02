import { NextRequest, NextResponse } from 'next/server';
import { classifyQuery } from '@/app/agents/guardrail';
import { retrieveTopChunks } from '@/app/agents/retrieve';
import { rerankTopK } from '@/app/agents/rerank';
import { generateAnswer, type Chunk } from '@/app/agents/answer';

function dedupeByChunkKey<T extends { payload?: Record<string, unknown> }>(
  items: T[],
) {
  const seen = new Set<string>();
  const out: T[] = [];

  for (const it of items) {
    const p = it.payload ?? {};
    const key =
      (p.chunk_key as string | undefined) ??
      `${p.doc_id ?? p.url ?? 'doc'}::${p.section_path ?? 'sec'}::${p.chunk_index ?? 'x'}`;

    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }

  return out;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const query = typeof body?.query === 'string' ? body.query.trim() : '';

  if (!query) {
    return NextResponse.json(
      { error: "Missing 'query' (string) in request body." },
      { status: 400 },
    );
  }

  const decision = classifyQuery(query);

  if (decision.state === 'deny') {
    return NextResponse.json(
      {
        state: 'deny',
        matchedTopics: decision.matchedTopics || [],
        message:
          'This assistant is limited to questions about building RAG systems (retrieval, chunking, evaluation, etc.).',
      },
      { status: 200 },
    );
  }

  if (decision.state === 'ask_to_reframe') {
    return NextResponse.json(
      {
        state: 'ask_to_reframe',
        matchedTopics: decision.matchedTopics,
        message:
          'This assistant focuses on how to build RAG systems. Please reframe your question as a RAG-building question.',
        example: decision.example,
      },
      { status: 200 },
    );
  }

  // allow → retrieve (stub: return chunks only)
  //const chunks = await retrieveTopChunks(query);
  const topK = Number(process.env.RAG_TOP_K ?? 8);
  const candidateLimit = Math.max(topK * 3, 20);

  const candidatesRaw = await retrieveTopChunks(
    query,
    candidateLimit,
    decision.matchedTopics,
  );

  let candidates = dedupeByChunkKey(candidatesRaw);
  if (candidates.length === 0) {
    // fallback: no topic filter
    candidates = await retrieveTopChunks(query, candidateLimit);
  }

  const debug = {
    candidateLimit,
    candidatesRawCount: candidatesRaw.length,
    candidatesDedupedCount: candidates.length,
  };

  // IMPORTANT: ensure text exists for reranker
  const candidateDocs = candidates.map((c) => ({
    ...c,
    text: (c.payload?.text ?? '') as string,
  }));

  if (candidates.length === 0) {
    return NextResponse.json({
      state: 'not_covered',
      query,
      message: 'Not covered by the dataset.',
      matchedTopics: decision.matchedTopics,
    });
  }

  const reranked = await rerankTopK({
    query,
    docs: candidateDocs,
    topK,
  });

  const retrievalScoreById = new Map(
    candidates.map((c) => [String(c.id), c.score]),
  );

  const answer = await generateAnswer({
    query,
    chunks: reranked.map(
      (r, i): Chunk => ({
        id: r.id,
        text: r.text ?? '',
        citation: {
          publisher: (r.payload?.publisher ?? null) as
            | string
            | null
            | undefined,
          title: (r.payload?.title ?? null) as string | null | undefined,
          url: (r.payload?.url ?? r.payload?.source ?? null) as
            | string
            | null
            | undefined,
          section_path: (r.payload?.section_path ?? null) as
            | string
            | null
            | undefined,
          published_date: (r.payload?.published_date ?? null) as
            | string
            | null
            | undefined,
          published_date_text: (r.payload?.published_date_text ?? null) as
            | string
            | null
            | undefined,
          retrieved_at: (r.payload?.retrieved_at ??
            r.payload?.fetched_at ??
            null) as string | null | undefined,
          chunk_index: (r.payload?.chunk_index ?? null) as
            | number
            | null
            | undefined,
        },
        // NEW: diagnostics (safe to ignore in prompt)
        debug: {
          retrieval_score: retrievalScoreById.get(String(r.id)) ?? null,
          rerank_rank: i + 1,
          rerank_score: (r as any).rerankScore ?? (r as any).score ?? null,
        },
      }),
    ),
  });

  const DEBUG = process.env.DEBUG === '1';

  const trace = reranked.map((r, i) => {
    const url = (r.payload?.url ?? r.payload?.source ?? null) as string | null;
    const title = (r.payload?.title ?? null) as string | null;
    const section_path = (r.payload?.section_path ?? null) as string | null;

    return {
      rerank_rank: i + 1,
      rerank_score: (r as any).rerankScore ?? (r as any).score ?? null,
      retrieval_score: retrievalScoreById.get(String(r.id)) ?? null,
      id: r.id,
      title,
      section_path,
      url,
    };
  });

  return NextResponse.json({
    state: answer.state,
    matchedTopics: decision.matchedTopics,
    query,
    answer: answer.answer,
    citations: answer.citations,
    debug,
    ...(DEBUG ? { trace } : undefined),
  });
}

//Quick test
// curl -s http://localhost:3000/api/query \
//   -H "Content-Type: application/json" \
//   -d '{"query":"How do I choose chunk size for RAG?"}' | jq

// curl -s http://localhost:3000/api/query \
//   -H "Content-Type: application/json" \
//   -d '{"query":"How do I choose an embedding model for RAG?"}'

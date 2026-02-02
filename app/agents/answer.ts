import { openaiClient } from '@/app/libs/openai';

export type Chunk = {
  id: string | number;
  text: string;
  citation: {
    publisher?: string | null;
    title?: string | null;
    url?: string | null;
    section_path?: string | null;
    published_date?: string | null;
    published_date_text?: string | null;
    retrieved_at?: string | null;
    chunk_index?: number | null;
  };
};

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
      Goal
      Steps
      Pitfalls
      How to test

      Question:
      ${query}

      Context:
      ${context}
      `.trim();

  const resp = await openaiClient.chat.completions.create({
    model: 'gpt-4.1-mini',
    temperature: 0.2,
    messages: [{ role: 'user', content: prompt }],
  });

  return {
    state: 'answer',
    answer: resp.choices[0]?.message?.content ?? '',
    citations: chunks.map((c, i) => ({
      ref: `#${i + 1}`,
      ...c.citation,
    })),
  };
}

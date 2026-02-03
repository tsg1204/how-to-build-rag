import { openaiClient } from '@/app/libs/openai';
import type { Chunk } from './types';

export async function generateEssay(input: { query: string; chunks: Chunk[] }) {
  const { query, chunks } = input;

  const context = chunks
    .map((c, i) => {
      const title = c.citation?.title ?? 'Untitled';
      const header = `Excerpt ${i + 1}: ${title}`;
      return `${header}\n${c.text}`.trim();
    })
    .join('\n\n---\n\n');

  const system = `
    You write short, presentation-friendly essays about building Retrieval Augmented Generation (RAG) systems.

    Rules:
    - Stay within RAG system building topics only.
    - Use ONLY the provided context.
    - Do not invent specific facts, product claims, benchmark numbers, or implementation details not supported by the context.
    - If the context is thin, write a general overview using cautious language (e.g., "typically", "often").

    Output requirements:
    - Write 2 to 3 paragraphs.
    - Each paragraph must be 2 to 5 sentences.
    - No bullet points.
    - No headings.
    `.trim();

  const user = `
    User request:
    ${query}

    Context:
    ${context || '(no context provided)'}
    `.trim();

  const resp = await openaiClient.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    temperature: 0.4,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });

  const text = resp.choices?.[0]?.message?.content?.trim() ?? '';

  return {
    state: 'answer' as const,
    answer: text,
    citations: chunks.map((c, i) => ({
      ref: String(i + 1),
      title: c.citation?.title ?? null,
    })),
  };
}

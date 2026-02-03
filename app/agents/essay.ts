import { openaiClient } from '@/app/libs/openai';
import type { Chunk } from './types';

export async function generateEssay(input: { query: string; chunks: Chunk[] }) {
  const { query, chunks } = input;

  // If evidence is very thin, produce a safe, high-level overview prompt
  const hasEnoughContext =
    chunks.length >= 2 && chunks.some((c) => c.text && c.text.length > 200);

  const context = chunks
    .map((c, i) => {
      const title = c.citation?.title ?? 'Untitled';
      const header = `Excerpt ${i + 1}: ${title}`;
      return `${header}\n${c.text}`.trim();
    })
    .join('\n\n---\n\n');

  const system = hasEnoughContext
    ? `
      You write short, presentation-friendly essays about building Retrieval Augmented Generation (RAG) systems.
      
      Hard rules:
      - Stay within RAG system building topics only.
      - Use ONLY the provided context.
      - Do not invent specific facts, benchmark numbers, or implementation details not supported by the context.
      
      Formatting rules:
      - Output exactly 2 or 3 paragraphs (choose the best fit).
      - Each paragraph must be 2 to 5 sentences.
      - No bullet points.
      - No headings.
      - No prefacing text like "Sure" or "Here is".
      `.trim()
    : `
      You write a high-level overview about building Retrieval Augmented Generation (RAG) systems.
      
      Rules:
      - Write a general overview without specific claims.
      - Use cautious language (for example: "typically", "often", "in many systems").
      - Do not reference missing sources or say that information is unavailable.
      
      Formatting rules:
      - Output exactly 2 paragraphs.
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

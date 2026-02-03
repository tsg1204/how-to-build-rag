import type { Chunk, PayloadToChunkOptions, RerankedDoc } from './types';

/**
 * Map a reranked doc + payload to Chunk for generateAnswer.
 * Used by the query route after rerank; keeps answer.ts focused on LLM + citations.
 */
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

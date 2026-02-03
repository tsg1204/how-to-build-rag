import type { RerankedDoc, TraceEntry } from './types';

/**
 * Build debug trace from reranked docs and retrieval scores.
 * Reusable for DEBUG=1 response, logging, or evals.
 */
export function buildTrace(
  reranked: RerankedDoc[],
  retrievalScoreById: Map<string, number>,
): TraceEntry[] {
  return reranked.map((r, i) => {
    const url = (r.payload?.url ?? r.payload?.source ?? null) as string | null;
    const title = (r.payload?.title ?? null) as string | null;
    const section_path = (r.payload?.section_path ?? null) as string | null;
    return {
      rerank_rank: i + 1,
      rerank_score: r.rerankScore ?? r.score ?? null,
      retrieval_score: retrievalScoreById.get(String(r.id)) ?? null,
      id: r.id,
      title,
      section_path,
      url,
    };
  });
}

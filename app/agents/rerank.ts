import { cohereClient } from "@/app/libs/cohere";

export async function rerankTopK(params: {
  query: string;
  docs: Array<{ id: string | number; text: string; score: number; payload?: Record<string, unknown> }>;
  topK: number;
}) {
  const { query, docs, topK } = params;

  // If Cohere isn't configured, just return original order
  if (!cohereClient) return docs.slice(0, topK);

  const documents = docs.map(d => d.text || "");

  const resp = await cohereClient.rerank({
    query,
    documents,
    topN: Math.min(topK, documents.length),
    model: "rerank-english-v3.0",
  });

  // Cohere returns indices into `documents`
  const reranked = resp.results
    .map(r => docs[r.index])
    .filter(Boolean);

  return reranked;
}

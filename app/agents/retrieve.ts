import { openaiClient } from '@/app/libs/openai';
import { qdrantClient, ARTICLES_COLLECTION } from '@/app/libs/qdrant';

const VECTOR_NAME = process.env.QDRANT_VECTOR_NAME; // optional
const TOP_K = Number(process.env.RAG_TOP_K ?? 8);

export type RetrievedChunk = {
  id: string | number;
  score: number;
  payload?: Record<string, unknown>;
};

export async function retrieveTopChunks(
  query: string,
): Promise<RetrievedChunk[]> {
  // 1) embed query
  const embedding = await openaiClient.embeddings.create({
    model: 'text-embedding-3-small',
    dimensions: 512,
    input: query,
  });

  // 2) qdrant search
  const candidateResults = await qdrantClient.search('articles', {
    vector: embedding.data[0].embedding,
    limit: TOP_K,
    with_payload: true,
  });

  await qdrantClient.getCollection('articles');
  console.log(candidateResults);
  // 3) normalize
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return candidateResults.map((result: any) => {
    const payload = result.payload as Record<string, unknown>;

    return {
      id: result.id,
      score: result.score,
      text:
        (payload.text as string) ||
        (payload.content as string) ||
        JSON.stringify(payload),
      payload, // ← keep this for citations
    };
  });
}

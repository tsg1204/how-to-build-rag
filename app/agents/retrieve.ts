import { openaiClient } from '@/app/libs/openai';
import { qdrantClient, ARTICLES_COLLECTION } from '@/app/libs/qdrant';

const TOP_K = Number(process.env.RAG_TOP_K ?? 8);

export type RetrievedChunk = {
  id: string | number;
  score: number;
  payload?: Record<string, unknown>;
};

export async function retrieveTopChunks(
  query: string,
  limit = TOP_K,
  topics?: string[],
): Promise<RetrievedChunk[]> {
  // 1) embed query
  const embedding = await openaiClient.embeddings.create({
    model: 'text-embedding-3-small',
    dimensions: 512,
    input: query,
  });

  // 2) qdrant search
  const filter = {
    must_not: [{ key: 'is_doc_marker', match: { value: true } }],
    ...(topics?.length
      ? { must: [{ key: 'topic', match: { any: topics } }] }
      : {}),
  };

  try {
    const candidateResults = await qdrantClient.search(ARTICLES_COLLECTION, {
      vector: embedding.data[0].embedding,
      limit,
      with_payload: true,
      with_vector: false,
      filter,
    });

    return candidateResults.map((result: any) => ({
      id: result.id,
      score: result.score,
      payload: result.payload,
    }));
  } catch (e: any) {
    console.log('QDRANT_ERROR:', e?.data?.status?.error ?? e?.message ?? e);
    throw e;
  }

  // await qdrantClient.getCollection('how_to_build_rag');
  // console.log(candidateResults);
  // // 3) normalize
  // // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // return candidateResults.map((result: any) => {
  //   const payload = result.payload as Record<string, unknown>;

  //   return {
  //     id: result.id,
  //     score: result.score,
  //     text:
  //       (payload.text as string) ||
  //       (payload.content as string) ||
  //       JSON.stringify(payload),
  //     payload, // ← keep this for citations
  //   };
  // });
}

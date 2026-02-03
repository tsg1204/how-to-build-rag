import { openaiClient } from '@/app/libs/openai';
import { qdrantClient, ARTICLES_COLLECTION } from '@/app/libs/qdrant';

const TOP_K = Number(process.env.RAG_TOP_K ?? 8);

export type RetrievedChunk = {
  id: string | number;
  score: number;
  payload?: Record<string, unknown>;
};

function isVagueQuery(q: string) {
  const s = q.trim().toLowerCase();

  // short + generic questions are usually vague
  const tokenCount = s.split(/\s+/).filter(Boolean).length;
  if (tokenCount <= 6) return true;

  // “what is / explain / overview” style
  if (
    /\bwhat is\b|\bexplain\b|\boverview\b|\bintroduction\b|\bbasics\b/.test(s)
  ) {
    return true;
  }

  return false;
}

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

    const results = candidateResults.map((result: any) => {
      const payload = result.payload as Record<string, unknown>;
      return {
        id: result.id,
        score: result.score,
        text:
          (payload.text as string) ||
          (payload.content as string) ||
          JSON.stringify(payload),
        payload,
      };
    });

    if (isVagueQuery(query)) {
      for (const r of results) {
        if (
          (r.payload?.chunk_role as string | undefined) === 'section_summary'
        ) {
          r.score = r.score * 1.15; // small boost; tune later
        }
      }
      results.sort((a, b) => b.score - a.score);
    }

    return results;
  } catch (e: any) {
    console.log('QDRANT_ERROR:', e?.data?.status?.error ?? e?.message ?? e);
    throw e;
  }
}

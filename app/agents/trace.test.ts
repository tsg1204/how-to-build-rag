import { buildTrace } from './trace';
import type { RerankedDoc } from './types';

/**
 * Fixtures shaped like rerank output after ingest: payload fields match
 * what Qdrant returns (title, url or source, section_path, publisher, etc.).
 */
function makeRerankedDoc(
  overrides: Partial<RerankedDoc> & {
    id: string | number;
    text: string;
    score: number;
  },
): RerankedDoc {
  return {
    id: overrides.id,
    text: overrides.text,
    score: overrides.score,
    payload: overrides.payload ?? {},
    ...(overrides.rerankScore != null && {
      rerankScore: overrides.rerankScore,
    }),
  };
}

describe('buildTrace', () => {
  it('maps reranked docs (real payload shape) to trace entries with retrieval scores', () => {
    const reranked: RerankedDoc[] = [
      makeRerankedDoc({
        id: '550e8400-e29b-41d4-a716-446655440001',
        text: 'Chunk size affects retrieval quality. Use 384–512 tokens with overlap for most RAG workloads.',
        score: 0.87,
        rerankScore: 0.91,
        payload: {
          title: 'How to choose chunk size for RAG',
          url: 'https://qdrant.tech/articles/chunk-size-rag',
          section_path: 'Chunking strategies',
          publisher: 'Qdrant',
          topic: 'chunking',
          chunk_index: 0,
        },
      }),
      makeRerankedDoc({
        id: '550e8400-e29b-41d4-a716-446655440002',
        text: 'Embedding dimension 512 works well with text-embedding-3-small.',
        score: 0.82,
        payload: {
          title: 'How to choose an embedding model',
          source: 'https://qdrant.tech/articles/embedding-model',
          section_path: 'Dimensions',
          publisher: 'Qdrant',
          topic: 'embeddings',
        },
      }),
      makeRerankedDoc({
        id: '550e8400-e29b-41d4-a716-446655440003',
        text: 'Minimal content for testing missing optional fields.',
        score: 0.75,
        payload: { publisher: 'Unknown' },
      }),
    ];

    const retrievalScoreById = new Map<string, number>([
      ['550e8400-e29b-41d4-a716-446655440001', 0.87],
      ['550e8400-e29b-41d4-a716-446655440002', 0.82],
      ['550e8400-e29b-41d4-a716-446655440003', 0.75],
    ]);

    const trace = buildTrace(reranked, retrievalScoreById);

    expect(trace).toHaveLength(3);

    expect(trace[0]).toEqual({
      rerank_rank: 1,
      rerank_score: 0.91,
      retrieval_score: 0.87,
      id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'How to choose chunk size for RAG',
      section_path: 'Chunking strategies',
      url: 'https://qdrant.tech/articles/chunk-size-rag',
    });

    expect(trace[1].url).toBe('https://qdrant.tech/articles/embedding-model');
    expect(trace[1].title).toBe('How to choose an embedding model');
    expect(trace[1].section_path).toBe('Dimensions');
    expect(trace[1].rerank_score).toBe(0.82);
    expect(trace[1].retrieval_score).toBe(0.82);

    expect(trace[2].title).toBeNull();
    expect(trace[2].section_path).toBeNull();
    expect(trace[2].url).toBeNull();
    expect(trace[2].rerank_score).toBe(0.75);
  });

  it('returns empty array when reranked is empty', () => {
    const trace = buildTrace([], new Map());
    expect(trace).toEqual([]);
  });
});

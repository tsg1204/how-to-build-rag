// app/libs/guardrails/query_time_topics.ts

export type QueryTimeTopic =
  | 'query_handling'
  | 'retrieval'
  | 'reranking'
  | 'prompting_grounding'
  | 'evaluation'
  | 'production_ops'
  | 'vector_storage'
  | 'embeddings'
  | 'metadata_schema'
  | 'answer_synthesis';

function dedupeKeywords(keywords: string[]) {
  return Array.from(new Set(keywords.map((k) => k.trim().toLowerCase()))).filter(Boolean);
}

/**
 * Query-time topics only:
 * - Things a user would naturally ask about
 * - Useful for routing + in-scope checks
 * - Excludes ingestion/chunking/dataset management internals by default
 */
export const queryTimeTopics: Array<{ topic: QueryTimeTopic; keywords: string[] }> = [
  {
    topic: 'query_handling',
    keywords: dedupeKeywords([
      'query',
      'intent',
      'normalization',
      'rewriting',
      'classification',
      'scope',
      'ambiguity',
      'rephrase',
      'validation',
      'refusal',
    ]),
  },
  {
    topic: 'retrieval',
    keywords: dedupeKeywords([
      'retrieval',
      'search',
      'top k',
      'hybrid',
      'bm25',
      'mmr',
      'rag',
      'database',
      'db',
      'vector',
      'query expansion',
      'similarity search',
      'recall',
      'precision',
      'candidate set',
    ]),
  },
  {
    topic: 'reranking',
    keywords: dedupeKeywords([
      'rerank',
      'reranking',
      'cross encoder',
      'cohere',
      'rag',
      'sorting',
      'ranking',
      'relevance',
      'score',
      'reranker',
      'pairwise ranking',
      'listwise ranking',
      'inference cost',
      'latency tradeoff',
      'confidence score',
    ]),
  },
  {
    topic: 'prompting_grounding',
    keywords: dedupeKeywords([
      'grounding',
      'context',
      'citations',
      'hallucination',
      'rag',
      'prompting',
      'context window',
      'context length',
      'context size',
      'citation',
      'source attribution',
      'prompt template',
      'answer faithfulness',
      'evidence',
      'context selection',
    ]),
  },
  {
    topic: 'answer_synthesis',
    keywords: dedupeKeywords([
      'synthesis',
      'answer',
      'summarization',
      'aggregation',
      'reasoning',
      'multi chunk',
      'citation stitching',
      'consistency',
      'structure',
      'faithfulness',
    ]),
  },
  {
    topic: 'metadata_schema',
    keywords: dedupeKeywords([
      'metadata',
      'schema',
      'fields',
      'attributes',
      'section path',
      'source',
      'timestamp',
      'versioning',
      'provenance',
      'auditability',
    ]),
  },
  {
    topic: 'evaluation',
    keywords: dedupeKeywords([
      'evaluation',
      'eval',
      'benchmark',
      'mteb',
      'metrics',
      'rag',
      'analysis',
      'reliability',
      'robustness',
      'safety',
      'regression',
      'ground truth',
      'relevance judgment',
      'human eval',
      'offline eval',
      'failure analysis',
    ]),
  },
  {
    topic: 'production_ops',
    keywords: dedupeKeywords([
      'latency',
      'throughput',
      'cost',
      'monitoring',
      'cache',
      'rag',
      'performance',
      'optimization',
      'scaling',
      'observability',
      'rate limiting',
      'fallback',
      'autoscaling',
      'error budget',
    ]),
  },
  {
    topic: 'vector_storage',
    keywords: dedupeKeywords([
      'qdrant',
      'payload',
      'filter',
      'collection',
      'index',
      'rag',
      'vector',
      'collections',
      'storage',
      'cluster',
      'pinecone',
      'sharding',
      'replication',
      'metadata',
      'persistence',
      'scalability',
    ]),
  },
  {
    topic: 'embeddings',
    keywords: dedupeKeywords([
      'embedding',
      'embeddings',
      'dimension',
      'tokenizer',
      'rag',
      'vector',
      'vector dimension',
      'embedding model',
      'semantic space',
      'cosine similarity',
      'distance metric',
      'encoding',
    ]),
  },
];

/**
 * Optional helpers (useful in your POST handler)
 */
export function normalizeQuery(q: string) {
  return q.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function findMatchingTopics(query: string, minHits = 1) {
  const q = ` ${normalizeQuery(query)} `;
  const hits = queryTimeTopics
    .map(({ topic, keywords }) => {
      const count = keywords.reduce((acc, kw) => {
        const needle = ` ${kw} `;
        return acc + (q.includes(needle) ? 1 : 0);
      }, 0);
      return { topic, count };
    })
    .filter((x) => x.count >= minHits)
    .sort((a, b) => b.count - a.count);

  return hits;
}

export function isQueryInScope(query: string) {
  // forgiving: any topic hit is enough
  return findMatchingTopics(query, 1).length > 0;
}

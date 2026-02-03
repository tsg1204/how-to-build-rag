/**
 * Single source of truth for RAG topics and keywords.
 * Used by guardrail (classifyQuery), ingest (inferTopic), and taxonomy (derived lists).
 * No duplicates: each topic appears once; keywords per topic are deduplicated.
 */

function dedupeKeywords(keywords: string[]): string[] {
  const seen = new Set<string>();
  return keywords.filter((k) => {
    const lower = k.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });
}

const TOPICS_RAW: ReadonlyArray<{ topic: string; keywords: string[] }> = [
  {
    topic: 'ingestion',
    keywords: dedupeKeywords([
      'rss',
      'scrape',
      'ingest',
      'parsing',
      'dedup',
      'version',
      'rag',
      'html',
      'pdf',
      'source',
      'crawler',
      'fetch',
      'normalization',
      'change detection',
    ]),
  },
  {
    topic: 'chunking',
    keywords: dedupeKeywords([
      'chunk',
      'overlap',
      'split',
      'section based',
      'rag',
      'section',
      'splitting',
      'windowing',
      'semantic boundary',
      'token limit',
      'chunk size',
      'context preservation',
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
      'reranking model',
      'reranking algorithm',
      'reranking function',
      'reranking pipeline',
      'reranking system',
      'reranking architecture',
      'reranking design',
      'reranking implementation',
      'reranking optimization',
      'reranking performance',
      'reranking scalability',
      'reranking reliability',
      'reranking robustness',
      'reranking safety',
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
      'context embedding',
      'context vector',
      'context representation',
      'citation',
      'source attribution',
      'prompt template',
      'answer faithfulness',
      'evidence',
      'context selection',
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
    topic: 'dataset_management',
    keywords: dedupeKeywords([
      'dataset',
      'refresh',
      'ingestion cadence',
      'pruning',
      'version control',
      'reindexing',
      'coverage',
      'source quality',
      'lifecycle',
      'governance',
    ]),
  },
  {
    topic: 'observability_debugging',
    keywords: dedupeKeywords([
      'observability',
      'logging',
      'tracing',
      'debugging',
      'inspection',
      'explainability',
      'failure analysis',
      'metrics',
      'alerts',
      'diagnostics',
    ]),
  },
];

export const TOPICS = TOPICS_RAW as ReadonlyArray<{
  readonly topic: string;
  readonly keywords: readonly string[];
}>;

export type TopicId = (typeof TOPICS)[number]['topic'];

/** Topic ids only (for backward compatibility with IN_SCOPE_TOPICS). */
export const IN_SCOPE_TOPICS = TOPICS.map((t) => t.topic) as readonly string[];

/** All keywords across topics, deduplicated (for backward compatibility with ALLOWLIST_KEYWORDS). */
export const ALLOWLIST_KEYWORDS = dedupeKeywords(
  TOPICS.flatMap((t) => t.keywords),
);

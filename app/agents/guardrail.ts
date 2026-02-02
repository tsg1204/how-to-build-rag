import { GuardrailDecision } from './types';

const QUERY_TOPICS = [
  {
    topic: 'ingestion',
    keywords: ['rss', 'scrape', 'ingest', 'parsing', 'dedup', 'version'],
  },
  {
    topic: 'chunking',
    keywords: ['chunk', 'overlap', 'split', 'section-based'],
  },
  {
    topic: 'embeddings',
    keywords: ['embedding', 'embeddings', 'dimension', 'tokenizer'],
  },
  {
    topic: 'vector_storage',
    keywords: ['qdrant', 'payload', 'filter', 'collection', 'index'],
  },
  {
    topic: 'retrieval',
    keywords: ['retrieval', 'search', 'top-k', 'hybrid', 'bm25', 'mmr'],
  },
  {
    topic: 'reranking',
    keywords: ['rerank', 'reranking', 'cross-encoder', 'cohere'],
  },
  {
    topic: 'prompting_grounding',
    keywords: ['grounding', 'context', 'citations', 'hallucination'],
  },
  {
    topic: 'evaluation',
    keywords: ['evaluation', 'eval', 'benchmark', 'mteb', 'metrics'],
  },
  {
    topic: 'production_ops',
    keywords: ['latency', 'throughput', 'cost', 'monitoring', 'cache'],
  },
] as const;

export function classifyQuery(query: string): GuardrailDecision {
  const q = query.toLowerCase();

  const matchedTopics = QUERY_TOPICS.filter((t) =>
    t.keywords.some((k) => q.includes(k)),
  ).map((t) => t.topic);

  if (matchedTopics.length > 0) {
    return { state: 'allow', matchedTopics };
  }

  // adjacent heuristic (LLM-ish but not RAG-framed)
  if (q.includes('llm') || q.includes('hallucination')) {
    return {
      state: 'ask_to_reframe',
      matchedTopics,
      example: 'How does retrieval reduce hallucinations in a RAG system?',
    };
  }

  return { state: 'deny', matchedTopics: [] as string[] };
}

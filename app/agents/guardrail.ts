import { GuardrailDecision } from './types';

const QUERY_TOPICS = [
  {
    topic: 'ingestion',
    keywords: ['rss', 'scrape', 'ingest', 'parsing', 'dedup', 'version', 'rag'],
  },
  {
    topic: 'chunking',
    keywords: ['chunk', 'overlap', 'split', 'section-based', 'rag'],
  },
  {
    topic: 'embeddings',
    keywords: ['embedding', 'embeddings', 'dimension', 'tokenizer', 'rag', 'vector',],
  },
  {
    topic: 'vector_storage',
    keywords: ['qdrant', 'payload', 'filter', 'collection', 'index', 'rag', 'vector','collections','storage', 'cluster'],
  },
  {
    topic: 'retrieval',
    keywords: ['retrieval', 'search', 'top-k', 'hybrid', 'bm25', 'mmr', 'rag', 'database', 'db', 'vector'],
  },
  {
    topic: 'reranking',
    keywords: ['rerank', 'reranking', 'cross-encoder', 'cohere', 'rag', 'sorting', 'ranking', 'relevance', 'score', 'reranking', 'reranker', 'reranking model', 'reranking algorithm', 'reranking function', 'reranking pipeline', 'reranking system', 'reranking architecture', 'reranking design', 'reranking implementation', 'reranking optimization', 'reranking performance', 'reranking scalability', 'reranking reliability', 'reranking robustness', 'reranking safety'],
  },
  {
    topic: 'prompting_grounding',
    keywords: ['grounding', 'context', 'citations', 'hallucination', 'rag', 'prompting', 'context window', 'context length', 'context size', 'context embedding', 'context vector', 'context representation'],
  },
  {
    topic: 'evaluation',
    keywords: ['evaluation', 'eval', 'benchmark', 'mteb', 'metrics', 'rag', 'analysis', 'reliability', 'robustness', 'safety'],
  },
  {
    topic: 'production_ops',
    keywords: ['latency', 'throughput', 'cost', 'monitoring', 'cache', 'rag', 'performance', 'optimization', 'scaling'],
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

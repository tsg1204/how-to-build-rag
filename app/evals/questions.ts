export type ExpectedState =
  | 'answer'
  | 'not_covered'
  | 'deny'
  | 'ask_to_reframe';

export type EvalCase = {
  id: string;
  query: string;
  expectedState: ExpectedState;

  // Optional expectations (keep v1 lightweight)
  expectedPublishers?: string[]; // at least one citation from these
  mustHaveHeadings?: boolean; // Goal/Steps/Pitfalls/How to test
};

export const EVAL_CASES: EvalCase[] = [
  // =========================
  // chunking
  // =========================
  {
    id: 'chunking-overview',
    query: 'What is chunking in RAG?',
    expectedState: 'answer',
    expectedPublishers: [
      'Pinecone',
      'Qdrant',
      'LangChain',
      'OpenAI',
      'Curated',
      'Medium',
    ],
    mustHaveHeadings: true,
  },
  {
    id: 'chunk-size-choice',
    query: 'How do I choose chunk size for RAG?',
    expectedState: 'answer',
    expectedPublishers: ['Pinecone', 'Qdrant', 'LangChain'],
    mustHaveHeadings: true,
  },
  {
    id: 'overlap-guidance',
    query: 'How much overlap should I use between chunks in RAG?',
    expectedState: 'answer',
    expectedPublishers: [
      'Pinecone',
      'LangChain',
      'Qdrant',
      'Curated',
      'Medium',
    ],
    mustHaveHeadings: true,
  },

  // =========================
  // embeddings
  // =========================
  {
    id: 'embedding-model-choice',
    query: 'How do I choose an embedding model for RAG?',
    expectedState: 'answer',
    expectedPublishers: ['OpenAI', 'Qdrant', 'Pinecone', 'Curated'],
    mustHaveHeadings: true,
  },
  {
    id: 'embedding-distance-metric',
    query:
      'How do I choose a distance metric (cosine vs dot vs euclidean) for embeddings in RAG?',
    expectedState: 'answer',
    expectedPublishers: ['Qdrant', 'Pinecone', 'Curated'],
    mustHaveHeadings: true,
  },

  // =========================
  // vector_storage
  // =========================
  {
    id: 'metadata-filtering',
    query: 'How do metadata filters work in a vector database for RAG?',
    expectedState: 'answer',
    expectedPublishers: ['Qdrant', 'Pinecone'],
    mustHaveHeadings: true,
  },
  {
    id: 'vector-collections-indexing',
    query:
      'How should I design collections and indexing in a vector store for a RAG system?',
    expectedState: 'answer',
    expectedPublishers: ['Qdrant', 'Pinecone', 'Curated'],
    mustHaveHeadings: true,
  },

  // =========================
  // retrieval
  // =========================
  {
    id: 'hybrid-search',
    query:
      'When should I use hybrid search (BM25 + vectors) for retrieval in RAG?',
    expectedState: 'answer',
    expectedPublishers: ['Qdrant', 'Pinecone'],
    mustHaveHeadings: true,
  },
  {
    id: 'retrieval-topk-mmr',
    query: 'How do I tune top-k and MMR for retrieval in RAG?',
    expectedState: 'answer',
    expectedPublishers: ['Pinecone', 'Qdrant', 'Curated'],
    mustHaveHeadings: true,
  },

  // =========================
  // reranking
  // =========================
  {
    id: 'reranking-when',
    query:
      'When does reranking help in RAG and what are the tradeoffs (latency/cost)?',
    expectedState: 'answer',
    expectedPublishers: ['Pinecone', 'Qdrant', 'LangChain', 'Curated'],
    mustHaveHeadings: true,
  },

  // =========================
  // prompting_grounding
  // =========================
  {
    id: 'grounding-citations',
    query:
      'How do I prompt for citations and reduce hallucinations in a RAG answer?',
    expectedState: 'answer',
    expectedPublishers: ['OpenAI', 'Curated', 'LangChain', 'Qdrant', 'Medium'],
    mustHaveHeadings: true,
  },

  // =========================
  // evaluation
  // =========================
  {
    id: 'evaluation-regression',
    query: 'How do I evaluate a RAG system and prevent regressions?',
    expectedState: 'answer',
    expectedPublishers: ['OpenAI', 'LangChain', 'Pinecone', 'Qdrant', 'Medium'],
    mustHaveHeadings: true,
  },

  // =========================
  // ingestion
  // =========================
  {
    id: 'ingestion-change-detection',
    query:
      'For RAG ingestion, how should I handle change detection and deduping when sources update over time?',
    expectedState: 'answer',
    expectedPublishers: ['OpenAI', 'Qdrant', 'Pinecone', 'Curated'],
    mustHaveHeadings: true,
  },
  {
    id: 'ingestion-html-pdf',
    query:
      'For RAG ingestion, what are common pitfalls when parsing HTML and PDF sources into clean chunks?',
    expectedState: 'answer',
    expectedPublishers: ['Curated', 'Qdrant', 'Pinecone'],
    mustHaveHeadings: true,
  },

  // =========================
  // query_handling
  // =========================
  {
    id: 'query-rewriting-scope',
    query:
      'In a RAG app, how should I handle ambiguous queries (intent classification, rewriting, and refusal)?',
    expectedState: 'answer',
    expectedPublishers: ['OpenAI', 'Curated', 'LangChain'],
    mustHaveHeadings: true,
  },

  // =========================
  // metadata_schema
  // =========================
  {
    id: 'metadata-schema-section-path',
    query:
      'What metadata schema should I store for RAG chunks (including section_path) to support auditability and citations?',
    expectedState: 'answer',
    expectedPublishers: ['Qdrant', 'Pinecone', 'Curated'],
    mustHaveHeadings: true,
  },

  // =========================
  // answer_synthesis
  // =========================
  {
    id: 'answer-synthesis-multichunk',
    query:
      'How do I synthesize an answer from multiple retrieved chunks in RAG while keeping citations correct?',
    expectedState: 'answer',
    expectedPublishers: ['OpenAI', 'Curated', 'LangChain'],
    mustHaveHeadings: true,
  },

  // =========================
  // dataset_management
  // =========================
  {
    id: 'dataset-refresh-lifecycle',
    query:
      'How should I manage a RAG dataset lifecycle (refresh cadence, pruning, and reindexing) without breaking quality?',
    expectedState: 'answer',
    expectedPublishers: ['Curated', 'OpenAI', 'Qdrant', 'Pinecone'],
    mustHaveHeadings: true,
  },

  // =========================
  // observability_debugging
  // =========================
  {
    id: 'observability-debugging-rag',
    query:
      'How do I debug RAG failures using logging/tracing and retrieval diagnostics?',
    expectedState: 'answer',
    expectedPublishers: ['Curated', 'OpenAI', 'LangChain', 'Qdrant'],
    mustHaveHeadings: true,
  },

  // =========================
  // production_ops
  // =========================
  {
    id: 'production-latency-cost',
    query:
      'How do I reduce latency and cost in a production RAG system (caching, rate limiting, fallbacks)?',
    expectedState: 'answer',
    expectedPublishers: ['OpenAI', 'Curated', 'Qdrant', 'Pinecone', 'Medium'],
    mustHaveHeadings: true,
  },

  // =========================
  // negative controls (guardrail behavior)
  // =========================
  {
    id: 'ask-to-reframe-llm-general',
    query: 'How do LLMs work?',
    expectedState: 'ask_to_reframe',
  },
  {
    id: 'deny-travel',
    query: "What's for dinner?",
    expectedState: 'deny',
  },
];

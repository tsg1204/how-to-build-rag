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
  {
    id: 'chunking-overview',
    query: 'What is chunking in RAG?',
    expectedState: 'answer',
    expectedPublishers: ['Pinecone', 'Qdrant', 'LangChain', 'OpenAI'],
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
    query: 'How much overlap should I use between chunks?',
    expectedState: 'answer',
    expectedPublishers: ['Pinecone', 'LangChain', 'Qdrant'],
    mustHaveHeadings: true,
  },
  {
    id: 'embedding-model-choice',
    query: 'How do I choose an embedding model for RAG?',
    expectedState: 'answer',
    expectedPublishers: ['Qdrant', 'OpenAI', 'Pinecone', 'Curated'],
    mustHaveHeadings: true,
  },
  {
    id: 'metadata-filtering',
    query: 'How do metadata filters work in a vector database for RAG?',
    expectedState: 'answer',
    expectedPublishers: ['Qdrant', 'Pinecone'],
    mustHaveHeadings: true,
  },
  {
    id: 'hybrid-search',
    query: 'When should I use hybrid search (BM25 + vectors) for retrieval?',
    expectedState: 'answer',
    expectedPublishers: ['Qdrant', 'Pinecone'],
    mustHaveHeadings: true,
  },
  {
    id: 'reranking-when',
    query: 'When does reranking help and what are the tradeoffs?',
    expectedState: 'answer',
    expectedPublishers: ['Pinecone', 'Qdrant', 'LangChain', 'Curated'],
    mustHaveHeadings: true,
  },
  {
    id: 'evaluation-regression',
    query: 'How do I evaluate a RAG system and prevent regressions?',
    expectedState: 'answer',
    expectedPublishers: ['OpenAI', 'LangChain', 'Pinecone', 'Qdrant'],
    mustHaveHeadings: true,
  },
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

export type SourceMode = 'rss' | 'scrape' | 'manual';

export type Source = {
  id: string;
  publisher: string;
  mode: SourceMode;

  // mode-specific
  feedUrl?: string; // rss
  listUrl?: string; // scrape
  urls?: string[]; // manual
  allowedUrlPrefixes?: string[];

  // auditability
  updateCadence: 'weekly' | 'as_needed';
  notes: string;
};

export const SOURCES: Source[] = [
  {
    id: 'openai-news',
    publisher: 'OpenAI',
    mode: 'rss',
    feedUrl: 'https://openai.com/news/rss.xml',
    allowedUrlPrefixes: ['https://openai.com/'],
    updateCadence: 'weekly',
    notes:
      'Authoritative updates; prefilter RSS titles/snippets; only ingest RAG-building content.',
  },
  {
    id: 'qdrant-articles',
    publisher: 'Qdrant',
    mode: 'scrape',
    listUrl: 'https://qdrant.tech/articles/',
    allowedUrlPrefixes: ['https://qdrant.tech/articles/'],
    updateCadence: 'weekly',
    notes:
      'Vector DB patterns, filtering, hybrid search, RAG guidance; scrape list page.',
  },
  {
    id: 'pinecone-articles',
    publisher: 'Pinecone',
    mode: 'scrape',
    listUrl: 'https://pinecone.ai/learn/',
    allowedUrlPrefixes: ['https://pinecone.ai/learn/'],
    updateCadence: 'weekly',
    notes: 'Chunking strategies, RAG knowledge systems; scrape list page.',
  },
  {
    id: 'curated-manual',
    publisher: 'Curated',
    mode: 'manual',
    urls: [
      'https://qdrant.tech/articles/agentic-builders-guide/',
      'https://www.history.com/articles/february-month-history-facts',
      'https://qdrant.tech/articles/how-to-choose-an-embedding-model',
      'https://medium.com/@jolalf/langchain-software-framework-retrieval-augmented-generation-rag-case-study-b60073d388c9/',
      'https://medium.com/python-in-plain-english/how-to-build-a-rag-system-that-actually-works-04259eb3a66f/',
      'https://www.pinecone.io/learn/chunking-strategies/',
      'https://www.pinecone.io/learn/retrieval-augmented-generation/',
    ],
    updateCadence: 'as_needed',
    notes:
      'Hand-picked practitioner posts; may include Medium (skip if blocked).',
  },
];

// export type Source = {
//   id: string;
//   publisher: string;
//   mode: 'manual' | 'rss' | 'scrape';
//   urls?: string[]; // manual
//   feedUrl?: string; // rss
//   listUrl?: string; // scrape
//   cadence: 'weekly' | 'as_needed';
//   allowedUrlPrefixes?: string[];
// };

// export const SOURCES: Source[] = [
//   {
//     id: 'qdrant-articles',
//     publisher: 'Qdrant',
//     mode: 'manual',
//     cadence: 'weekly',
//     urls: ['https://qdrant.tech/articles/how-to-choose-an-embedding-model/'],
//   },
//   {
//     id: 'qdrant-articles',
//     publisher: 'Qdrant',
//     mode: 'manual',
//     cadence: 'weekly',
//     urls: ['https://qdrant.tech/articles/agentic-builders-guide/'],
//   },
//   {
//     id: 'history-articles',
//     publisher: 'History',
//     mode: 'manual',
//     cadence: 'weekly',
//     urls: ['https://www.history.com/articles/february-month-history-facts'],
//   },
//   {
//     id: 'openai-news',
//     publisher: 'OpenAI',
//     mode: 'rss',
//     feedUrl: 'https://openai.com/news/rss.xml',
//     cadence: 'weekly',
//     allowedUrlPrefixes: ['https://openai.com/'],
//   },
//   {
//     id: 'qdrant-articles',
//     publisher: 'Qdrant',
//     mode: 'scrape',
//     listUrl: 'https://qdrant.tech/articles/',
//     cadence: 'weekly',
//     allowedUrlPrefixes: ['https://qdrant.tech/articles/'],
//   },
//   {
//     id: 'medium-articles',
//     publisher: 'Medium',
//     mode: 'manual',
//     cadence: 'weekly',
//     urls: [
//       'https://medium.com/@jolalf/langchain-software-framework-retrieval-augmented-generation-rag-case-study-b60073d388c9/',
//     ],
//   },
//   {
//     id: 'medium-articles',
//     publisher: 'Medium',
//     mode: 'manual',
//     cadence: 'weekly',
//     urls: [
//       'https://medium.com/python-in-plain-english/how-to-build-a-rag-system-that-actually-works-04259eb3a66f/',
//     ],
//   },
// ];

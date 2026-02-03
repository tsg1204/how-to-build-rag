export type AgentType = 'rag' | 'rag_essay';

export interface AgentConfig {
  name: string;
  description: string;
}

export type GuardrailDecision =
  | { state: 'allow'; matchedTopics?: string[] }
  | { state: 'ask_to_reframe'; example: string; matchedTopics?: string[] }
  | { state: 'deny'; matchedTopics: string[] };

export type Citation = {
  publisher?: string | null;
  title?: string | null;
  url?: string | null;
  section_path?: string | null;
  published_date?: string | null;
  published_date_text?: string | null;
  retrieved_at?: string | null;
  chunk_index?: number | null;
};

export type Chunk = {
  id: string | number;
  text: string;
  citation: Citation;
  debug?: {
    retrieval_score: number | null;
    rerank_rank: number;
    rerank_score: number | null;
  };
};

export type RetrievedChunk = {
  id: string | number;
  score: number;
  payload?: Record<string, unknown>;
};

/** Rerank result shape (id, text, score, payload; optional rerankScore if Cohere attaches it). */
export type RerankedDoc = {
  id: string | number;
  text: string;
  score: number;
  payload?: Record<string, unknown>;
  rerankScore?: number;
};

/** Options for mapping a reranked doc to Chunk (used by payloadToChunk). */
export type PayloadToChunkOptions = {
  retrievalScoreById: Map<string, number>;
  rerankRank: number;
  rerankScore?: number | null;
};

/** Debug trace entry for a reranked doc (e.g. for DEBUG=1 response or evals). */
export type TraceEntry = {
  rerank_rank: number;
  rerank_score: number | null;
  retrieval_score: number | null;
  id: string | number;
  title: string | null;
  section_path: string | null;
  url: string | null;
};

import { AgentType, AgentConfig } from './types';

export const agentConfigs: Record<AgentType, AgentConfig> = {
  rag: {
    name: 'RAG Assistant',
    description:
      'Answers questions about building Retrieval Augmented Generation systems, including architecture, ingestion, chunking, embeddings, retrieval, reranking, grounding, evaluation, and production considerations. Responses are structured, source grounded, and focused on practical implementation.',
  },

  rag_essay: {
    name: 'RAG Essay Agent',
    description:
      'Writes short, presentation friendly essays (2–3 paragraphs) about RAG system building topics, grounded in retrieved sources when available and optimized for clarity and narrative flow.',
  },
};

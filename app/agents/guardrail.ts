import { CORE_RAG_TERMS, TOPICS } from '@/app/data/topics';
import { GuardrailDecision } from './types';

function hasRagContext(q: string): boolean {
  return CORE_RAG_TERMS.some((term) => q.includes(term));
}

export function classifyQuery(query: string): GuardrailDecision {
  const q = query.toLowerCase();

  const matchedTopics = TOPICS.filter((t) =>
    t.keywords.some((k) => q.includes(k)),
  ).map((t) => t.topic);

  if (matchedTopics.length > 0 && hasRagContext(q)) {
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

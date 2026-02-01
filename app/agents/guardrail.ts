import { ALLOWLIST_KEYWORDS } from './taxonomy';
import { GuardrailDecision } from './types';

export function classifyQuery(query: string): GuardrailDecision {
  const q = query.toLowerCase();

  const matches = ALLOWLIST_KEYWORDS.some((k) => q.includes(k));

  if (matches) {
    return { state: 'allow' };
  }

  // adjacent heuristic (LLM-ish but not RAG-framed)
  if (q.includes('llm') || q.includes('hallucination')) {
    return {
      state: 'ask_to_reframe',
      example: 'How does retrieval reduce hallucinations in a RAG system?',
    };
  }

  return { state: 'deny' };
}

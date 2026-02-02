export type GuardrailDecision =
  | { state: 'allow'; matchedTopics?: string[] }
  | { state: 'ask_to_reframe'; example: string; matchedTopics?: string[] }
  | { state: 'deny'; matchedTopics: string[] };

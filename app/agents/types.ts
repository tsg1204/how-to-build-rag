export type GuardrailDecision =
  | { state: 'allow' }
  | { state: 'ask_to_reframe'; example: string }
  | { state: 'deny' };

import { classifyQuery } from './guardrail';

describe('Guardrail routing', () => {
  it('denies clearly out-of-scope queries', () => {
    const r = classifyQuery('What is the capital of Spain?');
    expect(r.state).toBe('deny');
  });

  it('asks to reframe adjacent AI questions', () => {
    const r = classifyQuery('How do LLMs work?');
    expect(r.state).toBe('ask_to_reframe');
  });

  it('allows in-scope RAG build questions', () => {
    const r = classifyQuery('How do I choose chunk size for RAG?');
    expect(r.state).toBe('allow');
  });

  it('allows evaluation questions framed as RAG', () => {
    const r = classifyQuery('How do I evaluate a RAG system?');
    expect(r.state).toBe('allow');
  });

  it('denies topic match without RAG context (require RAG context)', () => {
    const r = classifyQuery('How do I improve query performance?');
    expect(r.state).toBe('deny');
  });
});

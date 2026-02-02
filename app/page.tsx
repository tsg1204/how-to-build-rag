'use client';

import { useState } from 'react';

type QueryResponse = {
  state: 'answer' | 'not_covered' | 'deny' | 'ask_to_reframe';
  query: string;
  answer?: string;
  citations?: Array<{
    ref: string;
    title?: string | null;
    url?: string | null;
    section_path?: string | null;
  }>;
  message?: string;
  example?: string;
};

export default function Page() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const json = await res.json();
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: '40px auto', padding: 16 }}>
      <h1>How to Build RAG</h1>

      <textarea
        rows={4}
        placeholder="Ask a RAG-building question…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: '100%', padding: 12 }}
      />

      <button
        onClick={ask}
        disabled={loading}
        style={{ marginTop: 12, padding: '8px 16px' }}
      >
        {loading ? 'Thinking…' : 'Ask'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {data?.answer && (
        <>
          <hr style={{ margin: '24px 0' }} />
          <pre style={{ whiteSpace: 'pre-wrap' }}>{data.answer}</pre>
        </>
      )}

      {data && data.citations && data.citations.length > 0 && (
        <>
          <h3>Citations</h3>
          <ul>
            {data.citations.map((c) => (
              <li key={c.ref}>
                <strong>{c.ref}</strong> {c.title}
                {c.section_path ? ` — ${c.section_path}` : ''}
                {c.url && (
                  <>
                    {' '}
                    <a href={c.url} target="_blank" rel="noreferrer">
                      link
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {data?.state === 'not_covered' && (
        <p>
          <em>{data.message}</em>
        </p>
      )}
      {data?.state === 'deny' && (
        <p style={{ color: '#555', fontStyle: 'italic' }}>{data.message}</p>
      )}

      {data?.state === 'ask_to_reframe' && (
        <p style={{ color: '#555' }}>
          {data.message}
          {data.example && (
            <>
              <br />
              <strong>Example:</strong> {data.example}
            </>
          )}
        </p>
      )}
    </main>
  );
}

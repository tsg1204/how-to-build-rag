'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

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

  function toMarkdown(answer: string) {
    const withHeadings = answer
      .replace(/^\s*Goal\s*:?\s*$/m, '## Goal')
      .replace(/^\s*Steps\s*:?\s*$/m, '## Steps')
      .replace(/^\s*Pitfalls\s*:?\s*$/m, '## Pitfalls')
      .replace(/^\s*How to test\s*:?\s*$/m, '## How to test');

    return withHeadings.replace(
      /## Steps\s*\n+([\s\S]*?)(\n## |\n*$)/,
      (_, block, next) => {
        const lines = block
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);

        const bullets = lines.map((l) => `- ${l}`).join('\n');
        return `## Steps\n${bullets}${next}`;
      },
    );
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
          <div style={{ lineHeight: 1.5 }}>
            <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <h2
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      marginTop: 18,
                      marginBottom: 8,
                    }}
                  >
                    {children}
                  </h2>
                ),
                ul: ({ children }) => (
                  <ul
                    style={{
                      paddingLeft: 22,
                      listStyleType: 'disc',
                      marginTop: 8,
                      marginBottom: 8,
                    }}
                  >
                    {children}
                  </ul>
                ),
                li: ({ children }) => (
                  <li style={{ marginBottom: 6 }}>{children}</li>
                ),
                p: ({ children }) => (
                  <p style={{ marginBottom: 10 }}>{children}</p>
                ),
              }}
            >
              {data.answer}
            </ReactMarkdown>
          </div>
        </>
      )}

      {data?.citations?.length ? (
        <>
          <h3>Citations</h3>
          <ol
            style={{ listStyleType: 'decimal', paddingLeft: 22, marginTop: 8 }}
          >
            {Array.from(
              new Map(
                data.citations.map((c) => [
                  `${c.url ?? ''}::${c.section_path ?? ''}::${c.title ?? ''}`,
                  c,
                ]),
              ).values(),
            ).map((c, i) => (
              <li key={`${c.ref}-${i}`} style={{ marginBottom: 6 }}>
                <em>{c.title}</em>
                {c.section_path ? ` — ${c.section_path}` : ''}
                {c.url ? (
                  <>
                    {' '}
                    <a href={c.url} target="_blank" rel="noreferrer">
                      link
                    </a>
                  </>
                ) : null}
              </li>
            ))}
          </ol>
        </>
      ) : null}

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

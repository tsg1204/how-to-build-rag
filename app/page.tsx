'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

type QueryResponse = {
  state: 'answer' | 'not_covered' | 'deny' | 'ask_to_reframe';
  mode?: 'answer' | 'essay';
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
  const [mode, setMode] = useState<'answer' | 'essay'>('answer');

  async function ask() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, mode }),
      });
      const json = await res.json();
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  const WRAP: React.CSSProperties = {
    whiteSpace: 'normal',
    overflowWrap: 'anywhere',
    wordBreak: 'break-all',
    maxWidth: '100%',
  };

  return (
    <main style={{ maxWidth: 900, margin: '40px auto', padding: 16 }}>
      <h1 style={{ margin: 0 }}>How to Build RAG</h1>
      <p
        style={{
          margin: 0,
          marginBottom: 10,
          fontSize: 14,
          color: '#ccc',
          letterSpacing: '0.01em',
        }}
      >
        Structured, source-grounded guidance for building RAG systems — with an
        Essay mode for long-form synthesis.
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'right',
          gap: 12,
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, color: '#ccc' }}>Mode</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'answer' | 'essay')}
            disabled={loading}
            style={{
              padding: '8px 10px',
              border: '1px solid #ccc',
              borderRadius: 6,
              fontSize: 14,
              background: '#111',
            }}
          >
            <option value="answer">Answer</option>
            <option value="essay">Essay</option>
          </select>
        </label>
      </div>

      <textarea
        rows={4}
        placeholder="Ask a RAG-building question…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: '100%',
          padding: 12,
          border: '1px solid #ccc',
          borderRadius: 6,
          fontSize: 14,
        }}
      />

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button
          onClick={ask}
          disabled={loading}
          style={{
            padding: '10px 18px',
            background: '#111',
            color: '#fff',
            border: '1px solid #ccc',
            borderRadius: 6,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Thinking…' : 'Submit'}
        </button>

        <button
          onClick={() => {
            setQuery('');
            setData(null);
            setError(null);
          }}
          style={{
            padding: '10px 18px',
            background: '#111',
            border: '1px solid #ccc',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Answer window — always visible */}
      <div
        style={{
          marginTop: 24,
          padding: 16,
          border: '1px solid #ddd',
          borderRadius: 8,
          background: '#111',
          minHeight: 200,
          maxHeight: 420,
          overflowY: 'auto',
          overflowX: 'hidden',
          maxWidth: '100%',
          minWidth: 0,
        }}
      >
        {data?.answer ? (
          <div
            style={{
              whiteSpace: 'normal',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              maxWidth: '100%',
              minWidth: 0,
            }}
          >
            <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <h2
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      marginTop: 18,
                      marginBottom: 8,
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                    }}
                  >
                    {children}
                  </h2>
                ),
                p: ({ children }) => (
                  <p
                    style={{
                      marginBottom: 10,
                      whiteSpace: 'normal',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                    }}
                  >
                    {children}
                  </p>
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
                  <li
                    style={{
                      marginBottom: 6,
                      whiteSpace: 'normal',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                    }}
                  >
                    {children}
                  </li>
                ),
                pre: ({ children }) => (
                  <pre
                    style={{
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                      marginTop: 8,
                      marginBottom: 8,
                      padding: 12,
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: 6,
                      overflow: 'auto',
                      maxWidth: '100%',
                      minWidth: 0,
                    }}
                  >
                    {children}
                  </pre>
                ),
                code: ({ children }) => (
                  <code
                    style={{
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                    }}
                  >
                    {children}
                  </code>
                ),
              }}
            >
              {data.answer}
            </ReactMarkdown>
          </div>
        ) : (
          <span style={{ color: '#777' }}>The answer will appear here.</span>
        )}
      </div>

      {/* Citations window  Answer move only*/}
      {data?.mode !== 'essay' && data?.citations?.length ? (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            border: '1px solid #ddd',
            borderRadius: 8,
            background: '#111',
            color: '#fff',
            maxHeight: 220,
            overflowY: 'auto',
            overflowX: 'hidden',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
          }}
        >
          <h3 style={{ marginTop: 0 }}>Citations</h3>
          <ol style={{ listStyleType: 'decimal', paddingLeft: 22 }}>
            {Array.from(
              new Map(
                data.citations.map((c) => [
                  `${c.url ?? ''}::${c.section_path ?? ''}::${c.title ?? ''}`,
                  c,
                ]),
              ).values(),
            ).map((c, i) => (
              <li key={`${c.ref}-${i}`} style={{ marginBottom: 6, ...WRAP }}>
                <em>{c.title}</em>
                {c.section_path ? ` — ${c.section_path}` : ''}
                {c.url ? (
                  <>
                    {' '}
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ ...WRAP, display: 'inline-block' }}
                    >
                      {c.url}
                    </a>
                  </>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
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

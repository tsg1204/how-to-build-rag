import { NextRequest, NextResponse } from 'next/server';
import { classifyQuery } from '@/app/agents/guardrail';
import { retrieveTopChunks } from '@/app/agents/retrieve';
import { rerankTopK } from '@/app/agents/rerank';
import { cohereClient } from '../../libs/cohere';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const query = typeof body?.query === 'string' ? body.query.trim() : '';

  if (!query) {
    return NextResponse.json(
      { error: "Missing 'query' (string) in request body." },
      { status: 400 },
    );
  }

  const decision = classifyQuery(query);

  if (decision.state === 'deny') {
    return NextResponse.json(
      {
        state: 'deny',
        message:
          'This assistant is limited to questions about building RAG systems (retrieval, chunking, evaluation, etc.).',
      },
      { status: 200 },
    );
  }

  if (decision.state === 'ask_to_reframe') {
    return NextResponse.json(
      {
        state: 'ask_to_reframe',
        message:
          'This assistant focuses on how to build RAG systems. Please reframe your question as a RAG-building question.',
        example: decision.example,
      },
      { status: 200 },
    );
  }

  // allow → retrieve (stub: return chunks only)
  //const chunks = await retrieveTopChunks(query);

  const topK = Number(process.env.RAG_TOP_K ?? 8);
  const candidateLimit = Math.max(topK * 3, 20);

  const candidates = await retrieveTopChunks(query, candidateLimit);

  // IMPORTANT: ensure text exists for reranker
  const candidateDocs = candidates.map((c) => ({
    ...c,
    text: (c.payload?.text ?? '') as string,
  }));

  const reranked = await rerankTopK({
    query,
    docs: candidateDocs,
    topK,
  });

  return NextResponse.json(
    {
      state: 'allow',
      query,
      candidate_count: candidates.length,
      retrieved_count: reranked.length,
      reranked: Boolean(cohereClient),
      results: reranked.map((c) => {
        const p = c.payload || {};
        return {
          id: c.id,
          score: c.score,
          text: p.text,
          citation: {
            publisher: p.publisher ?? null,
            title: p.title ?? null,
            url: p.url ?? p.source ?? null,
            section_path: p.section_path ?? null,
            published_date: p.published_date ?? null,
            published_date_text: p.published_date_text ?? null,
            retrieved_at: p.retrieved_at ?? p.fetched_at ?? null,
            chunk_key: p.chunk_key ?? null,
            chunk_index: p.chunk_index ?? null,
          },
        };
      }),
      note: 'Retrieval is wired. Answer generation comes next.',
    },
    { status: 200 },
  );
}

//Quick test
// curl -s http://localhost:3000/api/query \
//   -H "Content-Type: application/json" \
//   -d '{"query":"How do I choose chunk size for RAG?"}' | jq

// curl -s http://localhost:3000/api/query \
//   -H "Content-Type: application/json" \
//   -d '{"query":"How do I choose an embedding model for RAG?"}'

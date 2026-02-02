import { NextRequest, NextResponse } from 'next/server';
import { classifyQuery } from '@/app/agents/guardrail';
import { retrieveTopChunks } from '@/app/agents/retrieve';
import { rerankTopK } from '@/app/agents/rerank';
import { generateAnswer, type Chunk } from '@/app/agents/answer';

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

  const answer = await generateAnswer({
    query,
    chunks: reranked.map(
      (r): Chunk => ({
        id: r.id,
        text: r.text ?? '',
        citation: {
          publisher: (r.payload?.publisher ?? null) as
            | string
            | null
            | undefined,
          title: (r.payload?.title ?? null) as string | null | undefined,
          url: (r.payload?.url ?? r.payload?.source ?? null) as
            | string
            | null
            | undefined,
          section_path: (r.payload?.section_path ?? null) as
            | string
            | null
            | undefined,
          published_date: (r.payload?.published_date ?? null) as
            | string
            | null
            | undefined,
          published_date_text: (r.payload?.published_date_text ?? null) as
            | string
            | null
            | undefined,
          retrieved_at: (r.payload?.retrieved_at ??
            r.payload?.fetched_at ??
            null) as string | null | undefined,
          chunk_index: (r.payload?.chunk_index ?? null) as
            | number
            | null
            | undefined,
        },
      }),
    ),
  });

  return NextResponse.json({
    state: answer.state,
    query,
    answer: answer.answer,
    citations: answer.citations,
  });
}

//Quick test
// curl -s http://localhost:3000/api/query \
//   -H "Content-Type: application/json" \
//   -d '{"query":"How do I choose chunk size for RAG?"}' | jq

// curl -s http://localhost:3000/api/query \
//   -H "Content-Type: application/json" \
//   -d '{"query":"How do I choose an embedding model for RAG?"}'

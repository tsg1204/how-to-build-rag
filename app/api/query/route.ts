import { NextRequest, NextResponse } from 'next/server';
import { classifyQuery } from '@/app/agents/guardrail';
import { retrieveTopChunks } from '@/app/agents/retrieve';

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
  const chunks = await retrieveTopChunks(query);

  return NextResponse.json(
    {
      state: 'allow',
      query,
      retrieved_count: chunks.length,
      results: chunks.map((c) => ({
        id: c.id,
        score: c.score,
        // keep this flexible to match your existing payload shape
        publisher: c.payload?.publisher,
        title: c.payload?.title,
        url: c.payload?.url,
        published_date: c.payload?.published_date,
        section_path: c.payload?.section_path,
        chunk_index: c.payload?.chunk_index,
        text: c.payload?.text ?? c.payload?.content,
      })),
      note: 'Retrieval is wired. Answer generation comes next.',
    },
    { status: 200 },
  );
}

//Quick test
// curl -s http://localhost:3000/api/query \
//   -H "Content-Type: application/json" \
//   -d '{"query":"How do I choose chunk size for RAG?"}' | jq


import { NextRequest, NextResponse } from 'next/server';
import { generateAnswer, payloadToChunk } from '@/app/agents/answer';
import { classifyQuery } from '@/app/agents/guardrail';
import { retrieveTopChunks } from '@/app/agents/retrieve';
import { rerankTopK } from '@/app/agents/rerank';
import { buildTrace } from '@/app/agents/trace';
import type { RerankedDoc } from '@/app/agents/types';

function dedupeByChunkKey<T extends { payload?: Record<string, unknown> }>(
  items: T[],
) {
  const seen = new Set<string>();
  const out: T[] = [];

  for (const it of items) {
    const p = it.payload ?? {};
    const key =
      (p.chunk_key as string | undefined) ??
      `${p.doc_id ?? p.url ?? 'doc'}::${p.section_path ?? 'sec'}::${p.chunk_index ?? 'x'}`;

    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }

  return out;
}

export async function POST(req: NextRequest) {
  try {
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
          matchedTopics: decision.matchedTopics || [],
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
          matchedTopics: decision.matchedTopics,
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

    const candidatesRaw = await retrieveTopChunks(
      query,
      candidateLimit,
      decision.matchedTopics,
    );

    let candidates = dedupeByChunkKey(candidatesRaw);
    if (candidates.length === 0) {
      // fallback: no topic filter
      candidates = await retrieveTopChunks(query, candidateLimit);
    }

    const debug = {
      candidateLimit,
      candidatesRawCount: candidatesRaw.length,
      candidatesDedupedCount: candidates.length,
    };

    // IMPORTANT: ensure text exists for reranker
    const candidateDocs = candidates.map((c) => ({
      ...c,
      text: (c.payload?.text ?? '') as string,
    }));

    if (candidates.length === 0) {
      return NextResponse.json({
        state: 'not_covered',
        query,
        message: 'Not covered by the dataset.',
        matchedTopics: decision.matchedTopics,
      });
    }

    const reranked = await rerankTopK({
      query,
      docs: candidateDocs,
      topK,
    });

    const retrievalScoreById = new Map(
      candidates.map((c) => [String(c.id), c.score]),
    );

    const chunks = reranked.map((r, i) =>
      payloadToChunk(r as RerankedDoc, {
        retrievalScoreById,
        rerankRank: i + 1,
      }),
    );

    const answer = await generateAnswer({ query, chunks });

    const DEBUG = process.env.DEBUG === '1';
    const trace = buildTrace(reranked, retrievalScoreById);

    return NextResponse.json({
      state: answer.state,
      matchedTopics: decision.matchedTopics,
      query,
      answer: answer.answer,
      citations: answer.citations,
      debug,
      ...(DEBUG ? { trace } : undefined),
    });
  } catch (e: unknown) {
    console.error('API_QUERY_ERROR', e);
    return NextResponse.json(
      {
        state: 'error',
        message: e instanceof Error ? e.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

//Quick test
// curl -s http://localhost:3000/api/query \
//   -H "Content-Type: application/json" \
//   -d '{"query":"How do I choose chunk size for RAG?"}' | jq

// curl -s http://localhost:3000/api/query \
//   -H "Content-Type: application/json" \
//   -d '{"query":"How do I choose an embedding model for RAG?"}'

import crypto from 'crypto';
import * as cheerio from 'cheerio';
import { qdrantClient, ARTICLES_COLLECTION } from '@/app/libs/qdrant';
import { openaiClient } from '@/app/libs/openai';

const MAX_CHARS = 3800;
const OVERLAP_CHARS = 400;

function sha256(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

function cleanText(s: string) {
  return s.replace(/\s+/g, ' ').trim();
}

function chunkWithOverlap(text: string) {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + MAX_CHARS, text.length);
    const slice = text.slice(start, end).trim();
    if (slice) chunks.push(slice);

    if (end === text.length) break;
    start = Math.max(0, end - OVERLAP_CHARS);
  }

  return chunks;
}

const TOPICS = [
  {
    topic: 'ingestion',
    keywords: ['rss', 'scrape', 'parsing', 'html', 'pdf', 'dedup', 'version'],
  },
  { topic: 'chunking', keywords: ['chunk', 'overlap', 'section', 'splitting'] },
  {
    topic: 'embeddings',
    keywords: ['embedding', 'embeddings', 'vector dimension', 'tokenizer'],
  },
  {
    topic: 'vector_storage',
    keywords: ['qdrant', 'payload', 'filter', 'collection', 'index'],
  },
  {
    topic: 'retrieval',
    keywords: ['retrieval', 'top-k', 'hybrid', 'bm25', 'mmr', 'search'],
  },
  {
    topic: 'reranking',
    keywords: ['rerank', 'reranking', 'cross-encoder', 'cohere'],
  },
  {
    topic: 'prompting_grounding',
    keywords: ['grounding', 'context', 'citations', 'hallucination'],
  },
  {
    topic: 'evaluation',
    keywords: [
      'evaluation',
      'eval',
      'benchmark',
      'mteb',
      'metrics',
      'regression',
    ],
  },
  {
    topic: 'production_ops',
    keywords: ['latency', 'throughput', 'cost', 'monitoring', 'cache'],
  },
] as const;

function inferTopic(title: string, sectionPath: string, text: string): string {
  const hay = `${title}\n${sectionPath}\n${text}`.toLowerCase();
  for (const t of TOPICS) {
    if (t.keywords.some((k) => hay.includes(k))) return t.topic;
  }
  return 'unknown';
}

let payloadIndexesEnsured = false;

/** Create payload indexes required for scroll filters. Called once when first needed. */
async function ensurePayloadIndexes() {
  if (payloadIndexesEnsured) return;
  const indexes: Array<{
    field_name: string;
    field_schema: 'keyword' | 'bool';
  }> = [
    { field_name: 'doc_id', field_schema: 'keyword' },
    { field_name: 'content_hash', field_schema: 'keyword' },
    { field_name: 'is_doc_marker', field_schema: 'bool' },
    { field_name: 'topic', field_schema: 'keyword' },
  ];
  for (const { field_name, field_schema } of indexes) {
    try {
      await qdrantClient.createPayloadIndex(ARTICLES_COLLECTION, {
        field_name,
        field_schema,
        wait: true,
      });
      console.log(`Created payload index: ${field_name}`);
    } catch (e: unknown) {
      const err = e as {
        data?: { status?: { error?: string } };
        status?: number;
      };
      const msg = err.data?.status?.error ?? '';
      if (err.status === 400 && /already exists|already exist/i.test(msg)) {
        continue;
      }
      throw e;
    }
  }
  payloadIndexesEnsured = true;
}

async function alreadyIngested(docId: string, contentHash: string) {
  const doScroll = () =>
    qdrantClient.scroll(ARTICLES_COLLECTION, {
      limit: 1,
      with_payload: true,
      with_vector: false,
      filter: {
        must: [
          { key: 'doc_id', match: { value: docId } },
          { key: 'content_hash', match: { value: contentHash } },
          { key: 'is_doc_marker', match: { value: true } },
        ],
      },
    });

  try {
    const res = await doScroll();
    return (res.points?.length ?? 0) > 0;
  } catch (e: unknown) {
    const err = e as {
      data?: { status?: { error?: string } };
      status?: number;
    };
    const msg = err.data?.status?.error ?? '';
    if (err.status === 400 && /Index required but not found/i.test(msg)) {
      await ensurePayloadIndexes();
      const res = await doScroll();
      return (res.points?.length ?? 0) > 0;
    }
    throw e;
  }
}

function passesRelevanceFilter(title: string, text: string) {
  const hay = `${title}\n${text}`.toLowerCase();

  const allow = [
    // core RAG / retrieval
    'rag',
    'retrieval',
    'rerank',
    'reranking',
    'hybrid search',
    'bm25',
    'mmr',
    'grounding',
    'citations',
    'context window',

    // embeddings / vectors
    'embedding',
    'embeddings',
    'vector',
    'vector database',

    // evaluation / reliability
    'eval',
    'evals',
    'evaluation',
    'benchmark',
    'hallucination',
    'reliability',
    'robust',
    'safety',

    // agents (allowed only if relevant)
    'agent',
    'agents',
    'tool calling',
    'function calling',
  ];

  return allow.some((k) => hay.includes(k));
}

export async function ingestUrl(params: {
  url: string;
  publisher: string;
  dataset: string;
}) {
  const { url, publisher, dataset } = params;

  const fetchedAt = new Date().toISOString();

  function looksBlocked(html: string) {
    const h = html.toLowerCase();
    return (
      h.includes('just a moment') ||
      h.includes('checking your browser') ||
      h.includes('cf-chl') || // cloudflare challenge marker
      h.includes('cloudflare')
    );
  }

  // 1) fetch + parse
  const html = await fetch(url, {
    headers: {
      'user-agent': 'how-to-build-rag-ingester/1.0',
      accept: 'text/html,*/*',
      'accept-language': 'en-US,en;q=0.9',
    },
  }).then((r) => r.text());

  if (looksBlocked(html)) {
    console.log('→ skipped: blocked by site (Cloudflare / anti-bot)');
    return 0;
  }

  const $ = cheerio.load(html);

  const title =
    cleanText($("meta[property='og:title']").attr('content') || '') ||
    cleanText($('title').text()) ||
    'Untitled';

  const ogDescription =
    cleanText($("meta[property='og:description']").attr('content') || '') ||
    cleanText($("meta[name='description']").attr('content') || '') ||
    '';

  const publishedDate =
    $('time[datetime]').attr('datetime') ||
    $("meta[property='article:published_time']").attr('content') ||
    '';

  const publishedDateText =
    cleanText($('time').first().text()) ||
    cleanText($("meta[name='date']").attr('content') || '') ||
    null;

  const $root = $('article').first().length
    ? $('article').first()
    : $('body').first();

  // 2) section-based chunking (H2/H3)
  type Section = { sectionPath: string; text: string };
  const sections: Section[] = [];

  let currentPath = 'Intro';
  let buffer: string[] = [];

  function flush() {
    const text = cleanText(buffer.join('\n'));
    if (text) sections.push({ sectionPath: currentPath, text });
    buffer = [];
  }

  $root.find('h2, h3, p, li').each((_, el) => {
    const tag = el.tagName?.toLowerCase();
    const t = cleanText($(el).text());
    if (!t) return;

    if (tag === 'h2' || tag === 'h3') {
      flush();
      if (tag === 'h2') currentPath = t;
      else currentPath = `${currentPath} → ${t}`;
    } else {
      buffer.push(t);
    }
  });

  flush();

  // Fallback: some sites (like OpenAI) may not expose much in <article> / <p> in a way we capture.
  // If extracted text is too small, seed Intro with meta description so relevance + embeddings work.

  const totalExtractedChars = sections.reduce((n, s) => n + s.text.length, 0);
  if (totalExtractedChars < 400 && ogDescription) {
    sections.unshift({ sectionPath: 'Intro', text: ogDescription });
  }

  const extractedChars = sections.reduce((n, s) => n + s.text.length, 0);

  // Fallback: if extraction is weak, seed Intro with title + description
  if (extractedChars < 800) {
    const fallback = cleanText(
      [title, ogDescription].filter(Boolean).join('\n\n'),
    );
    if (fallback) {
      sections.unshift({ sectionPath: 'Intro', text: fallback });
    }
  }

  const sampleText =
    `${title}\n\n` +
    sections
      .map((s) => s.text)
      .join('\n\n')
      .slice(0, 20000);

  console.log('RELEVANCE_SAMPLE:', sampleText.slice(0, 300));
  console.log('EXTRACTED_CHARS:', sampleText.length);

  if (!passesRelevanceFilter(title, sampleText)) {
    console.log('→ skipped: failed relevance filter');
    return 0;
  }

  // 3) doc identity + versioning
  const docId = url;
  const contentHash = sha256(
    sections.map((s) => `${s.sectionPath}\n${s.text}`).join('\n\n'),
  );

  if (await alreadyIngested(docId, contentHash)) {
    console.log('→ unchanged, skipping (content_hash already ingested)');
    return 0;
  }

  const docVersion = fetchedAt;

  // 4) build chunk payloads
  const chunkPayloads: Array<{
    id: string;
    text: string;
    payload: Record<string, unknown>;
  }> = [];

  for (const sec of sections) {
    const secChunks = chunkWithOverlap(sec.text);

    secChunks.forEach((chunkText, i) => {
      const pointId = crypto.randomUUID();
      const chunkKey = `${docId}::${sec.sectionPath}::chunk:${i}`;
      const topic = inferTopic(title, sec.sectionPath, chunkText);

      chunkPayloads.push({
        id: pointId,
        text: chunkText,
        payload: {
          dataset,
          publisher,
          title,
          url,
          source: url,
          published_date: publishedDate || null,
          published_date_text: publishedDateText,
          retrieved_at: fetchedAt,
          fetched_at: fetchedAt,
          doc_id: docId,
          doc_version: docVersion,
          content_hash: contentHash,
          section_path: sec.sectionPath,
          chunk_key: chunkKey,
          chunk_index: i,
          total_chunks: secChunks.length,
          text: chunkText,
          topic,
        },
      });
    });
  }

  // 5) embed + upsert
  const points = [];
  for (const item of chunkPayloads) {
    const emb = await openaiClient.embeddings.create({
      model: 'text-embedding-3-small',
      dimensions: 512,
      input: item.text,
    });

    points.push({
      id: item.id,
      vector: emb.data[0].embedding,
      payload: item.payload,
    });
  }

  await qdrantClient.upsert(ARTICLES_COLLECTION, { points });

  await qdrantClient.upsert(ARTICLES_COLLECTION, {
    points: [
      {
        id: crypto.randomUUID(),
        vector: points[0]?.vector ?? new Array(512).fill(0), // ok for marker
        payload: {
          dataset,
          publisher,
          title,
          url,
          doc_id: docId,
          doc_version: docVersion,
          content_hash: contentHash,
          is_doc_marker: true,
          fetched_at: fetchedAt,
        },
      },
    ],
  });

  return points.length;
}

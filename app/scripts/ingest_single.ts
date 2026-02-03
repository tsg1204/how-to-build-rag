import crypto from 'crypto';
import 'dotenv/config';
import * as cheerio from 'cheerio';
import { qdrantClient, ARTICLES_COLLECTION } from '@/app/libs/qdrant';
import { openaiClient } from '@/app/libs/openai';
import { cleanText, chunkWithOverlap, sha256 } from '@/app/libs/text';

const URL = 'https://qdrant.tech/articles/how-to-choose-an-embedding-model/';
const PUBLISHER = 'Qdrant';

async function run() {
  const fetchedAt = new Date().toISOString();

  // 1) fetch + parse
  const html = await fetch(URL).then((r) => r.text());
  const $ = cheerio.load(html);

  const title =
    cleanText($("meta[property='og:title']").attr('content') || '') ||
    cleanText($('title').text()) ||
    'Untitled';

  const publishedDate =
    $('time[datetime]').attr('datetime') ||
    $("meta[property='article:published_time']").attr('content') ||
    '';

  // Try to scope to article; fallback to body
  const $root = $('article').first().length
    ? $('article').first()
    : $('body').first();

  // 2) build section-based blocks using H2/H3 headings
  type Section = { sectionPath: string; text: string };
  const sections: Section[] = [];

  let currentPath = 'Intro';
  let buffer: string[] = [];

  function flush() {
    const text = cleanText(buffer.join('\n'));
    if (text) sections.push({ sectionPath: currentPath, text });
    buffer = [];
  }

  // Walk content in order
  $root.find('h2, h3, p, li').each((_, el) => {
    const tag = el.tagName?.toLowerCase();
    const t = cleanText($(el).text());
    if (!t) return;

    if (tag === 'h2' || tag === 'h3') {
      flush();
      // Simple section_path (H2 > H3)
      if (tag === 'h2') currentPath = t;
      else currentPath = `${currentPath} → ${t}`;
    } else {
      buffer.push(t);
    }
  });

  flush();

  // 3) doc identity + versioning (minimal)
  const docId = URL; // stable
  const contentHash = sha256(
    sections.map((s) => `${s.sectionPath}\n${s.text}`).join('\n\n'),
  );
  const docVersion = fetchedAt; // simple versioning for now

  // 4) create chunks per section with overlap
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

      chunkPayloads.push({
        id: pointId,
        text: chunkText,
        payload: {
          //keep a stable readable key for debugging and citations
          chunk_key: chunkKey,
          dataset: 'how-to-build-rag',
          publisher: PUBLISHER,
          title,
          url: URL,
          source: URL,
          published_date: publishedDate || null,
          published_date_text:
            cleanText($('time').first().text()) ||
            cleanText($("meta[name='date']").attr('content') || '') ||
            null,
          fetched_at: fetchedAt,
          doc_id: docId,
          doc_version: docVersion,
          content_hash: contentHash,
          section_path: sec.sectionPath,
          chunk_index: i,
          // total_chunks for this section (not whole doc; good enough for v1)
          total_chunks: secChunks.length,
          text: chunkText,
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

  console.log(
    `Ingested ${points.length} chunks from "${title}" into collection "${ARTICLES_COLLECTION}".`,
  );
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

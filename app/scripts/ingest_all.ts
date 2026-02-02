import 'dotenv/config';
import * as cheerio from 'cheerio';
import { SOURCES } from './sources';
import { ingestUrl } from '@/app/scripts/ingest_one';
import { discoverRssItems } from './discover_rss';

async function discoverFromListPage(
  listUrl: string,
  allowedPrefixes?: string[],
) {
  const html = await fetch(listUrl).then((r) => r.text());
  const $ = cheerio.load(html);

  const urls = new Set<string>();

  $('a[href]').each((_, a) => {
    const href = $(a).attr('href');
    if (!href) return;

    // make absolute
    const abs = href.startsWith('http')
      ? href
      : new URL(href, listUrl).toString();

    if (allowedPrefixes?.length) {
      if (!allowedPrefixes.some((p) => abs.startsWith(p))) return;
    }

    urls.add(abs);
  });

  return Array.from(urls);
}

async function run() {
  let total = 0;

  for (const src of SOURCES) {
    if (src.mode === 'manual') {
      console.log(
        `\n[source] id=${src.id} publisher=${src.publisher} mode=${src.mode} cadence=${src.updateCadence}`,
      );
      console.log(`[source-notes] ${src.notes}`);
      for (const url of src.urls ?? []) {
        console.log(`\n[manual] Ingesting: ${url}`);
        const count = await ingestUrl({
          url,
          publisher: src.publisher,
          dataset: 'how-to-build-rag',
        });
        total += count;
        console.log(`→ upserted ${count} chunks`);
      }
    }

    if (src.mode === 'scrape') {
      console.log(
        `\n[source] id=${src.id} publisher=${src.publisher} mode=${src.mode} cadence=${src.updateCadence}`,
      );
      console.log(`[source-notes] ${src.notes}`);
      console.log(`\n[scrape] Discovering from: ${src.listUrl}`);
      const discovered = await discoverFromListPage(
        src.listUrl ?? '',
        src.allowedUrlPrefixes,
      );

      // basic: prefer article pages, skip the list page itself
      const urls = discovered
        .filter((u) => u !== src.listUrl)
        .filter((u) => u.includes('/articles/'));

      console.log(`Discovered ${urls.length} URLs`);

      // v1: ingest only first N to avoid runaway
      const N = Number(process.env.INGEST_DISCOVERY_LIMIT ?? 10);
      for (const url of urls.slice(0, N)) {
        console.log(`\n[scrape] Ingesting: ${url}`);
        const count = await ingestUrl({
          url,
          publisher: src.publisher,
          dataset: 'how-to-build-rag',
        });
        total += count;
        console.log(`→ upserted ${count} chunks`);
      }
    }

    if (src.mode === 'rss') {
      console.log(
        `\n[source] id=${src.id} publisher=${src.publisher} mode=${src.mode} cadence=${src.updateCadence}`,
      );
      console.log(`[source-notes] ${src.notes}`);
      console.log(`\n[rss] Discovering from: ${src.feedUrl}`);

      const limit = Number(process.env.INGEST_DISCOVERY_LIMIT ?? 20);
      const rawItems = await discoverRssItems(src.feedUrl!, limit);

      const allowed = [
        'rag',
        'retrieval',
        'embedding',
        'embeddings',
        'eval',
        'evals',
        'evaluation',
        'grounding',
        'hallucination',
        'vector',
        'search',
        'rerank',
        'reranking',
        'agents',
        'tool',
        'function calling',
        'reliability',
        'safety',
      ];

      const items = rawItems.filter((it) => {
        const t = `${it.title}\n${it.snippet}`.toLowerCase();
        return allowed.some((k) => t.includes(k));
      });

      const urls = (
        src.allowedUrlPrefixes?.length
          ? items
              .map((it) => it.url)
              .filter((u) =>
                src.allowedUrlPrefixes!.some((p) => u.startsWith(p)),
              )
          : items.map((it) => it.url)
      ).slice(0, Number(process.env.INGEST_RSS_INGEST_LIMIT ?? 5));

      console.log(`Discovered ${rawItems.length} items (raw)`);
      console.log(`Candidate ${items.length} items (keyword match)`);
      console.log(`Ingesting ${urls.length} URLs`);

      for (const url of urls) {
        console.log(`\n[rss] Ingesting: ${url}`);
        const count = await ingestUrl({
          url,
          publisher: src.publisher,
          dataset: 'how-to-build-rag',
        });
        total += count;
        console.log(`→ upserted ${count} chunks`);
      }
    }
  }

  console.log(`\nDone. Total chunks upserted: ${total}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

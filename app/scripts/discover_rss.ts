import Parser from 'rss-parser';

export type RssDiscoveredItem = {
  url: string;
  title: string;
  snippet: string;
  isoDate?: string | null;
};

type RssItem = {
  title?: string;
  link?: string;
  contentSnippet?: string;
  isoDate?: string;
};

const parser = new Parser<RssItem>();

export async function discoverRssItems(feedUrl: string, limit = 20) {
  const res = await fetch(feedUrl, {
    redirect: 'follow',
    headers: {
      'user-agent': 'how-to-build-rag-ingester/1.0',
      accept:
        'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.1',
    },
  });

  if (!res.ok) {
    throw new Error(`RSS fetch failed: ${res.status} ${res.statusText}`);
  }

  const xml = await res.text();
  const feed = await parser.parseString(xml);

  const items: RssDiscoveredItem[] = (feed.items ?? [])
    .map((it) => ({
      url: it.link ?? '',
      title: it.title ?? '',
      snippet: it.contentSnippet ?? '',
      isoDate: it.isoDate ?? null,
    }))
    .filter((it) => it.url.startsWith('http'))
    .slice(0, limit);

  return items;
}

// async function run() {
//   const rssSources = SOURCES.filter((s) => s.mode === "rss");

//   if (rssSources.length === 0) {
//     console.log("No RSS sources configured.");
//     return;
//   }

//   for (const src of rssSources) {
//     if (!src.feedUrl) continue;

//     console.log(`\nRSS: ${src.publisher}`);
//     console.log(`Feed: ${src.feedUrl}`);

//     const urls = await discoverRssUrls(src.feedUrl, 10);

//     console.log("Discovered:");
//     for (const u of urls) console.log(" -", u);
//   }
// }

// run().catch((e) => {
//   console.error(e);
//   process.exit(1);
// });

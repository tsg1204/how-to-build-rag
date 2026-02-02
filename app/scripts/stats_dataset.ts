import 'dotenv/config';
import { qdrantClient, ARTICLES_COLLECTION } from '@/app/libs/qdrant';

async function run() {
  const res = await qdrantClient.scroll(ARTICLES_COLLECTION, {
    limit: 10000,
    with_payload: true,
    with_vector: false,
    filter: {
      must_not: [{ key: 'is_doc_marker', match: { value: true } }],
    },
  });

  const points = res.points ?? [];

  const docIds = new Set<string>();
  const urls = new Set<string>();

  for (const p of points as any[]) {
    const pl = p.payload ?? {};
    if (typeof pl.doc_id === 'string') docIds.add(pl.doc_id);
    if (typeof pl.url === 'string') urls.add(pl.url);
  }

  console.log('chunks:', points.length);
  console.log('unique doc_id:', docIds.size);
  console.log('unique url:', urls.size);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

import "dotenv/config";
import { qdrantClient, ARTICLES_COLLECTION } from "@/app/libs/qdrant";

type Point = {
  id: string | number;
  payload?: Record<string, unknown> | null;
};

function getTs(p: Record<string, unknown>) {
  // prefer retrieved_at, then fetched_at, then doc_version
  const t = p.retrieved_at ?? p.fetched_at ?? p.doc_version ?? null;
  const ms = t ? Date.parse(String(t)) : NaN;
  return Number.isFinite(ms) ? ms : 0;
}

function getChunkKey(p: Record<string, unknown>) {
  // prefer explicit chunk_key, otherwise fall back to stable composite
  if (p.chunk_key) return String(p.chunk_key);
  const doc = p.doc_id ?? p.url ?? "unknown_doc";
  const sec = p.section_path ?? "unknown_section";
  const idx = p.chunk_index ?? "x";
  return `${doc}::${sec}::chunk:${idx}`;
}

async function scrollAllNonMarkers() {
  const all: Point[] = [];
  let offset: string | number | undefined = undefined;

  while (true) {
    const res = await qdrantClient.scroll(ARTICLES_COLLECTION, {
      limit: 256,
      offset,
      with_payload: true,
      with_vector: false,
      filter: {
        must_not: [{ key: "is_doc_marker", match: { value: true } }],
      },
    });

    all.push(...((res.points ?? []) as Point[]));
    offset = (res as { next_page_offset: string | number | undefined }).next_page_offset;

    if (!offset) break;
  }

  return all;
}

async function deleteInBatches(ids: Array<string | number>, batchSize = 256) {
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    await qdrantClient.delete(ARTICLES_COLLECTION, {
      points: batch,
      wait: true,
    });
    console.log(`Deleted ${batch.length} points`);
  }
}

async function run() {
  const DRY_RUN = (process.env.DRY_RUN ?? "1") === "1";
  console.log(`Collection: ${ARTICLES_COLLECTION}`);
  console.log(`DRY_RUN=${DRY_RUN ? "1 (no deletes)" : "0 (will delete)"}`);

  const points = await scrollAllNonMarkers();
  console.log(`Fetched ${points.length} non-marker points`);

  // group by chunk_key
  const keepByKey = new Map<string, { id: string | number; ts: number }>();
  const dupIds: Array<string | number> = [];

  for (const pt of points) {
    const payload = (pt.payload ?? {}) as Record<string, any>;
    const key = getChunkKey(payload);
    const ts = getTs(payload);

    const existing = keepByKey.get(key);
    if (!existing) {
      keepByKey.set(key, { id: pt.id, ts });
      continue;
    }

    // keep the newest; mark the other as duplicate
    if (ts >= existing.ts) {
      dupIds.push(existing.id);
      keepByKey.set(key, { id: pt.id, ts });
    } else {
      dupIds.push(pt.id);
    }
  }

  console.log(`Unique chunk_keys: ${keepByKey.size}`);
  console.log(`Duplicates to delete: ${dupIds.length}`);

  if (dupIds.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  if (DRY_RUN) {
    console.log("Dry run mode: not deleting. Set DRY_RUN=0 to delete.");
    console.log("Example duplicate IDs:", dupIds.slice(0, 10));
    return;
  }

  await deleteInBatches(dupIds, 256);
  console.log("Done.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

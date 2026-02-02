import "dotenv/config";
import { qdrantClient, ARTICLES_COLLECTION } from "@/app/libs/qdrant";

async function run() {
  console.log("Collection:", ARTICLES_COLLECTION);

  try {
    await qdrantClient.createPayloadIndex(ARTICLES_COLLECTION, {
      field_name: "topic",
      field_schema: "keyword",
      wait: true,
    });
    console.log('✅ Created payload index: "topic"');
  } catch (e: any) {
    const msg = e?.data?.status?.error ?? e?.message ?? String(e);
    // Qdrant returns 400 if index already exists
    if (e?.status === 400 && /already exists|already exist/i.test(msg)) {
      console.log('ℹ️ Index "topic" already exists');
      return;
    }
    console.error("❌ Failed to create index:", msg);
    throw e;
  }
}

run().catch(() => process.exit(1));

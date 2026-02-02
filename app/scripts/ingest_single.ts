import { qdrantClient, ARTICLES_COLLECTION } from '@/app/libs/qdrant';
import { openaiClient } from '@/app/libs/openai';
import "dotenv/config";


const URL = 'https://qdrant.tech/articles/how-to-choose-an-embedding-model/';

async function run() {
  // 1) fetch
  const html = await fetch(URL).then((r) => r.text());

  // 2) VERY simple text extraction (good enough for first doc)
  const text = html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 3) chunk (single chunk for now)
  const chunkText = text.slice(0, 4000);

  // 4) embed
  const emb = await openaiClient.embeddings.create({
    model: 'text-embedding-3-small',
    dimensions: 512,
    input: chunkText,
  });

  // 5) upsert
  await qdrantClient.upsert(ARTICLES_COLLECTION, {
    points: [
      {
        id: crypto.randomUUID(),
        vector: emb.data[0].embedding,
        payload: {
          text: chunkText,
          publisher: 'Qdrant',
          title: 'How to choose an embedding model',
          url: URL,
          source: URL,
          dataset: 'how-to-build-rag',
        },
      },
    ],
  });

  console.log('Ingested 1 document');
}

run();

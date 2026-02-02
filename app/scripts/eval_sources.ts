import "dotenv/config";

const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

/**
 * v1 evaluation = regression test on sources/citations, not answer quality.
 * Each test asserts: if we answer, at least one citation URL matches expected.
 */
type EvalCase = {
  id: string;
  query: string;
  expectedUrlSubstrings: string[]; // at least one must appear in citations[].url
  allowNotCovered?: boolean; // if dataset is too small, "not_covered" is acceptable
};

const CASES: EvalCase[] = [
  {
    id: "qdrant-embeddings",
    query: "How do I choose an embedding model for RAG?",
    expectedUrlSubstrings: ["qdrant.tech/articles/how-to-choose-an-embedding-model"],
    allowNotCovered: true,
  },
  {
    id: "chunking-basics",
    query: "How do I choose chunk size for RAG?",
    expectedUrlSubstrings: [
      // add the URL of your chunking article once you ingest it
      // "pinecone.io/learn/chunking-strategies",
    ],
    allowNotCovered: true,
  },
];

function normalize(s: string) {
  return s.trim().toLowerCase();
}

async function callApi(query: string) {
  const res = await fetch(`${BASE_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  const json = await res.json().catch(() => ({}));
  return { res, json };
}

function extractCitationUrls(json: any): string[] {
  const citations = Array.isArray(json?.citations) ? json.citations : [];
  return citations
    .map((c: any) => (typeof c?.url === "string" ? c.url : ""))
    .filter(Boolean);
}

async function run() {
  let pass = 0;
  let fail = 0;

  for (const t of CASES) {
    const { res, json } = await callApi(t.query);
    const state = json?.state;

    const urls = extractCitationUrls(json).map(normalize);

    // If expected list is empty, we skip source assertion (useful while building dataset)
    const hasExpectation = t.expectedUrlSubstrings.length > 0;

    const matched = hasExpectation
      ? t.expectedUrlSubstrings
          .map(normalize)
          .some((needle) => urls.some((u) => u.includes(needle)))
      : true;

    const okState =
      state === "answer" ||
      (t.allowNotCovered && state === "not_covered") ||
      state === "deny" ||
      state === "ask_to_reframe";

    const ok =
      res.ok &&
      okState &&
      // only enforce source match if we actually answered (and have expectations)
      (state !== "answer" ? true : matched);

    if (ok) {
      pass++;
      console.log(`✅ [${t.id}] state=${state}`);
      if (state === "answer") {
        console.log(`   citations=${urls.length}`);
      }
    } else {
      fail++;
      console.log(`❌ [${t.id}]`);
      console.log(`   http=${res.status} state=${state}`);
      console.log(`   expected=${JSON.stringify(t.expectedUrlSubstrings)}`);
      console.log(`   got_urls=${JSON.stringify(urls.slice(0, 5))}${urls.length > 5 ? "..." : ""}`);
      console.log(`   body=${JSON.stringify(json).slice(0, 400)}...`);
    }
  }

  console.log(`\nDone. pass=${pass} fail=${fail}`);
  process.exit(fail ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

import "dotenv/config";

const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

const TESTS = [
  // in-scope
  { query: "How do I choose chunk size for RAG?", expectState: ["answer", "not_covered"] },
  { query: "How do I choose an embedding model for RAG?", expectState: ["answer", "not_covered"] },

  // out-of-scope
  { query: "What is the capital of Spain?", expectState: ["deny", "ask_to_reframe"] },
] as const;

async function run() {
  let pass = 0;
  let fail = 0;

  for (const t of TESTS) {
    const res = await fetch(`${BASE_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: t.query }),
    });

    const json = await res.json().catch(() => ({}));

    const okState = t.expectState.includes(json.state);
    const hasCitations = Array.isArray(json.citations) ? json.citations.length > 0 : false;

    // For "answer", require citations (v1 requirement)
    const okCitations = json.state !== "answer" ? true : hasCitations;

    const ok = res.ok && okState && okCitations;

    if (ok) {
      pass++;
      console.log(`✅ ${t.query} → state=${json.state} citations=${hasCitations ? json.citations.length : 0}`);
    } else {
      fail++;
      console.log(`❌ ${t.query}`);
      console.log(`   http=${res.status} state=${json.state}`);
      console.log(`   citations=${hasCitations ? json.citations.length : 0}`);
      console.log(`   body=${JSON.stringify(json).slice(0, 300)}...`);
    }
  }

  console.log(`\nDone. pass=${pass} fail=${fail}`);
  process.exit(fail ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

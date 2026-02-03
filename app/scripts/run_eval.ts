import 'dotenv/config';
import { EVAL_CASES } from '@/app/evals/questions';

type ApiResponse = {
  state: 'answer' | 'not_covered' | 'deny' | 'ask_to_reframe';
  query: string;
  answer?: string;
  citations?: Array<{
    publisher?: string | null;
    title?: string | null;
    url?: string | null;
    section_path?: string | null;
    published_date?: string | null;
    retrieved_at?: string | null;
  }>;
  message?: string;
  example?: string;
};

function hasRequiredHeadings(md: string) {
  // strict enough to catch format drift, not too strict about whitespace
  const needed = ['## Goal', '## Steps', '## Pitfalls', '## How to test'];
  return needed.every((h) => md.includes(h));
}

function uniqKey(c: any) {
  return `${c.url ?? ''}::${c.section_path ?? ''}::${c.title ?? ''}`;
}

async function postQuery(q: string): Promise<ApiResponse> {
  const base = process.env.EVAL_BASE_URL ?? 'http://localhost:3000';
  const res = await fetch(`${base}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q }),
  });

  const ct = res.headers.get('content-type') ?? '';

  // If server returned HTML or non-JSON, surface it cleanly
  if (!ct.includes('application/json')) {
    const text = await res.text();
    throw new Error(
      `Non-JSON response status=${res.status} content-type=${ct} head=${JSON.stringify(
        text.slice(0, 120),
      )}`,
    );
  }

  const json = (await res.json()) as ApiResponse;
  return json;
}

async function run() {
  console.log(`[eval] cases=${EVAL_CASES.length}`);
  console.log(
    `[eval] base=${process.env.EVAL_BASE_URL ?? 'http://localhost:3000'}`,
  );

  let passed = 0;

  for (const tc of EVAL_CASES) {
    const out: string[] = [];
    let ok = true;

    let resp: ApiResponse | null = null;
    try {
      resp = await postQuery(tc.query);
    } catch (e: any) {
      ok = false;
      out.push(`request_failed: ${e?.message ?? String(e)}`);
    }

    if (resp) {
      if (resp.state !== tc.expectedState) {
        ok = false;
        out.push(`state: expected=${tc.expectedState} got=${resp.state}`);
      }

      if (tc.mustHaveHeadings && resp.state === 'answer') {
        const a = resp.answer ?? '';
        if (!hasRequiredHeadings(a)) {
          ok = false;
          out.push(`format: missing required headings`);
        }
      }

      if (tc.expectedPublishers?.length && resp.state === 'answer') {
        const pubs = (resp.citations ?? [])
          .map((c) => (c.publisher ?? '').trim())
          .filter(Boolean);

        const hit = tc.expectedPublishers.some((p) => pubs.includes(p));
        if (!hit) {
          ok = false;
          out.push(
            `citations: expected >=1 publisher in [${tc.expectedPublishers.join(
              ', ',
            )}] got=[${Array.from(new Set(pubs)).join(', ') || '(none)'}]`,
          );
        }
      }

      // Extra quality checks (v1, lightweight)
      if (resp.state === 'answer') {
        const cits = resp.citations ?? [];
        if (cits.length === 0) {
          ok = false;
          out.push(`citations: empty`);
        } else {
          const unique = new Set(cits.map(uniqKey)).size;
          if (unique !== cits.length) {
            // not always fatal, but usually indicates dedupe drift
            out.push(`note: citations not unique (${unique}/${cits.length})`);
          }
        }
      }
    }

    if (ok) passed++;

    const status = ok ? 'PASS' : 'FAIL';
    console.log(`\n[${status}] ${tc.id}`);
    console.log(`query: ${tc.query}`);
    if (resp) console.log(`state: ${resp.state}`);
    if (out.length) console.log(out.map((x) => `- ${x}`).join('\n'));
  }

  console.log(`\n[eval] passed=${passed}/${EVAL_CASES.length}`);
  process.exit(passed === EVAL_CASES.length ? 0 : 1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

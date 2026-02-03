# Refactoring suggestions

## 1. Single source of truth for topics / taxonomy

**Problem:** Topic and keyword definitions live in three places with slight differences:

- `app/agents/guardrail.ts` — `QUERY_TOPICS` (for classifyQuery)
- `app/scripts/ingest_one.ts` — `TOPICS` (for inferTopic and payload)
- `app/agents/taxonomy.ts` — `IN_SCOPE_TOPICS`, `ALLOWLIST_KEYWORDS` (flat lists)

**Suggestion:** Move to one shared module, e.g. `app/data/topics.ts` or extend `app/agents/taxonomy.ts`, exporting a single structure:

```ts
// e.g. app/data/topics.ts
export const TOPICS = [
  { topic: 'ingestion', keywords: ['rss', 'scrape', ...] },
  { topic: 'chunking', keywords: ['chunk', 'overlap', ...] },
  // ...
] as const;

export type TopicId = (typeof TOPICS)[number]['topic'];
```

Then:

- `guardrail.ts` imports `TOPICS` and uses it for `classifyQuery`.
- `ingest_one.ts` imports `TOPICS` for `inferTopic` and payload; remove local `TOPICS`.
- `taxonomy.ts` either re-exports from this module or is deprecated in favor of it.

This avoids drift (e.g. reranking keywords in guardrail but not in ingest) and keeps evals/scripts aligned.

---

## 2. Shared text / ingest utilities

**Problem:** The same helpers are duplicated in `ingest_one.ts` and `ingest_single.ts`:

- `sha256`, `cleanText`, `chunkWithOverlap`
- Constants: `MAX_CHARS`, `OVERLAP_CHARS`

**Suggestion:** Add a small shared module, e.g. `app/lib/text.ts` (or `app/scripts/utils.ts` if you want scripts-only):

```ts
// app/lib/text.ts
export function sha256(s: string): string { ... }
export function cleanText(s: string): string { ... }
export function chunkWithOverlap(text: string, maxChars?: number, overlapChars?: number): string[] { ... }
export const DEFAULT_CHUNK_MAX_CHARS = 3800;
export const DEFAULT_CHUNK_OVERLAP_CHARS = 400;
```

- `ingest_one.ts` and `ingest_single.ts` import from here and delete their local copies.
- Keeps chunking behavior identical and easier to tune in one place.

---

## 3. Shared URL / citation helpers

**Problem:** `canonicalUrl`-style logic exists in:

- `app/agents/answer.ts` — `canonicalUrl(u?: string | null)` for citation dedupe
- `app/scripts/ingest_one.ts` — `canonicalUrl(u: string)` for URL normalization

**Suggestion:** Put a single implementation in `app/lib/url.ts` (or `app/lib/citation.ts`):

```ts
export function canonicalUrl(u?: string | null): string { ... }
```

Use it from both `answer.ts` and `ingest_one.ts` so normalization rules stay consistent.

---

## 4. Centralize chunk and citation types

**Problem:**

- `Chunk` and citation shape are defined in `app/agents/answer.ts`.
- `RetrievedChunk` is in `app/agents/retrieve.ts`.
- The API route contains a long inline mapping from reranked results + payload → `Chunk` (with citation and debug fields).

**Suggestion:**

- Move shared types to `app/agents/types.ts` (or `app/types/chunks.ts`): e.g. `Chunk`, `Citation`, `RetrievedChunk`, and a payload type for Qdrant points.
- Add one mapper function, e.g. `payloadToChunk(point, options?)`, that takes a rerank result (id, text, payload, score) and returns `Chunk`. The route then does:

  `chunks: reranked.map((r, i) => payloadToChunk(r, { retrievalScoreById, rerankRank: i + 1 }))`

- Benefits: route stays short, mapping is testable, and citation/debug fields stay consistent (no `(r as any).score`).

---

## 5. Thin API route and reuse mappers

**Problem:** `app/api/query/route.ts` mixes parsing, guardrail, retrieve, rerank, answer, dedupe, and a large inline “reranked → Chunk” and “trace” mapping.

**Suggestion:**

- Keep the route as an orchestrator: parse body → guardrail → retrieve (with optional topic filter) → dedupe → rerank → map to chunks → generateAnswer → format JSON.
- Move “reranked + scores → Chunk[]” into the shared mapper (see §4).
- Move “reranked → trace[]” into a small helper (e.g. `buildTrace(reranked, retrievalScoreById)`) in the same module or in agents, and call it from the route. That keeps the route readable and trace logic reusable (e.g. for logging or evals).

---

## 6. Remove `any` and tighten types

**Problem:**

- `app/agents/retrieve.ts`: `candidateResults.map((result: any) => ...)` and `catch (e: any)`.
- `app/api/query/route.ts`: `(r as any).rerankScore ?? (r as any).score` when building chunks/trace.
- `app/scripts/run_eval.ts`: `uniqKey(c: any)`.

**Suggestion:**

- In retrieve: type the Qdrant search result (or use the client’s `ScoredPoint` type if available) and use `unknown` in catch, then narrow.
- In the route: once you have `payloadToChunk` and a typed rerank result (e.g. `{ id, text, payload, score?, rerankScore? }`), the route no longer needs `any`.
- In run_eval: define a small type for the citation shape (e.g. `{ url?: string; section_path?: string; title?: string }`) and use it for `uniqKey`.

---

## 7. Unify or clearly split ingest scripts

**Problem:** `ingest_one.ts` (multi-URL, TOPICS, section summaries, etc.) and `ingest_single.ts` (single URL, similar chunking and parsing) duplicate a lot of logic.

**Suggestion (pick one direction):**

- **Option A:** Make `ingest_single.ts` a thin wrapper that calls the same core used by `ingest_one.ts` (e.g. “fetch URL → parse HTML → sections → chunks → embed → upsert”) with a single-URL config. That way chunking, parsing, and payload building live in one place.
- **Option B:** Keep two scripts but move all shared pieces (chunking, cleanText, sha256, section extraction, payload shape) into `app/lib/` or `app/scripts/shared/` and have both scripts import from there. Then the scripts only differ in “where do URLs come from” and “single vs batch.”

---

## 8. Centralize config and model names

**Problem:** `RAG_TOP_K`, embedding dimensions (512), and model names (e.g. `gpt-4.1-mini`, `text-embedding-3-small`, `rerank-english-v3.0`) are read from env or hardcoded in several files.

**Suggestion:** Add `app/config/rag.ts` (or `app/lib/config.ts`) that exports:

- `RAG_TOP_K`, `RAG_CANDIDATE_LIMIT` (or derive from TOP_K)
- `EMBEDDING_DIMENSIONS`, `EMBEDDING_MODEL`
- `RERANK_MODEL`, `ANSWER_MODEL`

and use these in retrieve, rerank, answer, and the route. Easier to change models or limits in one place and to document env vars.

---

## Priority order

1. **High impact, low risk:** §2 (shared text utils), §4 (chunk types + mapper), §6 (remove `any`).
2. **High impact, some work:** §1 (single topics source), §5 (thin route + trace helper).
3. **Nice to have:** §3 (shared URL util), §7 (unify ingest), §8 (config module).

Implementing §2 and §4 first will already simplify the route and scripts; then §1 and §5 make the pipeline easier to extend and test.

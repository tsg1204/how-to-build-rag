# TOPICS list — breadth assessment

## Is it too broad?

**Yes.** The current list is broad enough that many **non–RAG-building** questions can be allowed.

### Why

1. **Matching is substring-only**  
   `q.includes(k)` means any query that _contains_ a keyword (e.g. "query", "context", "answer") is allowed. There is no requirement that the question is about _building RAG_.

2. **Very generic single-word keywords**  
   These can match general tech / product questions that are not about RAG:
   - **query** (query_handling) — "How do I optimize my query?" could be SQL, API, or RAG.
   - **context** (prompting_grounding) — "What is context in NLP?" can match without mentioning RAG.
   - **answer** (answer_synthesis) — "How do I answer user questions?" is generic.
   - **source** (ingestion, metadata_schema) — "primary source", "data source", "source code" are generic.
   - **metrics**, **cost**, **latency**, **performance**, **scaling**, **monitoring**, **cache** — common in any infra/SRE question.
   - **metadata**, **schema**, **fields**, **reasoning**, **evidence**, **logging**, **tracing** — broad tech/NLP terms.

3. **Newer topics are especially generic**
   - **query_handling**: "query", "classification", "validation", "refusal" — many non-RAG questions use these words.
   - **metadata_schema**: "metadata", "schema", "timestamp", "versioning" — generic.
   - **answer_synthesis**: "answer", "reasoning", "evidence", "structure" — broad.
   - **observability_debugging**: "logging", "tracing", "metrics", "alerts" — generic ops.

4. **"rag" is in many topics**  
   That helps when the user says "rag", but questions that never mention RAG can still match other keywords (e.g. "How to improve query performance?" → query_handling + retrieval terms).

### Options to tighten

1. **Require RAG context**  
   Only allow if the query contains at least one **core RAG term** (e.g. "rag", "retrieval", "retrieve", "chunk", "embedding", "vector search", "citation") _in addition to_ a topic keyword. That keeps the same topic list but reduces off-topic allows.

2. **Slim keywords**
   - Drop the most generic single words: e.g. "query", "context", "answer", "source", "metrics", "metadata", "schema", "reasoning", "evidence", "logging", "tracing" as standalone keywords.
   - Prefer phrases: "context window", "query rewriting", "answer synthesis", "embedding model", "chunk size", "top k", etc.

3. **Fewer / more specific topics**  
   Merge or drop very broad topics (e.g. query_handling, metadata_schema, observability_debugging) or restrict them to clearly RAG-specific phrases only.

4. **Stricter matching**  
   Use word-boundary or phrase matching instead of raw substring (e.g. "context" only when part of "context window" or "context length") to cut accidental matches.

Recommendation: start with **(1) require RAG context** in the guardrail so you keep the current TOPICS list but only allow when the user is clearly in the RAG-building space.

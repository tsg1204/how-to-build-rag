# How to Build RAG

A **citation-grounded RAG assistant** that answers practical questions about **how to build Retrieval-Augmented Generation (RAG) systems**, based on a curated dataset of high-quality articles and notes.

This project is intentionally **narrow in scope**: it focuses on _implementation guidance_, not general AI theory or chat.

## Project Goal

Build a RAG system that answers **“How do I…?”** questions about building RAG systems, such as:

    *   How should I chunk documents for retrieval?

    *   When does reranking help, and when does it hurt?

    *   How do I design hybrid search with metadata filtering?

    *   How do I evaluate RAG quality and detect regressions?

Each answer is:

    *   structured

    *   grounded in retrieved sources

    *   explicitly cited (article + section + date when available)

## Target User

Builders implementing a RAG system, including:

    *   students

    *   software engineers

    *   researchers

The assistant is designed for users who want:

    *   clear steps

    *   tradeoffs and pitfalls

    *   debugging and validation guidance

    *   traceable citations

## What the System Does (v1 Scope)

For in-scope questions, the assistant returns answers in a consistent format:

    Goal

    Steps

    Pitfalls

    How to test

Additional guarantees:

    *   Sources are cited (publisher, article, section).

    *   Newer sources are preferred when guidance conflicts.

    *   If a question is not covered by the dataset, the system explicitly says so.

## Dataset (v1)

The initial dataset consists of ~12 high-signal documents from:

    *   OpenAI (News & Developer Blog)

    *   Qdrant (blog & docs)

    *   Pinecone (blog & learning resources)

    *   LangChain / LlamaIndex (conceptual design posts only)

    *   Independent practitioner blogs (curated)

    *   Author notes (project-specific markdown)

Content is ingested via:

    *   RSS feeds (preferred)

    *   scraping list pages (fallback)

    *   manual URLs (for curated sources)

All documents are versioned and chunked before embedding.

## Chunking Strategy (v1)

    *   Section-based chunking using headings (H2/H3)

    *   Target size: ~350–700 tokens

    *   Light overlap (10–15%)

    *   Each chunk stores rich metadata, including:

        *   source

        *   published date

        *   section path

        *   document version

Long sections may also include a short **section summary chunk** to improve retrieval for vague queries.

## Query Guardrails

This assistant only answers questions related to **building RAG systems**.

Each query is classified as:

    *   **In-scope** → answered using retrieval

    *   **Adjacent** → user is asked to reframe as a RAG question

    *   **Out-of-scope** → politely rejected

No retrieval happens unless the query is in-scope.

## Project Structure

```
how-to-build-rag/
├── app/
│   ├── agents/           # guardrails, answer formatting, logic
│   ├── api/              # API routes
│   ├── libs/             # Shared utilities
│   ├── scripts/          # ingestion & maintenance scripts
│   └── page.tsx          # Main application
```

The project uses **Next.js + TypeScript** for:

    *   API routes

    *   ingestion workflows

    *   a lightweight UI for testing and inspection

## Non-Goals (v1)

    *   No real-time ingestion

    *   No general chatbot behavior

    *   No answers outside the RAG taxonomy

    *   No framework-specific tutorials

This project prioritizes **clarity, correctness, and traceability** over breadth.

## Status

This project is under active development.v1 focuses on dataset quality, guardrails, and correct retrieval behavior.

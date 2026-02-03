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

## Essay Mode (Presentation-Oriented Output)

In addition to the standard question–answer flow, this project supports an **Essay mode** designed for writing short, presentation-friendly explanations about building Retrieval-Augmented Generation (RAG) systems.

### Purpose

Essay mode is intended for:

- presentation slides and speaker notes
- short written explanations or introductions
- high-level overviews of RAG concepts

Unlike the QA mode, which optimizes for precision and structured answers, Essay mode optimizes for **narrative flow and clarity**, while remaining grounded in retrieved sources.

### Design Principles

- **Same pipeline, different output**
  Essay mode reuses the same query classification, retrieval, reranking, and chunking pipeline as QA mode. Only the final generation step differs.

- **Grounded, not creative writing**
  The essay generator is constrained to use retrieved context only. If evidence is limited, it produces a cautious, high-level overview rather than inventing specifics.

- **Format guarantees**
  Essay responses are:
  - 2–3 paragraphs
  - no bullet points
  - no headings
  - written in a presentation-friendly tone

- **Minimal provenance noise**
  Citations are not emphasized in the essay text itself to preserve readability. (QA mode remains the authoritative, citation-forward interface.)

### Why this is not a separate “agent registry”

Essay mode is implemented as an **output mode**, not a separate end-to-end agent. Both modes share the same retrieval and safety logic, ensuring:

- consistent grounding behavior
- no duplication of pipeline code
- no drift between QA and Essay answers

This design keeps the system simple while supporting multiple communication styles over the same RAG knowledge base.

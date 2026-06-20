# Recall — Claude Code Guide

## Project overview

Next.js 16 (App Router) + PostgreSQL/pgvector RAG app that turns meeting transcripts into searchable institutional memory.

## Key commands

```bash
npm run dev       # Start dev server (default port 3001 per NEXT_PUBLIC_APP_URL)
npm run build     # Production build
npm run lint      # ESLint
```

## Architecture

- **API routes** live in `src/app/api/` — one folder per resource
- **Lib layer** in `src/lib/` handles DB, embeddings, ingestion, chunking, and extraction
- **Pages** in `src/app/` are all Client Components (`'use client'`) that fetch from the API routes
- **No ORM** — raw `pg` queries via the pool in `src/lib/db.ts`

## Environment variables required

```
DATABASE_URL          PostgreSQL connection string (Aurora Serverless)
ANTHROPIC_API_KEY     For Claude (chat answers + extraction)
OPENAI_API_KEY        For text-embedding-3-small
```

## Database schema

Tables: `meetings`, `chunks` (with `embedding vector(1536)`), `action_items`, `decisions`.
The `pgvector` extension must be installed. Vector search uses `<=>` (cosine distance).

## Models in use

- Embeddings: `text-embedding-3-small` (OpenAI) — 1536 dimensions
- Chat: `claude-haiku-4-5-20251001` (fast, low cost) — swap to `claude-sonnet-4-6` for higher quality
- Extraction: Claude (see `src/lib/extract.ts`)

## Important patterns

- Streaming chat: `claude.messages.stream()` → `ReadableStream` → `Response`. Errors inside the stream are caught and written inline so the client never sees a broken connection.
- Vector search: embeddings are stored as `vector` type; queries pass `JSON.stringify(float[])` cast to `::vector`.
- Upload supports `.txt`, `.vtt`, `.pdf` — PDF parsed via `pdf-parse` with a CJS interop shim.

## Next.js version note

This project uses **Next.js 16**, which has breaking changes from earlier versions. Check `node_modules/next/dist/docs/` before using patterns from older Next.js training data.

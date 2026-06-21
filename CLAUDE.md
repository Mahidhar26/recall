# Recall — Claude Code Guide

## Project overview

Next.js 16 (App Router) + PostgreSQL/pgvector RAG app that turns meeting transcripts into searchable institutional memory. Built for H0 Hackathon · Track 2 (AWS + Vercel).

Brand colors: `#534AB7` (purple) · `#1D9E75` (teal). Use these consistently for accents, active states, and badges.

## Key commands

```bash
npm run dev       # Start dev server (default port 3001 per NEXT_PUBLIC_APP_URL)
npm run build     # Production build — always verify before committing UI changes
npm run lint      # ESLint
```

## File structure

```
src/
  app/
    layout.tsx              # Root layout — imports Sidebar from @/components
    loading.tsx             # Platform-level launch loader (BrandLoader)
    page.tsx                # Overview — stats, upload, search, meetings list
    chat/page.tsx           # Chat — streaming RAG with markdown rendering
    actions/page.tsx        # Action items with status filter + toggle
    decisions/page.tsx      # Decisions log with search
    meetings/[id]/page.tsx  # Meeting detail — TL;DR, decisions, actions, transcript
    api/
      upload/route.ts       # Ingest transcripts (txt/vtt/pdf)
      chat/route.ts         # Streaming RAG chat
      meetings/route.ts     # Meeting list + stats
      meetings/[id]/route.ts # Meeting detail data + on-the-fly summary
      actions/route.ts      # CRUD action items
      decisions/route.ts    # Decisions list
  components/
    Sidebar.tsx             # Dark sidebar — Client Component (usePathname active state)
    BrandLoader.tsx         # Spinning gradient loader used in loading.tsx
    Markdown.tsx            # Dependency-free inline markdown renderer for chat
  lib/
    db.ts                   # PostgreSQL singleton pool
    embed.ts                # OpenAI embeddings (text-embedding-3-small)
    ingest.ts               # Orchestrates chunk → embed → extract pipeline
    chunker.ts              # Splits transcript into ~400-token chunks; parses VTT
    extract.ts              # extractActions, extractDecisions, summarize via Claude
```

## Architecture

- **API routes** live in `src/app/api/` — one folder per resource
- **Lib layer** in `src/lib/` handles DB, embeddings, ingestion, chunking, and extraction
- **Pages** are all Client Components (`'use client'`) that fetch from the API routes
- **No ORM** — raw `pg` queries via the pool in `src/lib/db.ts`
- **Dynamic routes** use `params: Promise<{ id: string }>` and `await params` — Next.js 16 convention

## Environment variables required

```
DATABASE_URL          PostgreSQL connection string (Aurora Serverless)
ANTHROPIC_API_KEY     For Claude (chat answers + extraction + summaries)
OPENAI_API_KEY        For text-embedding-3-small embeddings
```

## Database schema

Tables: `meetings`, `chunks` (with `embedding vector(1536)`), `action_items`, `decisions`.
The `pgvector` extension must be installed. Vector search uses `<=>` (cosine distance).

## Models in use

- Embeddings: `text-embedding-3-small` (OpenAI) — 1536 dimensions
- Chat: `claude-haiku-4-5-20251001` — defined as `MODEL` constant in `src/lib/extract.ts`
- Extraction + summarization: same `MODEL` constant in `extract.ts`
- Chat system prompt: nudges light markdown (`**bold**`, `- bullets`) for richer answers

## Important patterns

**Streaming chat:** `claude.messages.stream()` → `ReadableStream` → `Response`. Errors inside `start()` are caught and written as inline `[Error: ...]` text so the client never sees an abrupt connection close.

**Vector search:** embeddings stored as `vector` type; queries pass `JSON.stringify(float[])` cast to `::vector`.

**Upload:** supports `.txt`, `.vtt`, `.pdf`. PDF parsed via `pdf-parse` with a CJS interop shim (`import * as pdfParseModule`). Progress UI steps through Parsing → Chunking → Embedding → Extracting on a timer (not real backend events).

**JSON extraction:** `extract.ts` slices the model response from the first `[` to the last `]` before `JSON.parse` — guards against markdown fences or preamble text breaking the parse.

**Markdown rendering:** `src/components/Markdown.tsx` is a small dependency-free renderer. It handles `**bold**`, `*italic*`, `` `code` ``, and `- `bullet / numbered lists. Used in chat responses only.

## Gotchas

- `postcss.config.mjs` must exist — Tailwind v4 runs through PostCSS; without it nothing is styled.
- `tsconfig.json` maps `@/*` → `./src/*`. If the alias breaks, check this file first.
- `globals.css` must start with `@import "tailwindcss"` (Tailwind v4 syntax, not v3 directives).
- Sidebar is a Client Component at `src/components/Sidebar.tsx` so it can use `usePathname`.

## Next.js version note

This project uses **Next.js 16**, which has breaking changes from earlier versions. Check `node_modules/next/dist/docs/` before using patterns from older Next.js training data.

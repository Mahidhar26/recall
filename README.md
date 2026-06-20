# Recall — Meeting Memory

Your team's institutional memory. Upload meeting transcripts and instantly ask questions, track action items, and log decisions across all your meetings.

Built for the H0 Hackathon · Track 2 (AWS + Vercel).

## Features

- **Upload transcripts** — drag and drop `.txt`, `.vtt`, or `.pdf` files
- **Ask anything** — RAG-powered chat with streaming answers cited to specific meetings
- **Action items** — auto-extracted tasks with owner, due date, and status tracking
- **Decisions log** — searchable record of every decision made across all meetings

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | PostgreSQL (AWS Aurora Serverless) + pgvector |
| Embeddings | OpenAI `text-embedding-3-small` |
| LLM | Anthropic Claude (Haiku / Sonnet) |
| Deployment | Vercel |

## Project Structure

```
src/
  app/
    page.tsx              # Overview — stats + upload
    chat/page.tsx         # Ask anything (streaming chat)
    actions/page.tsx      # Action items with status toggle
    decisions/page.tsx    # Decisions log with search
    api/
      upload/route.ts     # Ingest transcripts
      chat/route.ts       # RAG chat endpoint
      meetings/route.ts   # Meeting list + stats
      actions/route.ts    # CRUD for action items
      decisions/route.ts  # Decisions list
  lib/
    db.ts                 # PostgreSQL pool
    embed.ts              # OpenAI embeddings
    ingest.ts             # Orchestrates chunking, embedding, extraction
    chunker.ts            # Splits transcript into chunks
    extract.ts            # Extracts action items and decisions via Claude
```

## Getting Started

### 1. Environment variables

Create a `.env.local` file:

```env
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...
```

### 2. Database setup

Run the schema migrations to create the `meetings`, `chunks`, `action_items`, and `decisions` tables with the `pgvector` extension enabled.

### 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

1. **Upload** — a transcript is chunked, each chunk is embedded with OpenAI, and Claude extracts action items and decisions.
2. **Chat** — the query is embedded, a vector similarity search retrieves the top 8 relevant chunks, and Claude streams an answer grounded in those chunks.
3. **Actions / Decisions** — extracted items are stored in Postgres and surfaced in their own views with filtering and search.

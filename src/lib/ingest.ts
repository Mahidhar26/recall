import { pool } from './db'
import { embedBatch } from './embed'
import { chunkText, parseVtt, Chunk } from './chunker'
import { extractActions, extractDecisions } from './extract'

interface IngestInput {
  title: string
  text: string
  source: 'upload' | 'notion' | 'zoom'
  sourceUrl?: string
  workspaceId: string
}

interface IngestResult {
  meetingId: string
  chunks: number
  actions: number
  decisions: number
}

export async function ingest(input: IngestInput): Promise<IngestResult> {
  // 1. Create meeting record
  const { rows } = await pool.query(
    `INSERT INTO meetings (title, source, source_url, status, workspace_id)
     VALUES ($1, $2, $3, 'processing', $4) RETURNING id`,
    [input.title, input.source, input.sourceUrl ?? null, input.workspaceId]
  )
  const meetingId = rows[0].id

  try {
    // 2. Chunk the text. VTT transcripts (Zoom/Meet/Teams exports) go through
    //    parseVtt so speaker turns are extracted into chunk.speaker and the
    //    timestamp/markup is stripped before embedding. Everything else uses the
    //    plain-text chunker.
    const isVtt = /^﻿?\s*WEBVTT/.test(input.text)
    const chunks = isVtt ? parseVtt(input.text) : chunkText(input.text)
    if (chunks.length === 0) throw new Error('No content to index')

    // 3. Embed all chunks
    const embeddings = await embedBatch(chunks.map(c => c.content))

    // 4. Store chunks with embeddings
    for (let i = 0; i < chunks.length; i++) {
      await pool.query(
        `INSERT INTO chunks (meeting_id, content, speaker, position, token_count, embedding)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          meetingId,
          chunks[i].content,
          chunks[i].speaker ?? null,
          chunks[i].position,
          chunks[i].tokenCount,
          JSON.stringify(embeddings[i]),  // pgvector accepts JSON array
        ]
      )
    }

    // 5. Run AI extraction in parallel
    const [actionCount, decisionCount] = await Promise.all([
      extractActions(input.text, meetingId),
      extractDecisions(input.text, meetingId),
    ])

    // 6. Mark meeting as ready
    await pool.query(
      "UPDATE meetings SET status = 'ready', updated_at = NOW() WHERE id = $1",
      [meetingId]
    )

    return { meetingId, chunks: chunks.length, actions: actionCount, decisions: decisionCount }

  } catch (err) {
    await pool.query("UPDATE meetings SET status = 'error' WHERE id = $1", [meetingId])
    throw err
  }
}

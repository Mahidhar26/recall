import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { pool } from '@/lib/db'
import { embed } from '@/lib/embed'

const claude = new Anthropic()

const SYSTEM = `You are Recall, a meeting memory assistant.
Answer using ONLY the context provided. Be concise (2-4 sentences).
Cite every claim: [Meeting Title · Date] after each sentence.
If the context does not contain the answer, say: "I couldn't find that in your indexed meetings."
Never invent information. Never say "based on the context".`

export async function POST(req: NextRequest) {
  try {
  const { query } = await req.json()
  if (!query?.trim()) return new Response('Query required', { status: 400 })

  // 1. Embed the query
  const queryVec = await embed(query)

  // 2. Vector search — top 8 most similar chunks
  const { rows: chunks } = await pool.query(`
    SELECT c.content, c.speaker,
           m.title AS meeting_title,
           TO_CHAR(m.created_at, 'Mon DD, YYYY') AS meeting_date,
           m.id AS meeting_id,
           1 - (c.embedding <=> $1::vector) AS similarity
    FROM chunks c
    JOIN meetings m ON c.meeting_id = m.id
    WHERE m.status = 'ready'
    ORDER BY c.embedding <=> $1::vector
    LIMIT 8
  `, [JSON.stringify(queryVec)])

  if (!chunks.length) {
    return new Response('No meetings indexed yet. Upload a transcript first.', {
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  // 3. Build context string
  const context = chunks.map((c: any) =>
    `[${c.meeting_title} · ${c.meeting_date}]\n${c.speaker ? c.speaker + ': ' : ''}${c.content}`
  ).join('\n\n---\n\n')

  // 4. Stream answer from Claude
  const stream = claude.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: SYSTEM,
    messages: [{ role: 'user', content: `Context:\n${context}\n\nQuestion: ${query}` }],
  })

  // 5. Convert to web ReadableStream — catch errors inside start() so the
  //    client gets readable text rather than an abrupt connection close
  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
        controller.close()
      } catch (err: any) {
        console.error('[chat/stream]', err)
        controller.enqueue(encoder.encode(`\n\n[Error: ${err?.message ?? 'stream failed'}]`))
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'X-Sources': JSON.stringify(chunks.slice(0, 4).map((c: any) => ({
        title: c.meeting_title, date: c.meeting_date, id: c.meeting_id
      }))),
    },
  })
  } catch (err: any) {
    console.error('[chat]', err)
    return new Response(err?.message ?? 'Internal server error', { status: 500 })
  }
}

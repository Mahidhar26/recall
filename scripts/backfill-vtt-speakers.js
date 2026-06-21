// One-off backfill: re-process the original .vtt transcripts through the fixed
// VTT parser so chunks get clean content + a real `speaker`, then re-embed.
// Idempotent — safe to re-run. Meetings without a matching ../files/<title>.vtt
// (e.g. pasted plain-text transcripts) are skipped.
//
//   node scripts/backfill-vtt-speakers.js
//
const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')
const OpenAI = require('openai')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const FILES_DIR = path.join(__dirname, '..', '..', 'files')
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const openai = new OpenAI()

// Mirror of src/lib/chunker.ts parseVtt (kept in sync intentionally).
function parseVtt(raw) {
  const lines = raw.split('\n')
  const turns = []
  let cs = '', ct = ''
  for (const line of lines) {
    if (line.includes('-->') || line.match(/^\d+$/) || line.trim() === 'WEBVTT' || line.startsWith('NOTE')) continue
    const m = line.match(/^<v ([^>]+)>(.*)/)
    if (m) {
      if (ct && cs) turns.push({ speaker: cs, text: ct.trim() })
      cs = m[1]; ct = m[2].replace(/<[^>]+>/g, '')
    } else if (line.trim() && cs) {
      ct += ' ' + line.trim()
    }
  }
  if (ct && cs) turns.push({ speaker: cs, text: ct.trim() })

  const chunks = []
  let buffer = '', speaker = '', pos = 0
  const flush = () => {
    if (buffer.trim()) chunks.push({ content: buffer.trim(), speaker, position: pos++, tokenCount: Math.ceil(buffer.length / 4) })
    buffer = ''
  }
  for (const turn of turns) {
    if (buffer && (turn.speaker !== speaker || (buffer + '\n' + turn.text).length > 1600)) flush()
    if (!buffer) { speaker = turn.speaker; buffer = turn.text }
    else { buffer += '\n' + turn.text }
  }
  flush()
  return chunks
}

async function embedBatch(texts) {
  const out = []
  for (let i = 0; i < texts.length; i += 20) {
    const r = await openai.embeddings.create({ model: 'text-embedding-3-small', input: texts.slice(i, i + 20) })
    out.push(...r.data.map(d => d.embedding))
  }
  return out
}

;(async () => {
  const meetings = (await pool.query("SELECT id, title FROM meetings WHERE status = 'ready' ORDER BY created_at")).rows
  let processed = 0
  for (const m of meetings) {
    const file = path.join(FILES_DIR, `${m.title}.vtt`)
    if (!fs.existsSync(file)) { console.log(`· skip  ${m.title} (no matching .vtt)`); continue }

    const chunks = parseVtt(fs.readFileSync(file, 'utf8'))
    if (!chunks.length) { console.log(`· skip  ${m.title} (no speaker turns parsed)`); continue }

    const embeddings = await embedBatch(chunks.map(c => c.content))
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query('DELETE FROM chunks WHERE meeting_id = $1', [m.id])
      for (let i = 0; i < chunks.length; i++) {
        await client.query(
          `INSERT INTO chunks (meeting_id, content, speaker, position, token_count, embedding)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [m.id, chunks[i].content, chunks[i].speaker || null, chunks[i].position, chunks[i].tokenCount, JSON.stringify(embeddings[i])]
        )
      }
      await client.query('COMMIT')
      const speakers = [...new Set(chunks.map(c => c.speaker))]
      console.log(`✓ done  ${m.title}: ${chunks.length} chunks · ${speakers.length} speakers (${speakers.join(', ')})`)
      processed++
    } catch (e) {
      await client.query('ROLLBACK')
      console.log(`✗ fail  ${m.title}: ${e.message}`)
    } finally {
      client.release()
    }
  }
  console.log(`\nReprocessed ${processed} meeting(s).`)
  await pool.end()
})()

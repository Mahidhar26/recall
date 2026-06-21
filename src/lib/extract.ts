import Anthropic from '@anthropic-ai/sdk'
import { pool } from './db'

const claude = new Anthropic()

// Model used for all extraction/summary calls. Swap to 'claude-sonnet-4-6'
// for higher quality if the account has credits on this workspace.
const MODEL = 'claude-haiku-4-5-20251001'

// Robustly pull a JSON array out of a model response. Claude sometimes wraps
// JSON in markdown fences or adds a sentence of preamble; we slice from the
// first '[' to the last ']' so those don't break JSON.parse.
function parseJsonArray(raw: string, label: string): any[] {
  const cleaned = raw.replace(/```json?/gi, '').replace(/```/g, '').trim()
  const start = cleaned.indexOf('[')
  const end = cleaned.lastIndexOf(']')
  if (start === -1 || end === -1 || end < start) {
    console.error(`[${label}] no JSON array found in response:`, raw.slice(0, 400))
    return []
  }
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1))
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error(`[${label}] JSON.parse failed:`, err, '\nraw:', raw.slice(0, 400))
    return []
  }
}

// ── Action item extraction ───────────────────────────────────
export async function extractActions(transcript: string, meetingId: string): Promise<number> {
  const text = transcript.slice(0, 24000) // ~6k tokens
  try {
    const res = await claude.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: `Extract action items from this meeting transcript.
Return ONLY a valid JSON array, no markdown, no explanation.
Schema: [{
  "task": "what needs to be done",
  "owner": "person name or null",
  "due_date": "date/phrase or null",
  "confidence": "high|medium|low"
}]
Only include explicit tasks. Return [] if none.`,
      messages: [{ role: 'user', content: 'Transcript:\n' + text }],
    })
    const raw = res.content[0].type === 'text' ? res.content[0].text : '[]'
    const items = parseJsonArray(raw, 'extractActions')
    console.log(`[extractActions] parsed ${items.length} items for meeting ${meetingId}`)
    if (!items.length) return 0

    for (const item of items) {
      await pool.query(
        `INSERT INTO action_items (meeting_id, task, owner, due_date, status, confidence)
         VALUES ($1, $2, $3, $4, 'todo', $5)`,
        [meetingId, item.task, item.owner ?? null, item.due_date ?? null, item.confidence ?? 'medium']
      )
    }
    return items.length
  } catch (err) { console.error('[extractActions]', err); return 0 }
}

// ── Decision extraction ──────────────────────────────────────
export async function extractDecisions(transcript: string, meetingId: string): Promise<number> {
  const text = transcript.slice(0, 24000)
  try {
    const res = await claude.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: `Extract decisions from this meeting transcript.
A decision is a concrete outcome agreed upon — not a suggestion.
Return ONLY a valid JSON array:
[{
  "decision": "one sentence what was decided",
  "rationale": "brief reason or null",
  "tags": ["topic-1", "topic-2"]
}]
Return [] if no decisions were made.`,
      messages: [{ role: 'user', content: 'Transcript:\n' + text }],
    })
    const raw = res.content[0].type === 'text' ? res.content[0].text : '[]'
    const items = parseJsonArray(raw, 'extractDecisions')
    console.log(`[extractDecisions] parsed ${items.length} items for meeting ${meetingId}`)
    if (!items.length) return 0

    for (const item of items) {
      await pool.query(
        `INSERT INTO decisions (meeting_id, decision, rationale, tags)
         VALUES ($1, $2, $3, $4)`,
        [meetingId, item.decision, item.rationale ?? null, JSON.stringify(item.tags ?? [])]
      )
    }
    return items.length
  } catch (err) { console.error('[extractDecisions]', err); return 0 }
}

// ── Meeting summary ──────────────────────────────────────────
// Generates a short TL;DR for a transcript. Used by the meeting detail page.
export async function summarize(transcript: string): Promise<string> {
  const text = transcript.slice(0, 24000)
  try {
    const res = await claude.messages.create({
      model: MODEL,
      max_tokens: 256,
      system: `Summarize this meeting transcript in 2-3 sentences.
Lead with the topic, then the most important decisions and the number of action items.
Write plainly. No preamble, no markdown, just the summary text.`,
      messages: [{ role: 'user', content: 'Transcript:\n' + text }],
    })
    return res.content[0].type === 'text' ? res.content[0].text.trim() : ''
  } catch (err) { console.error('[summarize]', err); return '' }
}

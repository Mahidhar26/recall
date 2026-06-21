import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { summarize } from '@/lib/extract'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const meetingRes = await pool.query(
      `SELECT id, title, source, status,
              TO_CHAR(created_at, 'Mon DD, YYYY') AS created_at
       FROM meetings WHERE id = $1`,
      [id]
    )
    if (!meetingRes.rows.length) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }
    const meeting = meetingRes.rows[0]

    const [chunks, actions, decisions] = await Promise.all([
      pool.query(
        `SELECT content, speaker, position FROM chunks
         WHERE meeting_id = $1 ORDER BY position ASC`,
        [id]
      ),
      pool.query(
        `SELECT id, task, owner, due_date, status, confidence
         FROM action_items WHERE meeting_id = $1 ORDER BY created_at ASC`,
        [id]
      ),
      pool.query(
        `SELECT id, decision, rationale, tags FROM decisions
         WHERE meeting_id = $1 ORDER BY created_at ASC`,
        [id]
      ),
    ])

    const transcript = chunks.rows
      .map(c => (c.speaker ? `${c.speaker}: ${c.content}` : c.content))
      .join('\n\n')

    const summary = transcript ? await summarize(transcript) : ''

    return NextResponse.json({
      meeting,
      summary,
      transcript: chunks.rows,
      actions: actions.rows,
      decisions: decisions.rows,
    })
  } catch (err: any) {
    console.error('[meetings/[id]]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

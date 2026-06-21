'use client'
import { useState, useEffect, use } from 'react'
import Link from 'next/link'

const STATUS_STYLE: Record<string, { badge: string; text: string; label: string }> = {
  todo:       { badge: '#FFFBEB', text: '#92400E', label: 'To do' },
  inprogress: { badge: '#EFF6FF', text: '#1E40AF', label: 'In progress' },
  blocked:    { badge: '#FEF2F2', text: '#991B1B', label: 'Blocked' },
  done:       { badge: '#ECFDF5', text: '#065F46', label: 'Done' },
}

export default function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/meetings/${id}`)
      .then(r => r.json())
      .then(d => (d.error ? setError(d.error) : setData(d)))
      .catch(() => setError('Failed to load meeting'))
  }, [id])

  if (error) {
    return (
      <div className='max-w-3xl mx-auto px-8 py-8'>
        <BackLink />
        <p className='text-sm text-red-500 mt-6'>{error}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className='max-w-3xl mx-auto px-8 py-8'>
        <BackLink />
        <p className='text-sm text-zinc-400 mt-6'>Loading meeting…</p>
      </div>
    )
  }

  const { meeting, summary, transcript, actions, decisions } = data

  return (
    <div className='max-w-3xl mx-auto px-8 py-8'>
      <BackLink />

      <div className='mt-4 mb-6'>
        <h1 className='text-[22px] font-semibold text-zinc-900 tracking-tight'>{meeting.title}</h1>
        <p className='text-sm text-zinc-400 mt-0.5'>{meeting.created_at} · {meeting.source}</p>
      </div>

      {/* TL;DR */}
      {summary && (
        <div className='rounded-xl p-5 mb-8 border-l-[3px]'
          style={{ background: '#F4F3FB', borderLeftColor: '#534AB7' }}>
          <div className='text-[11px] font-semibold uppercase tracking-widest mb-1.5' style={{ color: '#534AB7' }}>
            TL;DR
          </div>
          <p className='text-sm text-zinc-700 leading-relaxed'>{summary}</p>
        </div>
      )}

      {/* Decisions + Actions side by side */}
      <div className='grid md:grid-cols-2 gap-4 mb-8'>
        <section>
          <h2 className='text-[13px] font-semibold text-zinc-500 uppercase tracking-widest mb-3'>
            Decisions ({decisions.length})
          </h2>
          {decisions.length === 0 ? (
            <p className='text-sm text-zinc-400'>None recorded.</p>
          ) : (
            <div className='space-y-2'>
              {decisions.map((d: any) => (
                <div key={d.id} className='bg-white rounded-lg border border-zinc-200 p-3 border-l-[3px]'
                  style={{ borderLeftColor: '#1D9E75' }}>
                  <div className='text-sm font-medium text-zinc-800 leading-snug'>{d.decision}</div>
                  {d.rationale && <div className='text-xs text-zinc-500 mt-1'>{d.rationale}</div>}
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className='text-[13px] font-semibold text-zinc-500 uppercase tracking-widest mb-3'>
            Action items ({actions.length})
          </h2>
          {actions.length === 0 ? (
            <p className='text-sm text-zinc-400'>None recorded.</p>
          ) : (
            <div className='space-y-2'>
              {actions.map((a: any) => {
                const s = STATUS_STYLE[a.status] ?? STATUS_STYLE.todo
                return (
                  <div key={a.id} className='bg-white rounded-lg border border-zinc-200 p-3'>
                    <div className='text-sm font-medium text-zinc-800 leading-snug'>{a.task}</div>
                    <div className='flex items-center gap-2 mt-1.5'>
                      <span className='text-[11px] px-2 py-0.5 rounded-full font-medium'
                        style={{ background: s.badge, color: s.text }}>{s.label}</span>
                      {a.owner && <span className='text-xs text-zinc-400'>{a.owner}</span>}
                      {a.due_date && <span className='text-xs text-zinc-400'>· {a.due_date}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* Transcript */}
      <h2 className='text-[13px] font-semibold text-zinc-500 uppercase tracking-widest mb-3'>
        Transcript
      </h2>
      {transcript.length === 0 ? (
        <p className='text-sm text-zinc-400'>No transcript stored.</p>
      ) : (
        <div className='bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100'>
          {transcript.map((c: any, i: number) => (
            <div key={i} className='px-5 py-4'>
              {c.speaker && (
                <div className='text-xs font-semibold mb-1' style={{ color: '#534AB7' }}>{c.speaker}</div>
              )}
              <p className='text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap'>{c.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BackLink() {
  return (
    <Link href='/' className='text-sm text-zinc-400 hover:text-zinc-600 transition-colors'>
      ← Back to overview
    </Link>
  )
}

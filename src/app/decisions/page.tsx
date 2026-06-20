'use client'
import { useState, useEffect } from 'react'

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<any[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/decisions').then(r => r.json()).then(d => setDecisions(d.decisions))
  }, [])

  const filtered = decisions.filter(d =>
    d.decision.toLowerCase().includes(search.toLowerCase()) ||
    (d.tags ?? []).some((t: string) => t.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className='max-w-3xl mx-auto px-8 py-8'>
      <div className='mb-6'>
        <h1 className='text-[22px] font-semibold text-zinc-900 tracking-tight'>Decisions Log</h1>
        <p className='text-sm text-zinc-400 mt-0.5'>Every decision made across your indexed meetings</p>
      </div>

      <input
        placeholder='Search decisions or tags…'
        value={search}
        onChange={e => setSearch(e.target.value)}
        className='w-full border border-zinc-200 rounded-lg px-4 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 bg-white mb-6 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 transition-colors'
      />

      {filtered.length === 0 ? (
        <p className='text-sm text-zinc-400'>
          {decisions.length === 0 ? 'No decisions yet — upload a meeting transcript to get started.' : 'No results for that search.'}
        </p>
      ) : (
        <div className='space-y-3'>
          {filtered.map((d: any) => (
            <div
              key={d.id}
              className='bg-white rounded-xl border border-zinc-200 p-5 border-l-[3px]'
              style={{ borderLeftColor: '#059669' }}
            >
              <div className='text-sm font-semibold text-zinc-800 leading-snug mb-1'>{d.decision}</div>
              {d.rationale && (
                <div className='text-xs text-zinc-500 leading-relaxed mb-3'>{d.rationale}</div>
              )}
              <div className='flex flex-wrap items-center gap-2'>
                {d.meeting_date && (
                  <span className='text-[11px] text-zinc-400'>{d.meeting_date}</span>
                )}
                {d.meeting_date && d.meeting_title && (
                  <span className='text-zinc-200'>·</span>
                )}
                {d.meeting_title && (
                  <span className='text-[11px] text-zinc-400'>{d.meeting_title}</span>
                )}
                {(d.tags ?? []).map((t: string) => (
                  <span
                    key={t}
                    className='text-[11px] px-2 py-0.5 rounded-full font-medium'
                    style={{ background: '#ECFDF5', color: '#064E3B' }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

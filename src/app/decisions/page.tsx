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
    <div className='max-w-4xl mx-auto p-6'>
      <h1 className='text-2xl font-semibold mb-4'>Decisions Log</h1>
      <input placeholder='Search decisions or tags…' value={search} onChange={e => setSearch(e.target.value)}
        className='w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-purple-500' />
      {filtered.length === 0 ? <p className='text-gray-400 text-sm'>No decisions yet.</p> : (
        <div className='space-y-3'>
          {filtered.map((d: any) => (
            <div key={d.id} className='bg-white rounded-lg border border-gray-200 p-4'>
              <div className='font-medium text-sm mb-1'>{d.decision}</div>
              {d.rationale && <div className='text-xs text-gray-500 mb-2'>{d.rationale}</div>}
              <div className='flex items-center gap-2 text-xs text-gray-400'>
                <span>{d.meeting_date}</span>
                <span>·</span>
                <span>{d.meeting_title}</span>
                {(d.tags ?? []).map((t: string) => (
                  <span key={t} className='px-2 py-0.5 bg-gray-100 rounded'>{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

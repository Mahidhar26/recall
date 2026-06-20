'use client'
import { useState, useEffect, useCallback } from 'react'

export default function OverviewPage() {
  const [data, setData] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [dragging, setDragging] = useState(false)

  const loadData = useCallback(async () => {
    const res = await fetch('/api/meetings')
    setData(await res.json())
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function handleUpload(file: File) {
    setUploading(true); setUploadResult(null)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const json = await res.json()
      setUploadResult(json)
      loadData()
    } catch { setUploadResult({ error: 'Upload failed' }) }
    setUploading(false)
  }

  return (
    <div className='max-w-3xl mx-auto px-8 py-8'>
      <div className='mb-8'>
        <h1 className='text-[22px] font-semibold text-zinc-900 tracking-tight'>Overview</h1>
        <p className='text-sm text-zinc-400 mt-0.5'>Your team's indexed meeting history</p>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-3 gap-3 mb-8'>
        <Stat label='Meetings indexed' value={data?.stats?.meeting_count ?? '—'} accent='#7C3AED' />
        <Stat label='Open actions' value={data?.stats?.open_actions ?? '—'} accent='#D97706' />
        <Stat label='Decisions logged' value={data?.stats?.decision_count ?? '—'} accent='#059669' />
      </div>

      {/* Upload */}
      <div
        className='rounded-xl border-2 border-dashed p-10 text-center mb-8 transition-colors duration-200 cursor-default'
        style={{
          borderColor: dragging ? '#7C3AED' : '#E4E4E7',
          background: dragging ? '#F5F3FF' : '#FFFFFF',
        }}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault(); setDragging(false)
          const f = e.dataTransfer.files[0]; if (f) handleUpload(f)
        }}
      >
        {uploading ? (
          <div className='space-y-2'>
            <div className='text-zinc-400 text-sm'>Processing transcript…</div>
            <div className='text-xs text-zinc-300'>This takes 10–30 seconds</div>
          </div>
        ) : (
          <div className='space-y-3'>
            <div className='text-3xl text-zinc-300 select-none'>↑</div>
            <div>
              <p className='text-sm font-medium text-zinc-600'>Drop a meeting transcript here</p>
              <p className='text-xs text-zinc-400 mt-0.5'>.txt · .vtt · .pdf</p>
            </div>
            <div>
              <input type='file' accept='.txt,.vtt,.pdf' className='hidden' id='file-input'
                onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
              <label htmlFor='file-input'
                className='inline-block px-4 py-1.5 text-sm font-medium text-white rounded-md cursor-pointer transition-colors'
                style={{ background: '#7C3AED' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#6D28D9')}
                onMouseLeave={e => (e.currentTarget.style.background = '#7C3AED')}
              >
                Choose file
              </label>
            </div>
          </div>
        )}
        {uploadResult && (
          <div className={`mt-4 text-sm font-medium ${uploadResult.error ? 'text-red-500' : 'text-emerald-600'}`}>
            {uploadResult.error ?? `Indexed — ${uploadResult.chunks} chunks · ${uploadResult.actions} actions · ${uploadResult.decisions} decisions`}
          </div>
        )}
      </div>

      {/* Recent meetings */}
      <div className='flex items-center justify-between mb-3'>
        <h2 className='text-[13px] font-semibold text-zinc-500 uppercase tracking-widest'>Recent meetings</h2>
      </div>

      {data?.meetings?.length ? (
        <div className='bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100 overflow-hidden'>
          {data.meetings.map((m: any) => (
            <div key={m.id} className='flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50 transition-colors'>
              <div>
                <div className='text-sm font-medium text-zinc-800'>{m.title}</div>
                <div className='text-xs text-zinc-400 mt-0.5'>{m.created_at?.slice(0, 10)} · {m.source}</div>
              </div>
              <div className='flex gap-1.5'>
                {m.action_count > 0 && (
                  <span className='text-xs px-2 py-0.5 rounded-full font-medium' style={{ background: '#FFFBEB', color: '#92400E' }}>
                    {m.action_count} actions
                  </span>
                )}
                {m.decision_count > 0 && (
                  <span className='text-xs px-2 py-0.5 rounded-full font-medium' style={{ background: '#ECFDF5', color: '#064E3B' }}>
                    {m.decision_count} decisions
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className='text-sm text-zinc-400'>No meetings yet — upload a transcript to get started.</p>
      )}
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className='bg-white rounded-xl border border-zinc-200 p-4 border-l-[3px]' style={{ borderLeftColor: accent }}>
      <div className='text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1'>{label}</div>
      <div className='text-3xl font-semibold tracking-tight' style={{ color: accent }}>{value}</div>
    </div>
  )
}

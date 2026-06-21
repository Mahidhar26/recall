'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

const STEPS = [
  'Parsing file',
  'Creating chunks',
  'Generating embeddings',
  'Extracting actions',
  'Extracting decisions',
  'Done',
]
const STEP_DELAYS = [0, 1500, 3000, 6000, 9000, 12000]

export default function OverviewPage() {
  const [data, setData] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [dragging, setDragging] = useState(false)
  const [step, setStep] = useState(0)
  const [search, setSearch] = useState('')

  const loadData = useCallback(async () => {
    const res = await fetch('/api/meetings')
    setData(await res.json())
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function handleUpload(file: File) {
    setUploading(true); setUploadResult(null); setStep(0)

    // Schedule each step at its fixed offset
    const timers: ReturnType<typeof setTimeout>[] = []
    STEP_DELAYS.slice(1).forEach((delay, i) => {
      timers.push(setTimeout(() => setStep(i + 1), delay))
    })

    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const json = await res.json()
      setUploadResult(json)
      setStep(STEPS.length - 1) // jump to Done on success
      loadData()
    } catch { setUploadResult({ error: 'Upload failed' }) }
    finally {
      timers.forEach(clearTimeout)
      setUploading(false)
    }
  }

  const meetings = (data?.meetings ?? []).filter((m: any) =>
    m.title?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className='max-w-3xl mx-auto px-8 py-8'>
      <div className='mb-8'>
        <h1 className='text-[22px] font-semibold text-zinc-900 tracking-tight'>Overview</h1>
        <p className='text-sm text-zinc-400 mt-0.5'>Your team's indexed meeting history</p>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-3 gap-3 mb-8'>
        <Stat label='Meetings indexed' value={data?.stats?.meeting_count ?? '—'} accent='#534AB7' />
        <Stat label='Open actions' value={data?.stats?.open_actions ?? '—'} accent='#D97706' />
        <Stat label='Decisions logged' value={data?.stats?.decision_count ?? '—'} accent='#1D9E75' />
      </div>

      {/* Upload */}
      <div
        className='rounded-xl border-2 border-dashed p-10 text-center mb-8 transition-colors duration-200'
        style={{
          borderColor: dragging ? '#534AB7' : '#E4E4E7',
          background: dragging ? '#F4F3FB' : '#FFFFFF',
        }}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault(); setDragging(false)
          const f = e.dataTransfer.files[0]; if (f) handleUpload(f)
        }}
      >
        {uploading ? (
          <UploadProgress step={step} />
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
                style={{ background: '#534AB7' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#453C9E')}
                onMouseLeave={e => (e.currentTarget.style.background = '#534AB7')}
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
      <div className='flex items-center justify-between mb-3 gap-4'>
        <h2 className='text-[13px] font-semibold text-zinc-500 uppercase tracking-widest shrink-0'>Recent meetings</h2>
        {data?.meetings?.length > 0 && (
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder='Search meetings…'
            className='text-sm border border-zinc-200 rounded-md px-3 py-1 w-48 bg-white placeholder:text-zinc-400 focus:outline-none focus:border-[#534AB7] focus:ring-1 focus:ring-[#534AB7] transition-colors'
          />
        )}
      </div>

      {data?.meetings?.length ? (
        meetings.length ? (
          <div className='bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100 overflow-hidden'>
            {meetings.map((m: any) => (
              <Link
                key={m.id}
                href={`/meetings/${m.id}`}
                className='flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50 transition-colors group'
              >
                <div>
                  <div className='text-sm font-medium text-zinc-800 group-hover:text-[#534AB7] transition-colors'>{m.title}</div>
                  <div className='text-xs text-zinc-400 mt-0.5'>{m.created_at?.slice(0, 10)} · {m.source}</div>
                </div>
                <div className='flex items-center gap-1.5'>
                  {m.action_count > 0 && (
                    <span className='text-xs px-2 py-0.5 rounded-full font-medium' style={{ background: '#FFFBEB', color: '#92400E' }}>
                      {m.action_count} actions
                    </span>
                  )}
                  {m.decision_count > 0 && (
                    <span className='text-xs px-2 py-0.5 rounded-full font-medium' style={{ background: '#ECFDF5', color: '#065F46' }}>
                      {m.decision_count} decisions
                    </span>
                  )}
                  <span className='text-zinc-300 group-hover:text-[#534AB7] transition-colors'>→</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className='text-sm text-zinc-400'>No meetings match “{search}”.</p>
        )
      ) : (
        <EmptyState />
      )}
    </div>
  )
}

function UploadProgress({ step }: { step: number }) {
  return (
    <div className='flex flex-col items-start gap-0 text-left max-w-xs mx-auto'>
      {STEPS.map((label, i) => {
        const done = i < step
        const active = i === step
        const pending = i > step
        return (
          <div key={label} className='flex items-start gap-3'>
            {/* Connector line + dot column */}
            <div className='flex flex-col items-center'>
              <div className='relative w-6 h-6 flex items-center justify-center'>
                {active ? (
                  <div
                    className='recall-spin w-5 h-5 rounded-full'
                    style={{
                      background: 'conic-gradient(from 0deg, #534AB7, #1D9E75, transparent 75%)',
                      WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 0)',
                      mask: 'radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 0)',
                    }}
                  />
                ) : (
                  <div
                    className='w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors'
                    style={{
                      background: done ? '#1D9E75' : '#E4E4E7',
                      color: done ? '#fff' : '#A1A1AA',
                    }}
                  >
                    {done ? '✓' : ''}
                  </div>
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div className='w-px h-5' style={{ background: done ? '#1D9E75' : '#E4E4E7' }} />
              )}
            </div>
            {/* Label */}
            <div className='pb-5 pt-0.5'>
              <span
                className='text-sm font-medium transition-colors'
                style={{ color: done ? '#1D9E75' : active ? '#534AB7' : '#A1A1AA' }}
              >
                {label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function EmptyState() {
  return (
    <div className='rounded-xl border border-dashed border-zinc-200 px-6 py-10 text-center'>
      <p className='text-sm font-medium text-zinc-500'>No meetings indexed yet</p>
      <p className='text-xs text-zinc-400 mt-1'>Upload a transcript above to automatically extract action items and decisions.</p>
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

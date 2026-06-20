'use client'
import { useState, useEffect, useCallback } from 'react'

export default function OverviewPage() {
  const [data, setData] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)

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
    <div className='max-w-4xl mx-auto p-6'>
      <h1 className='text-2xl font-semibold mb-6'>Overview</h1>

      <div className='grid grid-cols-3 gap-4 mb-8'>
        <Stat label='Meetings indexed' value={data?.stats?.meeting_count ?? '-'} />
        <Stat label='Open actions' value={data?.stats?.open_actions ?? '-'} color='text-amber-600' />
        <Stat label='Decisions logged' value={data?.stats?.decision_count ?? '-'} color='text-emerald-600' />
      </div>

      <div
        className='border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-8 hover:border-purple-400 transition-colors'
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleUpload(f) }}
      >
        {uploading ? (
          <p className='text-gray-500'>Processing... this takes 10–30 seconds</p>
        ) : (
          <>
            <p className='text-gray-600 mb-2'>Drag a meeting transcript here or click to upload</p>
            <p className='text-xs text-gray-400 mb-4'>Supports .txt, .vtt, .pdf</p>
            <input type='file' accept='.txt,.vtt,.pdf' className='hidden' id='file-input'
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
            <label htmlFor='file-input'
              className='inline-block px-4 py-2 bg-purple-600 text-white rounded-md text-sm cursor-pointer hover:bg-purple-700'>
              Choose file
            </label>
          </>
        )}
        {uploadResult && (
          <div className={`mt-4 text-sm ${uploadResult.error ? 'text-red-600' : 'text-emerald-600'}`}>
            {uploadResult.error ?? `Done! ${uploadResult.chunks} chunks, ${uploadResult.actions} actions, ${uploadResult.decisions} decisions.`}
          </div>
        )}
      </div>

      <h2 className='text-lg font-medium mb-3'>Recent meetings</h2>
      {data?.meetings?.length ? data.meetings.map((m: any) => (
        <div key={m.id} className='flex items-center justify-between py-3 border-b border-gray-100'>
          <div>
            <div className='font-medium text-sm'>{m.title}</div>
            <div className='text-xs text-gray-400'>{m.created_at?.slice(0, 10)} · {m.source}</div>
          </div>
          <div className='flex gap-2'>
            {m.action_count > 0 && <span className='text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded'>{m.action_count} actions</span>}
            {m.decision_count > 0 && <span className='text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded'>{m.decision_count} decisions</span>}
          </div>
        </div>
      )) : <p className='text-sm text-gray-400'>No meetings yet. Upload a transcript above.</p>}
    </div>
  )
}

function Stat({ label, value, color = 'text-gray-900' }: { label: string; value: string|number; color?: string }) {
  return (
    <div className='bg-white rounded-lg border border-gray-200 p-4'>
      <div className='text-xs text-gray-500'>{label}</div>
      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  )
}

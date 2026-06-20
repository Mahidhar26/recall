'use client'
import { useState, useEffect } from 'react'

const STATUS_COLORS: Record<string, string> = {
  todo: 'bg-amber-100 text-amber-800',
  inprogress: 'bg-blue-100 text-blue-800',
  blocked: 'bg-red-100 text-red-800',
  done: 'bg-emerald-100 text-emerald-800',
}
const STATUSES = ['todo', 'inprogress', 'blocked', 'done']

export default function ActionsPage() {
  const [items, setItems] = useState<any[]>([])
  const [filter, setFilter] = useState<string | null>(null)

  async function load() {
    const url = filter ? `/api/actions?status=${filter}` : '/api/actions'
    const res = await fetch(url)
    const data = await res.json()
    setItems(data.items)
  }

  useEffect(() => { load() }, [filter])

  async function updateStatus(id: string, status: string) {
    await fetch('/api/actions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    load()
  }

  return (
    <div className='max-w-4xl mx-auto p-6'>
      <h1 className='text-2xl font-semibold mb-4'>Action Items</h1>
      <div className='flex gap-2 mb-6'>
        <button onClick={() => setFilter(null)} className={`px-3 py-1 rounded text-sm ${!filter ? 'bg-purple-100 text-purple-700' : 'text-gray-500'}`}>All</button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 rounded text-sm ${filter === s ? 'bg-purple-100 text-purple-700' : 'text-gray-500'}`}>{s}</button>
        ))}
      </div>
      {items.length === 0 ? <p className='text-gray-400 text-sm'>No action items yet. Upload a meeting transcript to extract tasks.</p> : (
        <div className='space-y-2'>
          {items.map((item: any) => (
            <div key={item.id} className='bg-white rounded-lg border border-gray-200 p-4 flex items-start gap-3'>
              <select value={item.status} onChange={e => updateStatus(item.id, e.target.value)}
                className='text-xs border rounded px-1 py-0.5 mt-0.5'>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className='flex-1'>
                <div className='font-medium text-sm'>{item.task}</div>
                <div className='text-xs text-gray-400 mt-1 flex gap-3'>
                  {item.owner && <span>👤 {item.owner}</span>}
                  {item.due_date && <span>📅 {item.due_date}</span>}
                  <span>{item.meeting_title}</span>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[item.status]}`}>{item.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'
import { useState, useEffect } from 'react'

const STATUS_STYLE: Record<string, { bar: string; badge: string; text: string; label: string }> = {
  todo:       { bar: '#D97706', badge: '#FFFBEB', text: '#92400E', label: 'To do' },
  inprogress: { bar: '#2563EB', badge: '#EFF6FF', text: '#1E40AF', label: 'In progress' },
  blocked:    { bar: '#DC2626', badge: '#FEF2F2', text: '#991B1B', label: 'Blocked' },
  done:       { bar: '#059669', badge: '#ECFDF5', text: '#064E3B', label: 'Done' },
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
    <div className='max-w-3xl mx-auto px-8 py-8'>
      <div className='mb-6'>
        <h1 className='text-[22px] font-semibold text-zinc-900 tracking-tight'>Action Items</h1>
        <p className='text-sm text-zinc-400 mt-0.5'>Tasks extracted from your meetings</p>
      </div>

      {/* Filter bar */}
      <div className='flex gap-1.5 mb-6'>
        {[{ key: null, label: 'All' }, ...STATUSES.map(s => ({ key: s, label: STATUS_STYLE[s].label }))].map(({ key, label }) => {
          const active = filter === key
          return (
            <button
              key={String(key)}
              onClick={() => setFilter(key)}
              className='px-3 py-1 rounded-md text-xs font-medium transition-colors'
              style={active
                ? { background: '#534AB7', color: '#fff' }
                : { background: '#F4F4F5', color: '#71717A' }
              }
            >
              {label}
            </button>
          )
        })}
      </div>

      {items.length === 0 ? (
        <p className='text-sm text-zinc-400'>No action items yet — upload a meeting transcript to extract tasks.</p>
      ) : (
        <div className='space-y-2'>
          {items.map((item: any) => {
            const style = STATUS_STYLE[item.status] ?? STATUS_STYLE.todo
            return (
              <div
                key={item.id}
                className='bg-white rounded-xl border border-zinc-200 p-4 flex items-start gap-4 border-l-[3px]'
                style={{ borderLeftColor: style.bar }}
              >
                <div className='flex-1 min-w-0'>
                  <div className='text-sm font-medium text-zinc-800 leading-snug'>{item.task}</div>
                  <div className='flex flex-wrap items-center gap-3 mt-1.5 text-xs text-zinc-400'>
                    {item.owner && <span>{item.owner}</span>}
                    {item.due_date && <span>{item.due_date}</span>}
                    {item.meeting_title && <span className='truncate'>{item.meeting_title}</span>}
                  </div>
                </div>
                <div className='flex items-center gap-2 shrink-0'>
                  <span
                    className='text-xs px-2 py-0.5 rounded-full font-medium'
                    style={{ background: style.badge, color: style.text }}
                  >
                    {style.label}
                  </span>
                  <select
                    value={item.status}
                    onChange={e => updateStatus(item.id, e.target.value)}
                    className='text-xs border border-zinc-200 rounded-md px-2 py-0.5 text-zinc-500 bg-white focus:outline-none focus:border-[#534AB7]'
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_STYLE[s].label}</option>)}
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

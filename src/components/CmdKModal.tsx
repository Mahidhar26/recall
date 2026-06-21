'use client'
import { useState, useEffect, useRef } from 'react'
import { streamChat, Source } from '@/lib/chat-stream'
import { Markdown } from '@/components/Markdown'

export function CmdKModal() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState('')
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery(''); setAnswer(''); setSources([]); setLoading(false)
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q || loading) return
    setAnswer(''); setSources([]); setLoading(true)
    try {
      const srcs = await streamChat(q, chunk => {
        setAnswer(prev => prev + chunk)
      })
      setSources(srcs)
    } catch (err: any) {
      setAnswer(err?.message ?? 'Something went wrong.')
    }
    setLoading(false)
  }

  if (!open) return null

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={() => setOpen(false)}
    >
      <div
        className='w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden'
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <form onSubmit={handleSubmit} className='flex items-center border-b border-zinc-100'>
          <span className='pl-4 text-zinc-400 text-sm'>⌘</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder='Search your meetings…'
            className='flex-1 px-3 py-3.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none bg-transparent'
          />
          <button
            type='button'
            onClick={() => setOpen(false)}
            className='pr-4 text-zinc-300 hover:text-zinc-500 text-lg leading-none transition-colors'
          >
            ✕
          </button>
        </form>

        {/* Answer area */}
        {(loading || answer) && (
          <div className='px-4 py-4 max-h-72 overflow-auto'>
            {loading && !answer && (
              <div className='flex items-center gap-2 text-xs text-zinc-400'>
                <span className='recall-dot w-1.5 h-1.5 rounded-full inline-block' style={{ background: '#534AB7' }} />
                <span className='recall-dot w-1.5 h-1.5 rounded-full inline-block' style={{ background: '#534AB7' }} />
                <span className='recall-dot w-1.5 h-1.5 rounded-full inline-block' style={{ background: '#534AB7' }} />
                <span className='ml-1'>Recalling…</span>
              </div>
            )}
            {answer && (
              <div className='text-sm text-zinc-700'>
                <Markdown content={answer} />
              </div>
            )}
            {sources.length > 0 && (
              <div className='mt-3 pt-3 border-t border-zinc-100 flex flex-wrap gap-1.5'>
                {sources.slice(0, 3).map((s, i) => (
                  <span key={i} className='text-[11px] px-2 py-0.5 rounded-full font-medium'
                    style={{ background: '#F4F3FB', color: '#453C9E' }}>
                    {s.title} · {s.date}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer hint */}
        {!loading && !answer && (
          <div className='px-4 py-2.5 text-[11px] text-zinc-400 border-t border-zinc-50'>
            Press <kbd className='px-1 py-0.5 rounded bg-zinc-100 text-zinc-500 font-mono text-[10px]'>Enter</kbd> to search · <kbd className='px-1 py-0.5 rounded bg-zinc-100 text-zinc-500 font-mono text-[10px]'>Esc</kbd> to close
          </div>
        )}
      </div>
    </div>
  )
}

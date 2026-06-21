'use client'
import { useState, useRef, useEffect } from 'react'

interface Message { role: 'user' | 'assistant'; content: string; sources?: any[] }

const SUGGESTIONS = [
  'What decisions were made this week?',
  'Who owns open action items?',
  'What did we decide about pricing?',
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Ask me anything about your indexed meetings — decisions, action items, or any discussion.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Show suggestion chips only before the user has asked anything.
  const showSuggestions = messages.length === 1

  async function send(text?: string) {
    const query = (text ?? input).trim()
    if (!query || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: query }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || `HTTP ${res.status}`)
      }

      const sources = JSON.parse(res.headers.get('X-Sources') ?? '[]')
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let text = ''

      setMessages(prev => [...prev, { role: 'assistant', content: '', sources }])

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value)
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: text, sources }
          return updated
        })
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: err?.message || 'Something went wrong. Please try again.' }])
    }
    setLoading(false)
  }

  return (
    <div className='flex flex-col h-full'>
      {/* Header */}
      <div className='px-6 py-4 border-b border-zinc-200 bg-white'>
        <h1 className='text-[15px] font-semibold text-zinc-900 tracking-tight'>Ask anything</h1>
        <p className='text-xs text-zinc-400 mt-0.5'>Answers are grounded in your indexed meetings</p>
      </div>

      {/* Messages */}
      <div className='flex-1 overflow-auto px-6 py-6 space-y-5'>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' ? (
              <div className='max-w-[82%] border-l-2 pl-4' style={{ borderColor: '#534AB7' }}>
                <div className='text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap'>
                  {m.content || <span className='text-zinc-300 italic'>Thinking…</span>}
                </div>
                {m.sources?.length ? (
                  <div className='mt-3'>
                    <div className='text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1.5'>Sources</div>
                    <div className='flex flex-wrap gap-1.5'>
                      {m.sources.map((s: any, j: number) => (
                        <span key={j} className='text-[11px] px-2 py-0.5 rounded-full font-medium'
                          style={{ background: '#F4F3FB', color: '#453C9E' }}>
                          {s.title} · {s.date}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className='max-w-[82%] px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed text-white'
                style={{ background: '#534AB7' }}>
                {m.content}
              </div>
            )}
          </div>
        ))}
        {showSuggestions && (
          <div className='flex flex-wrap gap-2 pt-1'>
            {SUGGESTIONS.map(q => (
              <button
                key={q}
                onClick={() => send(q)}
                className='text-xs px-3 py-1.5 rounded-full border border-zinc-200 text-zinc-600 bg-white hover:border-[#534AB7] hover:text-[#534AB7] transition-colors'
              >
                {q}
              </button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className='px-6 py-4 border-t border-zinc-200 bg-white flex gap-2'>
        <input
          className='flex-1 border border-zinc-200 rounded-lg px-4 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-[#534AB7] focus:ring-1 focus:ring-[#534AB7] bg-zinc-50 disabled:opacity-50 transition-colors'
          placeholder='Ask about any meeting, decision, or action item…'
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          disabled={loading}
        />
        <button
          onClick={() => send()}
          disabled={loading}
          className='px-5 py-2.5 text-sm font-medium text-white rounded-lg disabled:opacity-40 transition-colors'
          style={{ background: '#534AB7' }}
          onMouseEnter={e => !loading && (e.currentTarget.style.background = '#453C9E')}
          onMouseLeave={e => (e.currentTarget.style.background = '#534AB7')}
        >
          {loading ? '…' : 'Send'}
        </button>
      </div>
    </div>
  )
}

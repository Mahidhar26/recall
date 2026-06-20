'use client'
import { useState, useRef, useEffect } from 'react'

interface Message { role: 'user' | 'assistant'; content: string; sources?: any[] }

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Ask me anything about your indexed meetings — decisions, action items, or any discussion.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send() {
    if (!input.trim() || loading) return
    const query = input.trim()
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
      <div className='p-4 border-b border-gray-200'>
        <h1 className='text-lg font-semibold'>Ask anything</h1>
      </div>

      <div className='flex-1 overflow-auto p-4 space-y-4'>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${ m.role === 'user' ? 'bg-purple-100 text-purple-900' : 'bg-white border border-gray-200' }`}>
              <div className='whitespace-pre-wrap'>{m.content || '…'}</div>
              {m.sources?.length ? (
                <div className='flex flex-wrap gap-1 mt-2'>
                  {m.sources.map((s: any, j: number) => (
                    <span key={j} className='text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded'>
                      {s.title} · {s.date}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className='p-4 border-t border-gray-200 flex gap-2'>
        <input
          className='flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500'
          placeholder='Ask about any meeting, decision, or action item…'
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          disabled={loading}
        />
        <button onClick={send} disabled={loading}
          className='px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 disabled:opacity-50'>
          {loading ? '…' : 'Send'}
        </button>
      </div>
    </div>
  )
}

'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Markdown } from '@/components/Markdown'
import { Toast } from '@/components/Toast'

interface Source { title: string; date: string; id: string; excerpt: string }
interface Message { role: 'user' | 'assistant'; content: string; sources?: Source[] }
type Phase = 'idle' | 'searching' | 'streaming'

const BOT_NAME = 'Recall'

const STARTER_SUGGESTIONS = [
  'What decisions were made this week?',
  'Who owns open action items?',
  'What did we decide about pricing?',
]

// Shown after an answer to keep the conversation moving.
const FOLLOWUP_SUGGESTIONS = [
  'Summarize the key takeaways',
  'What are the next steps?',
  'Which items are still blocked?',
  'Who was involved in this?',
  'When is this due?',
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Ask me anything about your indexed meetings — decisions, action items, or any discussion.' }
  ])
  const [input, setInput] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastKey, setToastKey] = useState(0)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleCopy(answerIndex: number) {
    const answer = messages[answerIndex]
    const question = messages[answerIndex - 1]
    const plainAnswer = answer.content.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/`([^`]+)`/g, '$1')
    const text = `Q: ${question?.content ?? ''}\nA: ${plainAnswer}\n\n— via Recall`
    navigator.clipboard.writeText(text)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToastKey(k => k + 1)
    setToastVisible(true)
    toastTimer.current = setTimeout(() => setToastVisible(false), 2000)
  }

  const loading = phase !== 'idle'

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, phase])
  useEffect(() => { if (!loading) inputRef.current?.focus() }, [loading])

  const last = messages[messages.length - 1]
  const showStarters = messages.length === 1
  // Offer follow-ups once a real answer has streamed in and we're idle.
  const showFollowups =
    !loading && messages.length > 1 && last.role === 'assistant' && !!last.content

  // Rotate follow-up chips so they don't feel static across turns.
  const followups = (() => {
    const offset = messages.length % FOLLOWUP_SUGGESTIONS.length
    return [...FOLLOWUP_SUGGESTIONS.slice(offset), ...FOLLOWUP_SUGGESTIONS.slice(0, offset)].slice(0, 3)
  })()

  async function send(text?: string) {
    const query = (text ?? input).trim()
    if (!query || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: query }])
    setPhase('searching')

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
      let started = false

      setMessages(prev => [...prev, { role: 'assistant', content: '', sources }])

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        if (!started) { started = true; setPhase('streaming') }
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
    setPhase('idle')
  }

  return (
    <div className='flex flex-col h-full'>
      {/* Header + progress bar */}
      <div className='border-b border-zinc-200 bg-white'>
        <div className='px-6 py-4 flex items-center gap-3'>
          <BotAvatar />
          <div>
            <h1 className='text-[15px] font-semibold text-zinc-900 tracking-tight'>{BOT_NAME}</h1>
            <p className='text-xs text-zinc-400'>Answers grounded in your indexed meetings</p>
          </div>
        </div>
        <div className='h-0.5 relative overflow-hidden bg-transparent'>
          {loading && <div className='recall-progress-bar absolute inset-0' />}
        </div>
      </div>

      {/* Messages */}
      <div className='flex-1 overflow-auto px-6 py-6 space-y-5'>
        {messages.map((m, i) => (
          m.role === 'assistant' ? (
            <div key={i} className='recall-rise flex gap-3'>
              <BotAvatar />
              <div className='flex-1 min-w-0'>
                <div className='flex items-center justify-between mb-1'>
                  <div className='text-xs font-semibold text-zinc-700'>{BOT_NAME}</div>
                  {m.content && i > 0 && (
                    <button
                      onClick={() => handleCopy(i)}
                      title='Copy answer'
                      className='text-zinc-300 hover:text-[#534AB7] transition-colors text-[13px] leading-none'
                    >
                      ⎘
                    </button>
                  )}
                </div>
                <div className='rounded-2xl rounded-tl-sm border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700'>
                  {m.content ? <Markdown content={m.content} /> : <TypingDots />}
                  {m.sources?.length ? (
                    <div className='mt-3 pt-3 border-t border-zinc-100'>
                      <div className='text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2'>Sources</div>
                      <div className='flex flex-col gap-2'>
                        {m.sources.slice(0, 3).map((s, j) => (
                          <Link
                            key={j}
                            href={`/meetings/${s.id}`}
                            className='block rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 hover:border-[#534AB7] hover:bg-[#F4F3FB] transition-colors group'
                          >
                            <div className='flex items-center justify-between gap-2'>
                              <span className='text-[12px] font-semibold text-zinc-700 group-hover:text-[#534AB7] transition-colors truncate'>
                                {s.title}
                              </span>
                              <span className='text-[10px] text-zinc-400 shrink-0'>{s.date}</span>
                            </div>
                            {s.excerpt && (
                              <p className='text-[11px] text-zinc-400 mt-0.5 truncate'>{s.excerpt}</p>
                            )}
                          </Link>
                        ))}
                        {m.sources.length > 3 && (
                          <span className='text-[11px] text-zinc-400 pl-1'>+{m.sources.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div key={i} className='recall-rise flex gap-3 justify-end'>
              <div className='flex flex-col items-end min-w-0'>
                <div className='text-xs font-semibold text-zinc-500 mb-1'>You</div>
                <div className='max-w-full px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed text-white'
                  style={{ background: '#534AB7' }}>
                  {m.content}
                </div>
              </div>
            </div>
          )
        ))}

        {/* Searching status (before first token) */}
        {phase === 'searching' && (
          <div className='recall-rise flex gap-3'>
            <BotAvatar />
            <div className='flex items-center gap-2 text-xs text-zinc-400 mt-6'>
              <TypingDots />
              <span>Recalling…</span>
            </div>
          </div>
        )}

        {/* Starter suggestions (empty chat) */}
        {showStarters && (
          <SuggestionRow label='Try asking' items={STARTER_SUGGESTIONS} onPick={send} />
        )}

        {/* Follow-up suggestions (after an answer) */}
        {showFollowups && (
          <SuggestionRow label='Ask a follow-up' items={followups} onPick={send} />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className='px-6 py-4 border-t border-zinc-200 bg-white flex gap-2'>
        <input
          ref={inputRef}
          className='flex-1 border border-zinc-200 rounded-lg px-4 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-[#534AB7] focus:ring-1 focus:ring-[#534AB7] bg-zinc-50 disabled:opacity-50 transition-colors'
          placeholder={loading ? 'Recall is answering…' : 'Ask about any meeting, decision, or action item…'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          disabled={loading}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className='px-5 py-2.5 text-sm font-medium text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
          style={{ background: '#534AB7' }}
          onMouseEnter={e => !loading && input.trim() && (e.currentTarget.style.background = '#453C9E')}
          onMouseLeave={e => (e.currentTarget.style.background = '#534AB7')}
        >
          {loading ? '…' : 'Send'}
        </button>
      </div>
      <Toast message='Copied!' visible={toastVisible} animKey={toastKey} />
    </div>
  )
}

function SuggestionRow({ label, items, onPick }: { label: string; items: string[]; onPick: (q: string) => void }) {
  return (
    <div className='recall-rise pt-1'>
      <div className='text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2'>{label}</div>
      <div className='flex flex-wrap gap-2'>
        {items.map(q => (
          <button
            key={q}
            onClick={() => onPick(q)}
            className='text-xs px-3 py-1.5 rounded-full border border-zinc-200 text-zinc-600 bg-white hover:border-[#534AB7] hover:text-[#534AB7] transition-colors'
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

function BotAvatar() {
  return (
    <div
      className='w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-white text-xs font-bold'
      style={{ background: 'linear-gradient(135deg, #534AB7, #1D9E75)' }}
    >
      R
    </div>
  )
}

function TypingDots() {
  return (
    <span className='inline-flex items-center gap-1 align-middle'>
      <span className='recall-dot w-1.5 h-1.5 rounded-full' style={{ background: '#534AB7' }} />
      <span className='recall-dot w-1.5 h-1.5 rounded-full' style={{ background: '#534AB7' }} />
      <span className='recall-dot w-1.5 h-1.5 rounded-full' style={{ background: '#534AB7' }} />
    </span>
  )
}

'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Markdown } from '@/components/Markdown'
import { Toast } from '@/components/Toast'
import { streamChat, Source } from '@/lib/chat-stream'
import {
  ChatFilters, EMPTY_FILTERS, normalizeFilters, isFilterActive, activeFilterCount,
} from '@/lib/chat-filters'
import {
  FilterOptions, SessionSummary,
  getFilterOptions, listSessions, getSession, createSession, deleteSession, saveMessage,
} from '@/lib/chat-api'

interface Message { role: 'user' | 'assistant'; content: string; sources?: Source[] }
type Phase = 'idle' | 'searching' | 'streaming'

const BOT_NAME = 'Recall'
const GREETING: Message = {
  role: 'assistant',
  content: 'Ask me anything about your indexed meetings — decisions, action items, or any discussion.',
}

const STARTER_SUGGESTIONS = [
  'What decisions were made this week?',
  'Who owns open action items?',
  'What did we decide about pricing?',
]
const FOLLOWUP_SUGGESTIONS = [
  'Summarize the key takeaways',
  'What are the next steps?',
  'Which items are still blocked?',
  'Who was involved in this?',
  'When is this due?',
]
const SOURCE_LABELS: Record<string, string> = { upload: 'Upload', notion: 'Notion', zoom: 'Zoom' }

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([GREETING])
  const [input, setInput] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')

  const [filters, setFilters] = useState<ChatFilters>(EMPTY_FILTERS)
  const [options, setOptions] = useState<FilterOptions>({ meetings: [], people: [], sources: [] })
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastKey, setToastKey] = useState(0)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loading = phase !== 'idle'

  useEffect(() => { getFilterOptions().then(setOptions).catch(() => {}) }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, phase])
  useEffect(() => { if (!loading) inputRef.current?.focus() }, [loading])

  function refreshSessions() {
    listSessions().then(r => setSessions(r.sessions)).catch(() => {})
  }
  useEffect(() => { if (showHistory) refreshSessions() }, [showHistory])

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

  const last = messages[messages.length - 1]
  const showStarters = messages.length === 1 && !sessionId
  const showFollowups = !loading && messages.length > 1 && last.role === 'assistant' && !!last.content
  const followups = (() => {
    const offset = messages.length % FOLLOWUP_SUGGESTIONS.length
    return [...FOLLOWUP_SUGGESTIONS.slice(offset), ...FOLLOWUP_SUGGESTIONS.slice(0, offset)].slice(0, 3)
  })()

  async function send(text?: string) {
    const query = (text ?? input).trim()
    if (!query || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: query }, { role: 'assistant', content: '', sources: [] }])
    setPhase('searching')

    let acc = ''
    try {
      // Create a session lazily on the first message; persistence is best-effort
      // so a storage hiccup never blocks the answer.
      let sid = sessionId
      if (!sid) {
        try { const r = await createSession(query, filters); sid = r.sessionId; setSessionId(sid) } catch {}
      }
      if (sid) saveMessage({ sessionId: sid, role: 'user', content: query, filters }).catch(() => {})

      let started = false
      const sources = await streamChat(query, filters, chunk => {
        if (!started) { started = true; setPhase('streaming') }
        acc += chunk
        setMessages(prev => {
          const u = [...prev]
          u[u.length - 1] = { ...u[u.length - 1], content: acc }
          return u
        })
      })

      setMessages(prev => {
        const u = [...prev]
        u[u.length - 1] = { ...u[u.length - 1], sources }
        return u
      })
      if (sid) saveMessage({ sessionId: sid, role: 'assistant', content: acc, sources, filters }).catch(() => {})
    } catch (err: any) {
      setMessages(prev => {
        const u = [...prev]
        const l = u[u.length - 1]
        const msg = err?.message || 'Something went wrong. Please try again.'
        if (l?.role === 'assistant') { u[u.length - 1] = { role: 'assistant', content: msg }; return u }
        return [...prev, { role: 'assistant', content: msg }]
      })
    }
    setPhase('idle')
  }

  async function restoreSession(id: string) {
    try {
      const { session, messages: msgs } = await getSession(id)
      setSessionId(session.id)
      setFilters(normalizeFilters(session.filters))
      setMessages(
        msgs.length
          ? msgs.map(m => ({ role: m.role, content: m.content, sources: m.sources }))
          : [GREETING]
      )
      setShowHistory(false)
      setShowFilters(false)
    } catch {}
  }

  function newChat() {
    setSessionId(null)
    setMessages([GREETING])
    setInput('')
    setShowHistory(false)
  }

  async function removeSession(id: string) {
    try {
      await deleteSession(id)
      setSessions(prev => prev.filter(s => s.id !== id))
      if (id === sessionId) newChat()
    } catch {}
  }

  const filterActive = isFilterActive(filters)

  return (
    <div className='relative flex flex-col h-full'>
      {/* Header */}
      <div className='border-b border-zinc-200 bg-white'>
        <div className='px-6 py-4 flex items-center gap-3'>
          <BotAvatar />
          <div className='flex-1 min-w-0'>
            <h1 className='text-[15px] font-semibold text-zinc-900 tracking-tight'>{BOT_NAME}</h1>
            <p className='text-xs text-zinc-400'>Answers grounded in your indexed meetings</p>
          </div>
          <button
            onClick={() => { setShowFilters(s => !s); setShowHistory(false) }}
            className={`flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-lg border transition-colors ${
              showFilters || filterActive
                ? 'border-[#534AB7] text-[#534AB7] bg-[#F4F3FB]'
                : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'
            }`}
          >
            <span>Filters</span>
            {filterActive && (
              <span className='inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-semibold text-white' style={{ background: '#534AB7' }}>
                {activeFilterCount(filters)}
              </span>
            )}
          </button>
          <button
            onClick={() => { setShowHistory(s => !s); setShowFilters(false) }}
            className={`text-[13px] font-medium px-3 py-1.5 rounded-lg border transition-colors ${
              showHistory ? 'border-[#534AB7] text-[#534AB7] bg-[#F4F3FB]' : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'
            }`}
          >
            History
          </button>
          <button
            onClick={newChat}
            className='text-[13px] font-medium px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90'
            style={{ background: '#534AB7' }}
          >
            New chat
          </button>
        </div>

        {/* Active filter summary */}
        {filterActive && (
          <div className='px-6 pb-3 flex items-center gap-2 text-[12px] text-zinc-500'>
            <span className='font-mono-ui text-[11px] uppercase tracking-wider text-zinc-400'>Scope</span>
            <span className='truncate'>{filterSummary(filters, options)}</span>
            <button onClick={() => setFilters(EMPTY_FILTERS)} className='ml-auto shrink-0 text-[12px] font-medium text-[#534AB7] hover:underline'>
              Clear all
            </button>
          </div>
        )}

        {/* Progress bar */}
        <div className='h-0.5 relative overflow-hidden bg-transparent'>
          {loading && <div className='recall-progress-bar absolute inset-0' />}
        </div>

        {showFilters && (
          <FiltersPanel
            filters={filters}
            options={options}
            onChange={setFilters}
            onClose={() => setShowFilters(false)}
          />
        )}
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
                    <button onClick={() => handleCopy(i)} title='Copy answer' className='text-zinc-300 hover:text-[#534AB7] transition-colors text-[13px] leading-none'>⎘</button>
                  )}
                </div>
                <div className='rounded-2xl rounded-tl-sm border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700'>
                  {m.content ? <Markdown content={m.content} /> : <TypingDots />}
                  {m.sources?.length ? (
                    <div className='mt-3 pt-3 border-t border-zinc-100'>
                      <div className='text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2'>Sources</div>
                      <div className='flex flex-col gap-2'>
                        {m.sources.slice(0, 3).map((s, j) => (
                          <Link key={j} href={`/app/meetings/${s.id}`} className='block rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 hover:border-[#534AB7] hover:bg-[#F4F3FB] transition-colors group'>
                            <div className='flex items-center justify-between gap-2'>
                              <span className='text-[12px] font-semibold text-zinc-700 group-hover:text-[#534AB7] transition-colors truncate'>{s.title}</span>
                              <span className='text-[10px] text-zinc-400 shrink-0'>{s.date}</span>
                            </div>
                            {s.excerpt && <p className='text-[11px] text-zinc-400 mt-0.5 truncate'>{s.excerpt}</p>}
                          </Link>
                        ))}
                        {m.sources.length > 3 && <span className='text-[11px] text-zinc-400 pl-1'>+{m.sources.length - 3} more</span>}
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
                <div className='max-w-full px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed text-white' style={{ background: '#534AB7' }}>
                  {m.content}
                </div>
              </div>
            </div>
          )
        ))}

        {phase === 'searching' && (
          <div className='recall-rise flex gap-3'>
            <BotAvatar />
            <div className='flex items-center gap-2 text-xs text-zinc-400 mt-6'>
              <TypingDots />
              <span>Recalling…</span>
            </div>
          </div>
        )}

        {showStarters && <SuggestionRow label='Try asking' items={STARTER_SUGGESTIONS} onPick={send} />}
        {showFollowups && <SuggestionRow label='Ask a follow-up' items={followups} onPick={send} />}

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
        >
          {loading ? '…' : 'Send'}
        </button>
      </div>

      {/* History drawer */}
      {showHistory && (
        <HistoryDrawer
          sessions={sessions}
          activeId={sessionId}
          onRestore={restoreSession}
          onDelete={removeSession}
          onNew={newChat}
          onClose={() => setShowHistory(false)}
        />
      )}

      <Toast message='Copied!' visible={toastVisible} animKey={toastKey} />
    </div>
  )
}

/* ── Filters panel ─────────────────────────────────────────── */
function FiltersPanel({
  filters, options, onChange,
}: {
  filters: ChatFilters
  options: FilterOptions
  onChange: (f: ChatFilters) => void
  onClose: () => void
}) {
  const set = (patch: Partial<ChatFilters>) => onChange({ ...filters, ...patch })
  const toggle = (key: 'meetingIds' | 'people' | 'sourceTypes', value: string) => {
    const arr = filters[key]
    set({ [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] } as Partial<ChatFilters>)
  }
  const sourceTypes = options.sources.length ? options.sources : ['upload', 'notion', 'zoom']

  return (
    <div className='recall-rise border-t border-zinc-100 bg-[#FAFAF9] px-6 py-5 grid gap-6 md:grid-cols-4'>
      {/* Date range */}
      <div>
        <FilterLabel>Date range</FilterLabel>
        <div className='flex flex-wrap gap-1.5 mb-2.5'>
          {DATE_PRESETS.map(p => (
            <button key={p.label} onClick={() => { const { from, to } = p.range(); set({ dateFrom: from, dateTo: to }) }}
              className='text-[11px] px-2 py-1 rounded-md border border-zinc-200 text-zinc-600 bg-white hover:border-[#534AB7] hover:text-[#534AB7] transition-colors'>
              {p.label}
            </button>
          ))}
        </div>
        <div className='flex items-center gap-1.5'>
          <input type='date' value={filters.dateFrom ?? ''} onChange={e => set({ dateFrom: e.target.value || null })} className='recall-date' />
          <span className='text-zinc-300 text-xs'>→</span>
          <input type='date' value={filters.dateTo ?? ''} onChange={e => set({ dateTo: e.target.value || null })} className='recall-date' />
        </div>
      </div>

      {/* Meetings */}
      <CheckList
        label={`Meetings${filters.meetingIds.length ? ` · ${filters.meetingIds.length}` : ''}`}
        empty='No meetings indexed yet'
        items={options.meetings.map(m => ({ value: m.id, label: m.title, sub: m.date }))}
        selected={filters.meetingIds}
        onToggle={v => toggle('meetingIds', v)}
      />

      {/* People */}
      <CheckList
        label={`People${filters.people.length ? ` · ${filters.people.length}` : ''}`}
        empty='No speakers indexed yet'
        items={options.people.map(p => ({ value: p, label: p }))}
        selected={filters.people}
        onToggle={v => toggle('people', v)}
      />

      {/* Source type */}
      <div>
        <FilterLabel>Source</FilterLabel>
        <div className='space-y-1.5'>
          {sourceTypes.map(s => (
            <label key={s} className='flex items-center gap-2 text-[13px] text-zinc-700 cursor-pointer'>
              <input type='checkbox' checked={filters.sourceTypes.includes(s)} onChange={() => toggle('sourceTypes', s)} className='accent-[#534AB7]' />
              {SOURCE_LABELS[s] ?? s}
            </label>
          ))}
        </div>
      </div>

      <style>{`
        .recall-date { font-size: 12px; color: #3f3f46; border: 1px solid #e4e4e7; border-radius: 6px; padding: 4px 7px; background: #fff; }
        .recall-date:focus { outline: none; border-color: #534AB7; }
      `}</style>
    </div>
  )
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return <div className='font-mono-ui text-[11px] uppercase tracking-wider text-zinc-500 mb-2.5'>{children}</div>
}

function CheckList({
  label, items, selected, onToggle, empty,
}: {
  label: string
  items: { value: string; label: string; sub?: string }[]
  selected: string[]
  onToggle: (v: string) => void
  empty: string
}) {
  return (
    <div>
      <FilterLabel>{label}</FilterLabel>
      {items.length === 0 ? (
        <p className='text-[12px] text-zinc-400 italic'>{empty}</p>
      ) : (
        <div className='max-h-32 overflow-auto pr-1 space-y-1.5'>
          {items.map(it => (
            <label key={it.value} className='flex items-start gap-2 text-[13px] text-zinc-700 cursor-pointer'>
              <input type='checkbox' checked={selected.includes(it.value)} onChange={() => onToggle(it.value)} className='mt-0.5 accent-[#534AB7]' />
              <span className='min-w-0'>
                <span className='block truncate'>{it.label}</span>
                {it.sub && <span className='block text-[11px] text-zinc-400'>{it.sub}</span>}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── History drawer ────────────────────────────────────────── */
function HistoryDrawer({
  sessions, activeId, onRestore, onDelete, onNew, onClose,
}: {
  sessions: SessionSummary[]
  activeId: string | null
  onRestore: (id: string) => void
  onDelete: (id: string) => void
  onNew: () => void
  onClose: () => void
}) {
  return (
    <>
      <div className='absolute inset-0 z-20 bg-black/10' onClick={onClose} />
      <aside className='absolute top-0 right-0 z-30 h-full w-80 bg-white border-l border-zinc-200 shadow-xl flex flex-col recall-rise'>
        <div className='px-5 py-4 border-b border-zinc-100 flex items-center justify-between'>
          <h2 className='text-sm font-semibold text-zinc-900'>History</h2>
          <button onClick={onClose} className='text-zinc-300 hover:text-zinc-500 text-lg leading-none'>✕</button>
        </div>
        <button onClick={onNew} className='mx-4 mt-3 mb-1 text-[13px] font-medium text-[#534AB7] border border-dashed border-[#C9C4EC] rounded-lg py-2 hover:bg-[#F4F3FB] transition-colors'>
          + New chat
        </button>
        <div className='flex-1 overflow-auto px-3 py-2 space-y-1'>
          {sessions.length === 0 ? (
            <p className='text-[12px] text-zinc-400 px-2 py-4 text-center'>No saved chats yet.</p>
          ) : sessions.map(s => (
            <div key={s.id}
              className={`group rounded-lg px-3 py-2.5 cursor-pointer border transition-colors ${
                s.id === activeId ? 'border-[#534AB7] bg-[#F4F3FB]' : 'border-transparent hover:bg-zinc-50'
              }`}
              onClick={() => onRestore(s.id)}>
              <div className='flex items-start justify-between gap-2'>
                <span className='text-[13px] font-medium text-zinc-800 truncate'>{s.title || 'Untitled chat'}</span>
                <button
                  onClick={e => { e.stopPropagation(); onDelete(s.id) }}
                  className='opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 text-[13px] leading-none transition-opacity shrink-0'
                  title='Delete chat'
                >✕</button>
              </div>
              {s.last_message && <p className='text-[11px] text-zinc-400 truncate mt-0.5'>{s.last_message}</p>}
              <div className='font-mono-ui text-[10px] uppercase tracking-wider text-zinc-400 mt-1'>
                {s.updated_label} · {s.message_count} msg
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  )
}

/* ── Misc UI ───────────────────────────────────────────────── */
function SuggestionRow({ label, items, onPick }: { label: string; items: string[]; onPick: (q: string) => void }) {
  return (
    <div className='recall-rise pt-1'>
      <div className='text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2'>{label}</div>
      <div className='flex flex-wrap gap-2'>
        {items.map(q => (
          <button key={q} onClick={() => onPick(q)} className='text-xs px-3 py-1.5 rounded-full border border-zinc-200 text-zinc-600 bg-white hover:border-[#534AB7] hover:text-[#534AB7] transition-colors'>
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

function BotAvatar() {
  return <div className='w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-white text-xs font-bold' style={{ background: 'linear-gradient(135deg, #534AB7, #1D9E75)' }}>R</div>
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

/* ── Date presets + summary ────────────────────────────────── */
function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const DATE_PRESETS: { label: string; range: () => { from: string | null; to: string | null } }[] = [
  { label: 'Today', range: () => { const t = new Date(); return { from: isoDate(t), to: isoDate(t) } } },
  { label: 'This week', range: () => { const t = new Date(); const d = new Date(t); const day = (t.getDay() + 6) % 7; d.setDate(t.getDate() - day); return { from: isoDate(d), to: isoDate(t) } } },
  { label: 'This month', range: () => { const t = new Date(); return { from: isoDate(new Date(t.getFullYear(), t.getMonth(), 1)), to: isoDate(t) } } },
  { label: 'Last 30 days', range: () => { const t = new Date(); const d = new Date(t); d.setDate(t.getDate() - 29); return { from: isoDate(d), to: isoDate(t) } } },
  { label: 'All time', range: () => ({ from: null, to: null }) },
]

function shortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function filterSummary(f: ChatFilters, options: FilterOptions): string {
  const parts: string[] = []
  if (f.dateFrom || f.dateTo) {
    parts.push(`${f.dateFrom ? shortDate(f.dateFrom) : '…'} – ${f.dateTo ? shortDate(f.dateTo) : '…'}`)
  }
  if (f.meetingIds.length) parts.push(`${f.meetingIds.length} of ${options.meetings.length || f.meetingIds.length} meetings`)
  if (f.people.length) parts.push(`${f.people.length} ${f.people.length === 1 ? 'person' : 'people'}`)
  if (f.sourceTypes.length) parts.push(f.sourceTypes.map(s => SOURCE_LABELS[s] ?? s).join(' / '))
  return parts.join(' · ')
}

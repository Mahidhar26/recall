# Recall Feature Sprint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship five features: Vercel region config, upload progress stepper, citation cards in chat, share-answer button with toast, and ⌘K global search modal.

**Architecture:** All five features are frontend-only or thin API additions — no schema changes required. The ⌘K modal extracts chat streaming into a shared helper so both the modal and the full chat page reuse it. Layout stays a Server Component; a new `ClientShell` wrapper hosts client-only globals (modal, toast).

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind v4, `pg` (node-postgres), Anthropic SDK (`claude-haiku-4-5-20251001`), `navigator.clipboard`

## Global Constraints

- Brand purple: `#534AB7` — use for active states, buttons, focus rings
- Brand teal: `#1D9E75` — use for success / complete states
- Dark sidebar background: `#0D0D12`
- Page background: `#FAFAF9`
- No new npm dependencies — use only packages already in `node_modules`
- No schema changes
- No test framework — use manual browser verification steps
- Tailwind v4 syntax: `@import "tailwindcss"` in globals.css (already present)
- Path alias `@/*` → `src/*` (tsconfig already configured)
- All new components go in `src/components/`, all new lib helpers in `src/lib/`
- Animation classes `.recall-spin`, `.recall-pulse`, `.recall-rise`, `.recall-dot` already defined in `src/app/globals.css`

---

### Task 1: vercel.json — Region + Timeout Config

**Files:**
- Create: `vercel.json` (project root, alongside `package.json`)

**Interfaces:**
- Produces: nothing consumed by other tasks — standalone config file

- [ ] **Step 1: Create `vercel.json`**

```json
{
  "regions": ["iad1"],
  "functions": {
    "src/app/api/upload/route.ts": {
      "maxDuration": 60
    }
  }
}
```

- [ ] **Step 2: Verify the file is at the project root**

```bash
ls vercel.json
cat vercel.json
```

Expected: file present, content matches above exactly.

- [ ] **Step 3: Commit**

```bash
git add vercel.json
git commit -m "feat: add vercel.json pinning iad1 region and 60s upload timeout"
```

---

### Task 2: Upload Progress Stepper

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: nothing from other tasks
- Produces: nothing consumed by other tasks

**Context:** `page.tsx` currently has `STEPS = ['Parsing', 'Chunking', 'Embedding', 'Extracting']` (4 steps, horizontal layout, single `setInterval` at 2500ms). Replace with 6 steps at specific offsets, vertical layout.

- [ ] **Step 1: Replace `STEPS` constant and timer logic in `handleUpload`**

In `src/app/page.tsx`, replace the top-level `STEPS` constant and the `handleUpload` timer block:

```tsx
// Replace this:
const STEPS = ['Parsing', 'Chunking', 'Embedding', 'Extracting']

// With this:
const STEPS = [
  'Parsing file',
  'Creating chunks',
  'Generating embeddings',
  'Extracting actions',
  'Extracting decisions',
  'Done',
]
const STEP_DELAYS = [0, 1500, 3000, 6000, 9000, 12000]
```

- [ ] **Step 2: Replace the timer logic in `handleUpload`**

The current code uses a single `setInterval`. Replace the entire timer setup and teardown inside `handleUpload`:

```tsx
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
```

Also remove `stepTimer` ref — it's no longer needed:
- Delete: `const stepTimer = useRef<ReturnType<typeof setInterval> | null>(null)`
- Remove `stepTimer.current = setInterval(...)` and `clearInterval` calls

- [ ] **Step 3: Replace `UploadProgress` component with vertical stepper**

Replace the entire `UploadProgress` function at the bottom of `page.tsx`:

```tsx
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
```

- [ ] **Step 4: Manually verify**

```bash
npm run dev
```

Open `http://localhost:3001`, drag a `.txt` file onto the upload zone.
Expected:
- Vertical stepper appears immediately
- "Parsing file" shows spinning gradient ring
- Steps advance with green checkmarks at ~1.5s / 3s / 6s / 9s / 12s
- "Done" step completes and meeting appears in the list below
- On error: stepper freezes at active step (no visual regression)

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: replace upload stepper with 6-step vertical progress UI"
```

---

### Task 3: Add Excerpt to Chat API Sources

**Files:**
- Modify: `src/app/api/chat/route.ts` (line 79)

**Interfaces:**
- Produces: `Source` shape used by Tasks 4 and 6:
  ```ts
  type Source = { title: string; date: string; id: string; excerpt: string }
  ```

**Context:** The `X-Sources` header already includes `{ title, date, id }`. Add `excerpt` = first 100 chars of `c.content`.

- [ ] **Step 1: Add `excerpt` to the X-Sources map**

In `src/app/api/chat/route.ts`, find line ~79:

```ts
// Current:
'X-Sources': JSON.stringify(chunks.slice(0, 4).map((c: any) => ({
  title: c.meeting_title, date: c.meeting_date, id: c.meeting_id
}))),
```

Replace with:

```ts
'X-Sources': JSON.stringify(chunks.slice(0, 4).map((c: any) => ({
  title: c.meeting_title,
  date: c.meeting_date,
  id: c.meeting_id,
  excerpt: c.content.slice(0, 100).replace(/\s+/g, ' ').trim(),
}))),
```

- [ ] **Step 2: Manually verify**

```bash
npm run dev
```

Open browser DevTools → Network. Send a chat message. Inspect the `/api/chat` response headers.
Expected: `X-Sources` contains objects with `title`, `date`, `id`, and `excerpt` fields.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "feat: add excerpt field to chat API source objects"
```

---

### Task 4: Citation Cards in Chat

**Files:**
- Modify: `src/app/chat/page.tsx`

**Interfaces:**
- Consumes: `Source = { title: string; date: string; id: string; excerpt: string }` from Task 3

**Context:** `chat/page.tsx` currently renders source pills as:
```tsx
<span className='text-[11px] px-2 py-0.5 rounded-full font-medium'
  style={{ background: '#F4F3FB', color: '#453C9E' }}>
  {s.title} · {s.date}
</span>
```
Replace the pill row with citation cards that link to `/meetings/[id]`.

- [ ] **Step 1: Update the `Message` interface to include `excerpt` in sources**

In `chat/page.tsx`, find:
```ts
interface Message { role: 'user' | 'assistant'; content: string; sources?: any[] }
```
Replace with:
```ts
interface Source { title: string; date: string; id: string; excerpt: string }
interface Message { role: 'user' | 'assistant'; content: string; sources?: Source[] }
```

- [ ] **Step 2: Replace the sources pill block with citation cards**

Find the sources rendering block inside the assistant message (inside the `m.sources?.length ? (...)` block):

```tsx
// Current:
<div className='mt-3 pt-3 border-t border-zinc-100'>
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
```

Replace with:

```tsx
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
```

- [ ] **Step 3: Add `Link` import if not already present**

At the top of `chat/page.tsx`, ensure:
```tsx
import Link from 'next/link'
```

- [ ] **Step 4: Manually verify**

Open `http://localhost:3001/chat`, ask a question about an indexed meeting.
Expected:
- Source cards appear below the answer with title, date, and excerpt
- Cards have hover highlight (purple border + light purple bg)
- Clicking a card navigates to `/meetings/[id]`
- If more than 3 sources, "+N more" label appears

- [ ] **Step 5: Commit**

```bash
git add src/app/chat/page.tsx
git commit -m "feat: replace source pills with clickable citation cards in chat"
```

---

### Task 5: Share Answer Button + Toast

**Files:**
- Create: `src/components/Toast.tsx`
- Modify: `src/app/chat/page.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `Message[]` state already in `ChatPage` — uses `messages[i-1].content` to get the preceding question
- Produces: nothing consumed by other tasks

- [ ] **Step 1: Add toast animation to `globals.css`**

Append to `src/app/globals.css`:

```css
/* Share toast */
@keyframes recall-toast-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes recall-toast-out {
  from { opacity: 1; }
  to   { opacity: 0; }
}
.recall-toast-enter { animation: recall-toast-in 0.2s ease-out both; }
.recall-toast-exit  { animation: recall-toast-out 0.3s ease-in both; }
```

- [ ] **Step 2: Create `src/components/Toast.tsx`**

```tsx
'use client'
import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  visible: boolean
}

export function Toast({ message, visible }: ToastProps) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (!visible) return
    setExiting(false)
    const t = setTimeout(() => setExiting(true), 1700)
    return () => clearTimeout(t)
  }, [visible])

  if (!visible && !exiting) return null

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium shadow-lg ${
        exiting ? 'recall-toast-exit' : 'recall-toast-enter'
      }`}
      style={{ background: '#534AB7' }}
    >
      <span>✓</span>
      <span>{message}</span>
    </div>
  )
}
```

- [ ] **Step 3: Add toast state and `handleCopy` to `ChatPage`**

In `src/app/chat/page.tsx`, add toast state after the existing state declarations:

```tsx
const [toastVisible, setToastVisible] = useState(false)
const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

function handleCopy(answerIndex: number) {
  const answer = messages[answerIndex]
  const question = messages[answerIndex - 1]
  const plainAnswer = answer.content.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/`([^`]+)`/g, '$1')
  const text = `Q: ${question?.content ?? ''}\nA: ${plainAnswer}\n\n— via Recall`
  navigator.clipboard.writeText(text)
  if (toastTimer.current) clearTimeout(toastTimer.current)
  setToastVisible(true)
  toastTimer.current = setTimeout(() => setToastVisible(false), 2000)
}
```

- [ ] **Step 4: Import `Toast` and add it + the copy button to the JSX**

At the top of `chat/page.tsx`, add:
```tsx
import { Toast } from '@/components/Toast'
```

In the JSX, add `<Toast>` just before the closing `</div>` of the component return:
```tsx
      <Toast message='Copied!' visible={toastVisible} />
    </div>
  )
```

Inside the assistant message bubble, add a copy button in the top-right of the bubble container. Find the assistant message outer div:

```tsx
// Find this div (the one wrapping BotAvatar + content):
<div key={i} className='recall-rise flex gap-3'>
  <BotAvatar />
  <div className='flex-1 min-w-0'>
    <div className='text-xs font-semibold text-zinc-700 mb-1'>{BOT_NAME}</div>
    <div className='rounded-2xl rounded-tl-sm border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700'>
```

Replace the outer assistant wrapper to add a `relative group` and position the copy button:

```tsx
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
```

- [ ] **Step 5: Manually verify**

Open `http://localhost:3001/chat`, get an answer. Click the ⎘ button.
Expected:
- Purple "✓ Copied!" toast appears bottom-right
- Toast disappears after ~2s
- Clipboard contains `Q: ...\nA: ...\n\n— via Recall`
- Clicking again re-triggers the toast

- [ ] **Step 6: Commit**

```bash
git add src/components/Toast.tsx src/app/chat/page.tsx src/app/globals.css
git commit -m "feat: add share-answer copy button with Copied! toast"
```

---

### Task 6: ⌘K Global Search Modal

**Files:**
- Create: `src/lib/chat-stream.ts`
- Create: `src/components/CmdKModal.tsx`
- Create: `src/components/ClientShell.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/chat/page.tsx` (refactor to use shared helper)

**Interfaces:**
- Consumes: `Source` type from Task 3, `POST /api/chat` endpoint
- Produces: `streamChat` helper consumed by both `CmdKModal` and `chat/page.tsx`

```ts
// src/lib/chat-stream.ts exports:
export async function streamChat(
  query: string,
  onChunk: (chunk: string) => void
): Promise<Source[]>
```

- [ ] **Step 1: Create `src/lib/chat-stream.ts`**

```ts
export interface Source {
  title: string
  date: string
  id: string
  excerpt: string
}

export async function streamChat(
  query: string,
  onChunk: (chunk: string) => void
): Promise<Source[]> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })

  if (!res.ok) throw new Error(await res.text())

  const sources: Source[] = JSON.parse(res.headers.get('X-Sources') ?? '[]')
  const reader = res.body?.getReader()
  const decoder = new TextDecoder()

  if (reader) {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      onChunk(decoder.decode(value))
    }
  }

  return sources
}
```

- [ ] **Step 2: Refactor `chat/page.tsx` to use `streamChat`**

In `src/app/chat/page.tsx`, add the import:
```tsx
import { streamChat, Source } from '@/lib/chat-stream'
```

Replace the existing `send` function's fetch+stream block:

```tsx
// Remove these imports if they become unused after refactor:
// (keep useState, useRef, useEffect — only remove manual fetch if fully replaced)

async function send(text?: string) {
  const query = (text ?? input).trim()
  if (!query || loading) return
  setInput('')
  setMessages(prev => [...prev, { role: 'user', content: query }])
  setPhase('searching')

  try {
    setMessages(prev => [...prev, { role: 'assistant', content: '', sources: [] }])
    let started = false

    const sources = await streamChat(query, chunk => {
      if (!started) { started = true; setPhase('streaming') }
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: updated[updated.length - 1].content + chunk,
        }
        return updated
      })
    })

    // Attach sources to the last message
    setMessages(prev => {
      const updated = [...prev]
      updated[updated.length - 1] = { ...updated[updated.length - 1], sources }
      return updated
    })
  } catch (err: any) {
    setMessages(prev => [...prev, { role: 'assistant', content: err?.message || 'Something went wrong. Please try again.' }])
  }
  setPhase('idle')
}
```

- [ ] **Step 3: Create `src/components/CmdKModal.tsx`**

```tsx
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
```

- [ ] **Step 4: Create `src/components/ClientShell.tsx`**

`layout.tsx` is a Server Component so it can't directly mount a Client Component with hooks. Wrap `<main>` in a thin client shell:

```tsx
'use client'
import { CmdKModal } from '@/components/CmdKModal'

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <main className='flex-1 overflow-auto'>
      {children}
      <CmdKModal />
    </main>
  )
}
```

- [ ] **Step 5: Update `src/app/layout.tsx` to use `ClientShell`**

```tsx
import './globals.css'
import { Sidebar } from '@/components/Sidebar'
import { ClientShell } from '@/components/ClientShell'

export const metadata = {
  title: 'Recall — Meeting Memory',
  description: "Your team's institutional memory",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body className='flex h-screen' style={{ background: '#FAFAF9' }}>
        <Sidebar />
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  )
}
```

- [ ] **Step 6: Manually verify**

```bash
npm run dev
```

- Navigate to `http://localhost:3001`
- Press `Cmd+K` (Mac) or `Ctrl+K` (Windows)
- Expected: dark overlay appears, modal centered, input auto-focused
- Type a question, press `Enter`
- Expected: typing dots appear, then answer streams in
- Press `Escape`
- Expected: modal closes, state resets
- Click outside the modal
- Expected: modal closes
- Navigate to `/chat`, press `Cmd+K` again — modal opens from any page

- [ ] **Step 7: Commit**

```bash
git add src/lib/chat-stream.ts src/components/CmdKModal.tsx src/components/ClientShell.tsx src/app/layout.tsx src/app/chat/page.tsx
git commit -m "feat: add cmd+k global search modal and extract shared streaming helper"
```

---

## Self-Review Checklist

- [x] **vercel.json** → Task 1 ✓
- [x] **Upload stepper (6 steps, vertical, timed)** → Task 2 ✓
- [x] **Chat API `excerpt` field** → Task 3 ✓
- [x] **Citation cards with `/meetings/[id]` links** → Task 4 ✓
- [x] **Share button + "Copied!" toast** → Task 5 ✓
- [x] **⌘K modal** → Task 6 ✓
- [x] **`streamChat` shared helper** → Task 6, Step 1 ✓
- [x] **`Source` type consistent** across Tasks 3, 4, 6 ✓ (always `{ title, date, id, excerpt }`)
- [x] **`ClientShell` solves Server Component constraint** in layout ✓
- [x] **No new dependencies** ✓
- [x] **No placeholders or TBDs** ✓
- [x] **Weekly digest deferred** — not in any task ✓

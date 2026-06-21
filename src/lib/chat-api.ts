import type { ChatFilters } from '@/lib/chat-filters'
import type { Source } from '@/lib/chat-stream'

export interface FilterOptions {
  meetings: { id: string; title: string; date: string }[]
  people: string[]
  sources: string[]
}

export interface SessionSummary {
  id: string
  title: string
  filters: ChatFilters
  updated_label: string
  message_count: string
  last_message: string | null
}

export interface StoredMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
  filters?: ChatFilters
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error((await res.text()) || `Request failed (${res.status})`)
  return res.json()
}

export function getFilterOptions(): Promise<FilterOptions> {
  return fetch('/api/chat/filter-options').then(json<FilterOptions>)
}

export function listSessions(): Promise<{ sessions: SessionSummary[] }> {
  return fetch('/api/chat/sessions').then(json<{ sessions: SessionSummary[] }>)
}

interface SessionDetail {
  session: { id: string; title: string; filters: ChatFilters }
  messages: StoredMessage[]
}
export function getSession(id: string): Promise<SessionDetail> {
  return fetch(`/api/chat/sessions/${id}`).then(json<SessionDetail>)
}

export function createSession(title: string, filters: ChatFilters): Promise<{ sessionId: string }> {
  return fetch('/api/chat/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, filters }),
  }).then(json<{ sessionId: string }>)
}

export function deleteSession(id: string): Promise<{ ok: boolean }> {
  return fetch(`/api/chat/sessions/${id}`, { method: 'DELETE' }).then(json<{ ok: boolean }>)
}

export function saveMessage(msg: {
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
  filters: ChatFilters
}): Promise<{ id: string }> {
  return fetch('/api/chat/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(msg),
  }).then(json<{ id: string }>)
}

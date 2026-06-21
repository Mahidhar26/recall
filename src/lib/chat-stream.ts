export interface Source {
  title: string
  date: string
  id: string
  excerpt: string
}

import type { ChatFilters } from '@/lib/chat-filters'

export async function streamChat(
  query: string,
  filters: ChatFilters,
  onChunk: (chunk: string) => void
): Promise<Source[]> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, filters }),
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

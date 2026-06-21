import React from 'react'

// Minimal, dependency-free markdown renderer for chat answers.
// Supports **bold**, *italic*/_italic_, `code`, bullet and numbered lists,
// and paragraphs. Intentionally small — chat answers are short prose.

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|_[^_]+_)/g)
  return tokens.filter(Boolean).map((tok, i) => {
    const key = `${keyPrefix}-${i}`
    if (tok.startsWith('**') && tok.endsWith('**')) {
      return <strong key={key} className='font-semibold text-zinc-900'>{tok.slice(2, -2)}</strong>
    }
    if (tok.startsWith('`') && tok.endsWith('`')) {
      return <code key={key} className='px-1 py-0.5 rounded bg-zinc-100 text-[0.85em] font-mono text-zinc-700'>{tok.slice(1, -1)}</code>
    }
    if ((tok.startsWith('*') && tok.endsWith('*')) || (tok.startsWith('_') && tok.endsWith('_'))) {
      return <em key={key} className='italic'>{tok.slice(1, -1)}</em>
    }
    return <React.Fragment key={key}>{tok}</React.Fragment>
  })
}

export function Markdown({ content }: { content: string }) {
  const lines = content.split('\n')
  const blocks: React.ReactNode[] = []
  let list: { ordered: boolean; items: string[] } | null = null
  let key = 0

  const flushList = () => {
    if (!list) return
    const items = list.items.map((it, i) => (
      <li key={i} className='leading-relaxed'>{renderInline(it, `li-${key}-${i}`)}</li>
    ))
    blocks.push(
      list.ordered
        ? <ol key={key++} className='list-decimal pl-5 space-y-1 my-1.5'>{items}</ol>
        : <ul key={key++} className='list-disc pl-5 space-y-1 my-1.5'>{items}</ul>
    )
    list = null
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    const bullet = line.match(/^\s*[-*•]\s+(.*)/)
    const numbered = line.match(/^\s*\d+\.\s+(.*)/)

    if (bullet) {
      if (!list || list.ordered) { flushList(); list = { ordered: false, items: [] } }
      list.items.push(bullet[1])
    } else if (numbered) {
      if (!list || !list.ordered) { flushList(); list = { ordered: true, items: [] } }
      list.items.push(numbered[1])
    } else if (line.trim() === '') {
      flushList()
    } else {
      flushList()
      blocks.push(
        <p key={key++} className='leading-relaxed'>{renderInline(line, `p-${key}`)}</p>
      )
    }
  }
  flushList()

  return <div className='space-y-2'>{blocks}</div>
}

export interface Chunk {
  content: string
  speaker?: string
  position: number
  tokenCount: number
}

// Split text into ~400-token chunks at paragraph boundaries
export function chunkText(text: string): Chunk[] {
  const MAX_CHARS = 1600  // ~400 tokens at 4 chars/token
  const paragraphs = text.split(/\n{2,}/).filter(p => p.trim().length > 20)
    const chunks: Chunk[] = []
  let current = ''
  let position = 0

  for (const para of paragraphs) {
    if (current && (current + '\n\n' + para).length > MAX_CHARS) {
      chunks.push({
        content: current.trim(),
        position: position++,
        tokenCount: Math.ceil(current.length / 4),
      })
      current = para
    } else {
      current = current ? current + '\n\n' + para : para
    }
  }
  if (current.trim()) {
    chunks.push({ content: current.trim(), position: position, tokenCount: Math.ceil(current.length / 4) })
  }
  return chunks
}

// Parse VTT transcripts (Zoom/Meet) grouping by speaker
export function parseVtt(raw: string): Chunk[] {
  const lines = raw.split('\n')
  const turns: { speaker: string; text: string }[] = []
  let currentSpeaker = '', currentText = ''

  for (const line of lines) {
    if (line.includes('-->') || line.match(/^\d+$/) || line.trim() === 'WEBVTT') continue
    const match = line.match(/^<v ([^>]+)>(.*)/)
    if (match) {
      if (currentText) turns.push({ speaker: currentSpeaker, text: currentText.trim() })
      currentSpeaker = match[1]
      currentText = match[2].replace(/<[^>]+>/g, '')
    } else if (line.trim()) {
      currentText += ' ' + line.trim()
    }
  }
  if (currentText) turns.push({ speaker: currentSpeaker, text: currentText.trim() })

  // Merge turns into ~400-token chunks, respecting speaker boundaries
  const chunks: Chunk[] = []
  let buffer = '', speaker = '', pos = 0
  for (const turn of turns) {
    const line = turn.speaker + ': ' + turn.text
    if (buffer && (buffer + '\n' + line).length > 1600) {
      chunks.push({ content: buffer.trim(), speaker, position: pos++, tokenCount: Math.ceil(buffer.length / 4) })
      buffer = line; speaker = turn.speaker
    } else {
      buffer = buffer ? buffer + '\n' + line : line
      if (!speaker) speaker = turn.speaker
    }
  }
  if (buffer.trim()) chunks.push({ content: buffer.trim(), speaker, position: pos, tokenCount: Math.ceil(buffer.length / 4) })
  return chunks
}


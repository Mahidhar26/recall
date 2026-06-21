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
    // Skip cue numbers, timestamps, the WEBVTT header, and NOTE metadata lines
    // (meeting title / attendees) — they carry no speaker and shouldn't pollute
    // chunk content or embeddings.
    if (line.includes('-->') || line.match(/^\d+$/) || line.trim() === 'WEBVTT' || line.startsWith('NOTE')) continue
    const match = line.match(/^<v ([^>]+)>(.*)/)
    if (match) {
      if (currentText && currentSpeaker) turns.push({ speaker: currentSpeaker, text: currentText.trim() })
      currentSpeaker = match[1]
      currentText = match[2].replace(/<[^>]+>/g, '')
    } else if (line.trim() && currentSpeaker) {
      // Continuation of the current speaker's turn (multi-line cue text).
      currentText += ' ' + line.trim()
    }
  }
  if (currentText && currentSpeaker) turns.push({ speaker: currentSpeaker, text: currentText.trim() })

  // Merge consecutive same-speaker turns into ~400-token chunks. A chunk is
  // flushed when the speaker changes or the size cap is hit, so every chunk has
  // exactly one speaker — accurate `speaker` column for the People filter and
  // precise per-speaker search. Content stays clean (callers prepend the name).
  const chunks: Chunk[] = []
  let buffer = '', speaker = '', pos = 0
  const flush = () => {
    if (buffer.trim()) {
      chunks.push({ content: buffer.trim(), speaker, position: pos++, tokenCount: Math.ceil(buffer.length / 4) })
    }
    buffer = ''
  }
  for (const turn of turns) {
    if (buffer && (turn.speaker !== speaker || (buffer + '\n' + turn.text).length > 1600)) {
      flush()
    }
    if (!buffer) { speaker = turn.speaker; buffer = turn.text }
    else { buffer += '\n' + turn.text }
  }
  flush()
  return chunks
}


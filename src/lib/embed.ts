import OpenAI from 'openai'

const openai = new OpenAI()

export async function embed(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return response.data[0].embedding  // 1536-dimensional float array
}

// Batch embed with rate-limit delay
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const results: number[][] = []
  const BATCH = 20
  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH)
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch,
    })
    results.push(...response.data.map(d => d.embedding))
    if (i + BATCH < texts.length) await new Promise(r => setTimeout(r, 200))
  }
  return results
}

import { NextRequest, NextResponse } from 'next/server'
import { ingest } from '@/lib/ingest'
import * as pdfParseModule from 'pdf-parse'
const pdfParse = (pdfParseModule as any).default ?? pdfParseModule

export const maxDuration = 60  // allow up to 60s for large files

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['txt', 'vtt', 'pdf'].includes(ext ?? ''))
      return NextResponse.json({ error: 'Unsupported type. Use .txt, .vtt, or .pdf' }, { status: 415 })

    let text: string
    if (ext === 'pdf') {
      const buffer = Buffer.from(await file.arrayBuffer())
      text = (await pdfParse(buffer)).text
    } else {
      text = await file.text()
    }

    if (text.trim().length < 50)
      return NextResponse.json({ error: 'File is empty or unreadable' }, { status: 400 })

    const result = await ingest({
      title: file.name.replace(/\.[^.]+$/, ''),
      text,
      source: 'upload',
    })

    return NextResponse.json({ success: true, ...result })
  } catch (err: any) {
    console.error('[upload]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

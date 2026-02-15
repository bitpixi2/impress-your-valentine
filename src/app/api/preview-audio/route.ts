import { NextRequest, NextResponse } from 'next/server'
import { getCharacterById, type GrokVoiceId } from '@/lib/types'

const BRIDGE_URL = process.env.BRIDGE_URL || 'http://localhost:8081'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { script, characterId, voiceId } = await req.json()
    const text = typeof script === 'string' ? script.trim() : ''
    if (!text) {
      return NextResponse.json({ error: 'Script is required' }, { status: 400 })
    }
    if (text.length > 3000) {
      return NextResponse.json({ error: 'Script is too long for preview audio' }, { status: 400 })
    }

    const selectedVoice =
      getCharacterById(characterId)?.voiceId ||
      (voiceId as GrokVoiceId | undefined) ||
      'Ara'

    const bridgeRes = await fetch(`${BRIDGE_URL}/preview-audio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        script: text,
        voiceId: selectedVoice,
      }),
    })

    const payload = await bridgeRes.json().catch(() => ({}))
    if (!bridgeRes.ok) {
      throw new Error(payload.error || `Bridge preview error: ${bridgeRes.status}`)
    }

    return NextResponse.json({
      audioBase64: payload.audioBase64,
      mimeType: payload.mimeType || 'audio/wav',
      voiceId: selectedVoice,
    })
  } catch (error: any) {
    console.error('Audio preview error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate preview audio' }, { status: 500 })
  }
}

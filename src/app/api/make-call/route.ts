import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { useCredit, getOrCreateUser } from '@/lib/credits'
import {
  getCharacterById,
  isCharacterAvailableForAge,
  type AgeBand,
} from '@/lib/types'

const BRIDGE_URL = process.env.BRIDGE_URL || 'http://localhost:8081'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authSession = await getServerSession(authOptions)
    if (!authSession?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const userId = (authSession.user as any).userId || authSession.user.email
    getOrCreateUser(userId, authSession.user.email)

    // Credit check
    const creditResult = useCredit(userId)
    if (!creditResult.success) {
      return NextResponse.json(
        { error: creditResult.message, needsCredits: true },
        { status: 402 }
      )
    }

    const { phone, senderName, valentineName, script, characterId, senderAgeBand } = await req.json()

    if (!phone || !senderName || !script || !characterId || !senderAgeBand) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validAgeBands: AgeBand[] = ['under_16', '16_plus', '18_plus']
    if (!validAgeBands.includes(senderAgeBand)) {
      return NextResponse.json({ error: 'Invalid age band selected' }, { status: 400 })
    }

    const character = getCharacterById(characterId)
    if (!character) {
      return NextResponse.json({ error: 'Invalid character selected' }, { status: 400 })
    }

    if (!isCharacterAvailableForAge(character.id, senderAgeBand as AgeBand)) {
      return NextResponse.json({ error: 'Character not available for selected age band' }, { status: 400 })
    }

    // Call the bridge server which handles Twilio ↔ Grok Voice Agent
    const bridgeRes = await fetch(`${BRIDGE_URL}/outbound-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        senderName,
        valentineName,
        script,
        characterId: character.id,
        senderAgeBand,
        voiceId: character.voiceId,
        callId: `cupid-${userId}-${Date.now()}`,
      }),
    })

    if (!bridgeRes.ok) {
      const errBody = await bridgeRes.json().catch(() => ({}))
      throw new Error(errBody.error || `Bridge server error: ${bridgeRes.status}`)
    }

    const result = await bridgeRes.json()

    return NextResponse.json({
      success: true,
      callSid: result.callSid,
      callId: result.callId,
      remainingCredits: creditResult.remaining,
    })
  } catch (error: any) {
    console.error('Make call error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to make call' },
      { status: 500 }
    )
  }
}

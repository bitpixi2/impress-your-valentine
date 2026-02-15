import { NextRequest, NextResponse } from 'next/server'
import { useCredit, getOrCreateUser } from '@/lib/credits'
import { attachGuestCookie, getGuestUserId } from '@/lib/guest'
import { getCharacterById } from '@/lib/types'

const BRIDGE_URL = process.env.BRIDGE_URL || 'http://localhost:8081'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { userId, needsCookie } = getGuestUserId(req)

    const { phone, senderName, senderEmail, valentineName, script, characterId } = await req.json()
    const senderNameSafe =
      typeof senderName === 'string' && senderName.trim() ? senderName.trim() : 'Someone special'

    if (!phone || !script || !characterId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await getOrCreateUser(
      userId,
      typeof senderEmail === 'string' && senderEmail.trim()
        ? senderEmail.trim().toLowerCase()
        : `${userId}@guest.local`
    )

    const senderEmailSafe = typeof senderEmail === 'string' ? senderEmail.trim().toLowerCase() : ''
    if (!senderEmailSafe || !senderEmailSafe.includes('@')) {
      return NextResponse.json({ error: 'A valid sender email is required' }, { status: 400 })
    }

    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim() || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'
    const maskedPhone = `${phone}`.replace(/\d(?=\d{2})/g, '*')
    console.info('[CupidCall] outbound call request', {
      userId,
      senderEmail: senderEmailSafe,
      senderName: senderNameSafe,
      valentineName,
      phone: maskedPhone,
      ip,
      userAgent,
    })

    // Credit check
    const creditResult = await useCredit(userId)
    if (!creditResult.success) {
      const denied = NextResponse.json(
        { error: creditResult.message, needsCredits: true },
        { status: 402 }
      )
      if (needsCookie) attachGuestCookie(denied, userId)
      return denied
    }

    const character = getCharacterById(characterId)
    if (!character) {
      return NextResponse.json({ error: 'Invalid character selected' }, { status: 400 })
    }

    // Call the bridge server which handles Twilio ↔ Grok Voice Agent
    const bridgeRes = await fetch(`${BRIDGE_URL}/outbound-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        senderName: senderNameSafe,
        senderEmail: senderEmailSafe,
        valentineName,
        script,
        characterId: character.id,
        voiceId: character.voiceId,
        callId: `cupid-${userId}-${Date.now()}`,
      }),
    })

    if (!bridgeRes.ok) {
      const errBody = await bridgeRes.json().catch(() => ({}))
      throw new Error(errBody.error || `Bridge server error: ${bridgeRes.status}`)
    }

    const result = await bridgeRes.json()

    const response = NextResponse.json({
      success: true,
      callSid: result.callSid || null,
      callId: result.callId,
      scheduled: Boolean(result.scheduled),
      callStartsInMinutes: typeof result.callStartsInMinutes === 'number' ? result.callStartsInMinutes : 0,
      preCallTextSent: result.preCallTextSent !== false,
      remainingCredits: creditResult.remaining,
    })
    if (needsCookie) attachGuestCookie(response, userId)
    return response
  } catch (error: any) {
    console.error('Make call error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to make call' },
      { status: 500 }
    )
  }
}

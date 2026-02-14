import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { useCredit, getOrCreateUser } from '@/lib/credits'

const BRIDGE_URL = process.env.BRIDGE_URL || 'http://localhost:8081'

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

    const { phone, senderName, valentineName, script, style, voiceId, isExplicit } = await req.json()

    if (!phone || !senderName || !script) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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
        style: style || '1800s-literature',
        voiceId: voiceId || 'Ara',
        isExplicit: isExplicit || false,
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

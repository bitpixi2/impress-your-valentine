import { NextRequest, NextResponse } from 'next/server'
import { applyPromoCode, getOrCreateUser } from '@/lib/credits'
import { attachGuestCookie, getGuestUserId } from '@/lib/guest'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { userId, needsCookie } = getGuestUserId(req)
    const { code } = await req.json()

    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json(
        { success: false, message: 'Please enter a promo code.' },
        { status: 400 }
      )
    }

    // Ensure user exists
    await getOrCreateUser(userId, `${userId}@guest.local`)

    const result = await applyPromoCode(userId, code)

    const response = NextResponse.json(result, { status: result.success ? 200 : 400 })
    if (needsCookie) attachGuestCookie(response, userId)
    return response
  } catch (error: any) {
    console.error('Promo code error:', error)
    return NextResponse.json(
      { error: 'Failed to apply promo code' },
      { status: 500 }
    )
  }
}

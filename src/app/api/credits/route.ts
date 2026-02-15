import { NextRequest, NextResponse } from 'next/server'
import { getUserCredits, getOrCreateUser } from '@/lib/credits'
import { attachGuestCookie, getGuestUserId } from '@/lib/guest'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { userId, needsCookie } = getGuestUserId(req)
    const placeholderEmail = `${userId}@guest.local`

    // Ensure user exists
    await getOrCreateUser(userId, placeholderEmail)
    const credits = await getUserCredits(userId)

    const response = NextResponse.json({
      remainingCredits: credits?.remainingCredits || 0,
      totalCredits: credits?.totalCredits || 0,
      usedCredits: credits?.usedCredits || 0,
      hasUsedLoveCode: credits?.promoCodesUsed.includes('LOVE') || false,
    })

    if (needsCookie) attachGuestCookie(response, userId)
    return response
  } catch (error: any) {
    console.error('Credits check error:', error)
    return NextResponse.json(
      { error: 'Failed to check credits' },
      { status: 500 }
    )
  }
}

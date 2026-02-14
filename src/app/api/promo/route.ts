import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { applyPromoCode, getOrCreateUser } from '@/lib/credits'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userId = (session.user as any).userId || session.user.email
    const { code } = await req.json()

    if (!code) {
      return NextResponse.json({ error: 'No promo code provided' }, { status: 400 })
    }

    // Ensure user exists
    getOrCreateUser(userId, session.user.email)

    const result = applyPromoCode(userId, code)

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error: any) {
    console.error('Promo code error:', error)
    return NextResponse.json(
      { error: 'Failed to apply promo code' },
      { status: 500 }
    )
  }
}

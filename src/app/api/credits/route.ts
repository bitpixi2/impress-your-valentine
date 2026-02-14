import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getUserCredits, getOrCreateUser } from '@/lib/credits'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userId = (session.user as any).userId || session.user.email

    // Ensure user exists
    getOrCreateUser(userId, session.user.email)
    const credits = getUserCredits(userId)

    return NextResponse.json({
      remainingCredits: credits?.remainingCredits || 0,
      totalCredits: credits?.totalCredits || 0,
      usedCredits: credits?.usedCredits || 0,
      hasUsedLoveCode: credits?.promoCodesUsed.includes('LOVE') || false,
    })
  } catch (error: any) {
    console.error('Credits check error:', error)
    return NextResponse.json(
      { error: 'Failed to check credits' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'

const GUEST_COOKIE_NAME = 'cupid_guest_id'
const GUEST_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180 // 180 days

export function getGuestUserId(req: NextRequest): { userId: string; needsCookie: boolean } {
  const existing = req.cookies.get(GUEST_COOKIE_NAME)?.value
  if (existing) {
    return { userId: existing, needsCookie: false }
  }

  return {
    userId: `guest_${crypto.randomUUID()}`,
    needsCookie: true,
  }
}

export function attachGuestCookie(res: NextResponse, userId: string) {
  res.cookies.set({
    name: GUEST_COOKIE_NAME,
    value: userId,
    maxAge: GUEST_COOKIE_MAX_AGE_SECONDS,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
}


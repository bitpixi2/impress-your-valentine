import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getOrCreateUser } from '@/lib/credits'
import { attachGuestCookie, getGuestUserId } from '@/lib/guest'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { userId, needsCookie } = getGuestUserId(req)
    let email = ''
    try {
      const body = await req.json()
      email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    } catch {
      // Allow empty body for checkout.
    }
    const user = await getOrCreateUser(userId, email || `${userId}@guest.local`)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const stripeSecret = process.env.STRIPE_SECRET_KEY

    if (!stripeSecret) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: '2025-02-24.acacia',
    })

    // Create Stripe Checkout Session for 3-pack ($10 AUD)
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: 'Cupid Call 3-Pack 💘',
              description: '3 personalised AI love telegram phone calls',
              images: [], // Add an image URL if you have one
            },
            unit_amount: 1000, // $10.00 AUD in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/create?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/create?purchase=cancelled`,
      customer_email: user.email.includes('@guest.local') ? undefined : user.email,
      metadata: {
        userId,
        credits: '3',
        product: 'cupid_call_3pack',
      },
    })

    const response = NextResponse.json({ url: checkoutSession.url })
    if (needsCookie) attachGuestCookie(response, userId)
    return response
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

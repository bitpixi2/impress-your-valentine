import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { addPurchasedCredits, getOrCreateUser } from '@/lib/credits'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  const stripeSecret = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripeSecret || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe webhook is not configured' }, { status: 500 })
  }

  const stripe = new Stripe(stripeSecret, {
    apiVersion: '2025-02-24.acacia',
  })

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      webhookSecret
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const userId = session.metadata?.userId
    const credits = parseInt(session.metadata?.credits || '0')
    const email = session.customer_email || ''

    if (userId && credits > 0) {
      // Ensure user exists
      getOrCreateUser(userId, email)

      // Add credits
      const result = addPurchasedCredits(
        userId,
        credits,
        session.amount_total || 0,
        session.id
      )
      console.log(`[Cupid Call] Payment processed for ${userId}: ${result.message}`)
    }
  }

  return NextResponse.json({ received: true })
}

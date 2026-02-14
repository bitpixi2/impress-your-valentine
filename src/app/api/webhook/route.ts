import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { addPurchasedCredits, getOrCreateUser } from '@/lib/credits'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
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

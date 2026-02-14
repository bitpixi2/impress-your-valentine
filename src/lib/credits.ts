import { UserCredits, CreditPurchase } from './types'

// In-memory store for hackathon — production would use a database
const creditsStore = new Map<string, UserCredits>()

const PROMO_CODES: Record<string, { credits: number; maxUses: number }> = {
  LOVE: { credits: 1, maxUses: 1 }, // 1 free call per user
}

export function getOrCreateUser(userId: string, email: string): UserCredits {
  if (!creditsStore.has(userId)) {
    creditsStore.set(userId, {
      userId,
      email,
      totalCredits: 0,
      usedCredits: 0,
      remainingCredits: 0,
      purchases: [],
      promoCodesUsed: [],
    })
  }
  return creditsStore.get(userId)!
}

export function getUserCredits(userId: string): UserCredits | null {
  return creditsStore.get(userId) || null
}

export function applyPromoCode(userId: string, code: string): { success: boolean; message: string; credits?: number } {
  const user = creditsStore.get(userId)
  if (!user) return { success: false, message: 'User not found' }

  const upperCode = code.toUpperCase()
  const promo = PROMO_CODES[upperCode]

  if (!promo) {
    return { success: false, message: 'Invalid promo code' }
  }

  if (user.promoCodesUsed.includes(upperCode)) {
    return { success: false, message: "You've already used this promo code" }
  }

  // Apply credits
  const purchase: CreditPurchase = {
    id: `promo-${Date.now()}`,
    type: 'promo',
    credits: promo.credits,
    amount: 0,
    createdAt: new Date().toISOString(),
  }

  user.promoCodesUsed.push(upperCode)
  user.purchases.push(purchase)
  user.totalCredits += promo.credits
  user.remainingCredits += promo.credits

  creditsStore.set(userId, user)

  return {
    success: true,
    message: `Code ${upperCode} applied! You got ${promo.credits} free Cupid Call${promo.credits > 1 ? 's' : ''}.`,
    credits: promo.credits,
  }
}

export function addPurchasedCredits(
  userId: string,
  credits: number,
  amount: number,
  stripeSessionId: string
): { success: boolean; message: string } {
  const user = creditsStore.get(userId)
  if (!user) return { success: false, message: 'User not found' }

  // Prevent duplicate processing
  const alreadyProcessed = user.purchases.some(
    (p) => p.stripeSessionId === stripeSessionId
  )
  if (alreadyProcessed) {
    return { success: false, message: 'Payment already processed' }
  }

  const purchase: CreditPurchase = {
    id: `pack-${Date.now()}`,
    type: 'pack_3',
    credits,
    amount,
    stripeSessionId,
    createdAt: new Date().toISOString(),
  }

  user.purchases.push(purchase)
  user.totalCredits += credits
  user.remainingCredits += credits
  creditsStore.set(userId, user)

  return { success: true, message: `${credits} credits added to your account!` }
}

export function useCredit(userId: string): { success: boolean; message: string; remaining?: number } {
  const user = creditsStore.get(userId)
  if (!user) return { success: false, message: 'User not found' }

  if (user.remainingCredits <= 0) {
    return { success: false, message: 'No credits remaining. Buy a 3-pack to send more Cupid Calls!' }
  }

  user.remainingCredits -= 1
  user.usedCredits += 1
  creditsStore.set(userId, user)

  return {
    success: true,
    message: 'Credit used!',
    remaining: user.remainingCredits,
  }
}

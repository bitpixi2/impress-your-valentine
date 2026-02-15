import { CreditPurchase, UserCredits } from './types'

type PromoResult = { success: boolean; message: string; credits?: number }
type UseCreditResult = { success: boolean; message: string; remaining?: number }
type PurchaseResult = { success: boolean; message: string }

interface CreditUserRow {
  user_id: string
  email: string
  total_credits: number
  used_credits: number
  remaining_credits: number
  promo_codes_used: string[] | null
}

interface CreditPurchaseRow {
  id: string
  type: 'promo' | 'pack_3'
  credits: number
  amount: number
  stripe_session_id: string | null
  created_at: string
}

const PROMO_CODES: Record<string, { credits: number; maxUses: number }> = {
  LOVE: { credits: 1, maxUses: 1 },
}

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const memoryStore = new Map<string, UserCredits>()

function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
}

function baseHeaders() {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  }
}

async function supabaseRequest(path: string, init: RequestInit = {}) {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      ...baseHeaders(),
      ...(init.headers || {}),
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase request failed ${res.status}: ${text}`)
  }

  if (res.status === 204) return null
  return res.json()
}

function mapPurchases(rows: CreditPurchaseRow[]): CreditPurchase[] {
  return rows.map((p) => ({
    id: p.id,
    type: p.type,
    credits: p.credits,
    amount: p.amount,
    stripeSessionId: p.stripe_session_id || undefined,
    createdAt: p.created_at,
  }))
}

function mapUser(row: CreditUserRow, purchases: CreditPurchase[] = []): UserCredits {
  return {
    userId: row.user_id,
    email: row.email,
    totalCredits: row.total_credits,
    usedCredits: row.used_credits,
    remainingCredits: row.remaining_credits,
    purchases,
    promoCodesUsed: row.promo_codes_used || [],
  }
}

async function fetchUserRow(userId: string): Promise<CreditUserRow | null> {
  const encoded = encodeURIComponent(userId)
  const rows = await supabaseRequest(`/rest/v1/cupid_users?user_id=eq.${encoded}&select=*`) as CreditUserRow[]
  return rows[0] || null
}

async function fetchPurchases(userId: string): Promise<CreditPurchase[]> {
  const encoded = encodeURIComponent(userId)
  const rows = await supabaseRequest(
    `/rest/v1/cupid_purchases?user_id=eq.${encoded}&select=id,type,credits,amount,stripe_session_id,created_at&order=created_at.desc`
  ) as CreditPurchaseRow[]
  return mapPurchases(rows || [])
}

async function upsertUserRow(row: Partial<CreditUserRow> & { user_id: string }) {
  const rows = await supabaseRequest('/rest/v1/cupid_users', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(row),
  }) as CreditUserRow[]
  return rows[0]
}

async function updateUserRow(userId: string, patch: Partial<CreditUserRow>) {
  const encoded = encodeURIComponent(userId)
  const rows = await supabaseRequest(`/rest/v1/cupid_users?user_id=eq.${encoded}`, {
    method: 'PATCH',
    headers: {
      Prefer: 'return=representation',
    },
    body: JSON.stringify(patch),
  }) as CreditUserRow[]
  return rows[0]
}

async function createPurchaseRow(data: {
  userId: string
  type: 'promo' | 'pack_3'
  credits: number
  amount: number
  stripeSessionId?: string
}) {
  const rows = await supabaseRequest('/rest/v1/cupid_purchases', {
    method: 'POST',
    headers: {
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      user_id: data.userId,
      type: data.type,
      credits: data.credits,
      amount: data.amount,
      stripe_session_id: data.stripeSessionId || null,
    }),
  }) as CreditPurchaseRow[]
  return rows[0]
}

async function findPurchaseByStripeSession(stripeSessionId: string): Promise<CreditPurchaseRow | null> {
  const encoded = encodeURIComponent(stripeSessionId)
  const rows = await supabaseRequest(
    `/rest/v1/cupid_purchases?stripe_session_id=eq.${encoded}&select=id,type,credits,amount,stripe_session_id,created_at&limit=1`
  ) as CreditPurchaseRow[]
  return rows[0] || null
}

function getOrCreateMemoryUser(userId: string, email: string): UserCredits {
  const existing = memoryStore.get(userId)
  if (!existing) {
    const created: UserCredits = {
      userId,
      email,
      totalCredits: 0,
      usedCredits: 0,
      remainingCredits: 0,
      purchases: [],
      promoCodesUsed: [],
    }
    memoryStore.set(userId, created)
    return created
  }
  if (email && existing.email !== email) {
    existing.email = email
    memoryStore.set(userId, existing)
  }
  return existing
}

export async function getOrCreateUser(userId: string, email: string): Promise<UserCredits> {
  if (!hasSupabaseConfig()) {
    return getOrCreateMemoryUser(userId, email)
  }

  const existing = await fetchUserRow(userId)
  if (!existing) {
    const created = await upsertUserRow({
      user_id: userId,
      email: email || `${userId}@guest.local`,
      total_credits: 0,
      used_credits: 0,
      remaining_credits: 0,
      promo_codes_used: [],
    })
    return mapUser(created, [])
  }

  if (email && existing.email !== email) {
    const updated = await updateUserRow(userId, { email })
    return mapUser(updated, await fetchPurchases(userId))
  }

  return mapUser(existing, await fetchPurchases(userId))
}

export async function getUserCredits(userId: string): Promise<UserCredits | null> {
  if (!hasSupabaseConfig()) {
    return memoryStore.get(userId) || null
  }

  const row = await fetchUserRow(userId)
  if (!row) return null
  return mapUser(row, await fetchPurchases(userId))
}

export async function applyPromoCode(userId: string, code: string): Promise<PromoResult> {
  const upperCode = code.trim().toUpperCase()
  if (!upperCode) {
    return { success: false, message: 'Please enter a promo code.' }
  }
  const promo = PROMO_CODES[upperCode]

  if (!promo) {
    return { success: false, message: 'That promo code is not valid. Please check it and try again.' }
  }

  if (!hasSupabaseConfig()) {
    const user = memoryStore.get(userId)
    if (!user) return { success: false, message: 'User not found' }
    if (user.promoCodesUsed.includes(upperCode)) {
      return { success: false, message: 'LOVE was already used on this account. You can still buy a 3-call pack.' }
    }

    user.promoCodesUsed.push(upperCode)
    user.purchases.push({
      id: `promo-${Date.now()}`,
      type: 'promo',
      credits: promo.credits,
      amount: 0,
      createdAt: new Date().toISOString(),
    })
    user.totalCredits += promo.credits
    user.remainingCredits += promo.credits
    memoryStore.set(userId, user)

    return {
      success: true,
      message: `Code ${upperCode} applied! You got ${promo.credits} free Cupid Call${promo.credits > 1 ? 's' : ''}.`,
      credits: promo.credits,
    }
  }

  const user = await fetchUserRow(userId)
  if (!user) return { success: false, message: 'User not found' }

  const promoCodesUsed = user.promo_codes_used || []
  if (promoCodesUsed.includes(upperCode)) {
    return { success: false, message: 'LOVE was already used on this account. You can still buy a 3-call pack.' }
  }

  await updateUserRow(userId, {
    promo_codes_used: [...promoCodesUsed, upperCode],
    total_credits: user.total_credits + promo.credits,
    remaining_credits: user.remaining_credits + promo.credits,
  })

  await createPurchaseRow({
    userId,
    type: 'promo',
    credits: promo.credits,
    amount: 0,
  })

  return {
    success: true,
    message: `Code ${upperCode} applied! You got ${promo.credits} free Cupid Call${promo.credits > 1 ? 's' : ''}.`,
    credits: promo.credits,
  }
}

export async function addPurchasedCredits(
  userId: string,
  credits: number,
  amount: number,
  stripeSessionId: string
): Promise<PurchaseResult> {
  if (!hasSupabaseConfig()) {
    const user = memoryStore.get(userId)
    if (!user) return { success: false, message: 'User not found' }
    const alreadyProcessed = user.purchases.some((p) => p.stripeSessionId === stripeSessionId)
    if (alreadyProcessed) return { success: false, message: 'Payment already processed' }

    user.purchases.push({
      id: `pack-${Date.now()}`,
      type: 'pack_3',
      credits,
      amount,
      stripeSessionId,
      createdAt: new Date().toISOString(),
    })
    user.totalCredits += credits
    user.remainingCredits += credits
    memoryStore.set(userId, user)
    return { success: true, message: `${credits} credits added to your account!` }
  }

  const user = await fetchUserRow(userId)
  if (!user) return { success: false, message: 'User not found' }

  const existingPurchase = await findPurchaseByStripeSession(stripeSessionId)
  if (existingPurchase) {
    return { success: false, message: 'Payment already processed' }
  }

  await createPurchaseRow({
    userId,
    type: 'pack_3',
    credits,
    amount,
    stripeSessionId,
  })

  await updateUserRow(userId, {
    total_credits: user.total_credits + credits,
    remaining_credits: user.remaining_credits + credits,
  })

  return { success: true, message: `${credits} credits added to your account!` }
}

export async function useCredit(userId: string): Promise<UseCreditResult> {
  if (!hasSupabaseConfig()) {
    const user = memoryStore.get(userId)
    if (!user) return { success: false, message: 'User not found' }

    if (user.remainingCredits <= 0) {
      return { success: false, message: 'No credits remaining. Buy a 3-pack to send more Cupid Calls!' }
    }

    user.remainingCredits -= 1
    user.usedCredits += 1
    memoryStore.set(userId, user)

    return {
      success: true,
      message: 'Credit used!',
      remaining: user.remainingCredits,
    }
  }

  const user = await fetchUserRow(userId)
  if (!user) return { success: false, message: 'User not found' }

  if (user.remaining_credits <= 0) {
    return { success: false, message: 'No credits remaining. Buy a 3-pack to send more Cupid Calls!' }
  }

  const updated = await updateUserRow(userId, {
    remaining_credits: user.remaining_credits - 1,
    used_credits: user.used_credits + 1,
  })

  return {
    success: true,
    message: 'Credit used!',
    remaining: updated.remaining_credits,
  }
}

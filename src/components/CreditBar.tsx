'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CreditBarProps {
  credits: number
  hasUsedLoveCode: boolean
  onCreditsUpdated: () => void
}

export default function CreditBar({ credits, hasUsedLoveCode, onCreditsUpdated }: CreditBarProps) {
  const [showPromo, setShowPromo] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoMessage, setPromoMessage] = useState('')
  const [promoError, setPromoError] = useState(false)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [isBuying, setIsBuying] = useState(false)

  const redeemPromo = async () => {
    if (!promoCode) return
    setIsRedeeming(true)
    setPromoMessage('')
    try {
      const res = await fetch('/api/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode }),
      })
      const data = await res.json()
      setPromoMessage(data.message)
      setPromoError(!res.ok)
      if (res.ok) {
        setPromoCode('')
        onCreditsUpdated()
      }
    } catch {
      setPromoMessage('Could not redeem code.')
      setPromoError(true)
    } finally {
      setIsRedeeming(false)
    }
  }

  const buyPack = async () => {
    setIsBuying(true)
    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const data = await res.json()
      if (!data.url) {
        throw new Error('No checkout URL')
      }
      window.location.href = data.url
    } catch {
      setPromoMessage('Could not start checkout. Confirm Stripe config first.')
      setPromoError(true)
    } finally {
      setIsBuying(false)
    }
  }

  return (
    <div className="surface-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[12px] uppercase tracking-[0.12em] text-muted">Credits</p>
          <p className="mt-1 text-[15px] text-primary">
            <span className="font-medium">{credits}</span> call{credits !== 1 ? 's' : ''} available
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!hasUsedLoveCode && (
            <button onClick={() => setShowPromo(!showPromo)} className="btn-secondary">
              Enter code
            </button>
          )}
          <button onClick={buyPack} disabled={isBuying} className="btn-cupid">
            {isBuying ? 'Processing…' : 'Buy 3-call pack ($10 AUD)'}
          </button>
        </div>
      </div>
      <p className="mt-2 text-[12px] text-muted">3-pack checkout is currently available for ANZ or US only.</p>

      <AnimatePresence>
        {showPromo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                className="input-cupid flex-1 uppercase tracking-[0.1em]"
                placeholder="Promo code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && redeemPromo()}
              />
              <button onClick={redeemPromo} disabled={!promoCode || isRedeeming} className="btn-cupid sm:min-w-[120px]">
                {isRedeeming ? 'Applying…' : 'Apply code'}
              </button>
            </div>

            {promoMessage && (
              <p className={`mt-2 text-[13px] ${promoError ? 'text-[var(--age-red)]' : 'text-[var(--age-green)]'}`}>
                {promoMessage}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

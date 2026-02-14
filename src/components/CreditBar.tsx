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
      setPromoMessage('Failed to redeem code')
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
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL')
      }
    } catch {
      setPromoMessage('Failed to start checkout. Is Stripe configured?')
      setPromoError(true)
    } finally {
      setIsBuying(false)
    }
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💌</span>
            <div>
              <span className="font-fun text-white font-bold text-lg">{credits}</span>
              <span className="text-white/50 text-sm ml-1">
                call{credits !== 1 ? 's' : ''} remaining
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!hasUsedLoveCode && (
            <button
              onClick={() => setShowPromo(!showPromo)}
              className="px-4 py-2 rounded-full border border-cupid-gold/40 text-cupid-gold text-sm font-fun hover:bg-cupid-gold/10 transition-colors"
            >
              🎁 Have a code?
            </button>
          )}
          <button
            onClick={buyPack}
            disabled={isBuying}
            className="btn-cupid px-4 py-2 text-sm"
          >
            {isBuying ? '...' : '💰 Buy 3-Pack ($10)'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showPromo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 mt-4">
              <input
                type="text"
                className="input-cupid flex-1 text-sm uppercase tracking-widest"
                placeholder="Enter promo code..."
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && redeemPromo()}
              />
              <button
                onClick={redeemPromo}
                disabled={!promoCode || isRedeeming}
                className={`px-4 py-2 rounded-xl bg-cupid-gold text-cupid-dark font-bold text-sm transition-all ${
                  !promoCode || isRedeeming ? 'opacity-30' : 'hover:bg-cupid-gold/80'
                }`}
              >
                {isRedeeming ? '...' : 'Redeem'}
              </button>
            </div>
            {!hasUsedLoveCode && (
              <p className="text-white/30 text-xs mt-2">
                💡 Hint: Try the code LOVE for a free call
              </p>
            )}
            {promoMessage && (
              <p className={`text-sm mt-2 ${promoError ? 'text-red-400' : 'text-green-400'}`}>
                {promoMessage}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

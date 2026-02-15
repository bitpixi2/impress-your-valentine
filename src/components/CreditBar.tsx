'use client'

import { useState } from 'react'

interface CreditBarProps {
  credits: number
  onCreditsUpdated: () => void
}

export default function CreditBar({ credits, onCreditsUpdated }: CreditBarProps) {
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
      <div className="-mx-6 -mt-6 mb-5 overflow-hidden rounded-t-[14px] border-b border-[var(--surface-border)]">
        <img
          src="/add-credits.jpg"
          alt="Add credits artwork"
          className="h-[160px] w-full object-cover"
          loading="lazy"
        />
      </div>

      <p className="text-[12px] uppercase tracking-[0.12em] text-muted">Credits</p>
      <p className="mt-1 text-[15px] text-primary">
        Credits: <span className="font-medium">{credits}</span> call{credits !== 1 ? 's' : ''} available
      </p>

      <div className="mt-5">
        <label className="mb-2 block text-[12px] uppercase tracking-[0.12em] text-muted">Enter code</label>
        <div className="flex flex-col gap-2 sm:flex-row">
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
      </div>

      {promoMessage && (
        <p className={`mt-2 text-[13px] ${promoError ? 'text-[var(--age-red)]' : 'text-[var(--age-green)]'}`}>
          {promoMessage}
        </p>
      )}

      <div className="mt-9 border-t border-[var(--surface-border)] pt-7">
        <button onClick={buyPack} disabled={isBuying} className="btn-cupid w-full">
          {isBuying ? 'Processing…' : 'Buy 3-call pack ($10 AUD)'}
        </button>
        <p className="mt-2 text-[12px] leading-[1.7] text-muted">
          Currently available for Australia, New Zealand, United States, and Canada.
        </p>
        <p className="mt-3 text-[12px] leading-[1.7] text-muted">
          Request more countries.{' '}
          <a className="text-primary underline" href="mailto:kasey.bitpixi@gmail.com">
            Request
          </a>
        </p>
        <p className="mt-1 text-[12px] leading-[1.7] text-muted">
          Report an issue with credits.{' '}
          <a className="text-primary underline" href="mailto:kasey.bitpixi@gmail.com">
            Report
          </a>
        </p>
      </div>
    </div>
  )
}

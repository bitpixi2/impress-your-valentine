'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function SentPage() {
  const [valentineName, setValentineName] = useState('Your valentine')

  useEffect(() => {
    const stored = sessionStorage.getItem('cupidCallSent')
    if (!stored) return
    try {
      const data = JSON.parse(stored)
      if (typeof data?.valentineName === 'string' && data.valentineName.trim()) {
        setValentineName(data.valentineName.trim())
      }
    } catch {
      // ignore malformed session state
    }
  }, [])

  return (
    <main className="min-h-screen px-6 py-16">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="wizard-shell surface-card text-center"
      >
        <div className="-mx-6 -mt-6 mb-6 overflow-hidden rounded-t-[14px] border-b border-[var(--surface-border)]">
          <img
            src="/message-sent.jpg"
            alt="Message sent decoration"
            className="h-[200px] w-full object-cover"
            loading="eager"
            decoding="async"
          />
        </div>

        <h1 className="mt-4 font-display text-[54px] italic leading-[1.08] tracking-[0.04em] text-primary">
          {valentineName} will be Cupid called!
        </h1>

        <div className="mx-auto mt-9 max-w-[560px] rounded-[12px] border border-[var(--surface-border)] bg-[var(--surface-bg)] px-5 py-5 text-left">
          <h2 className="font-display text-[34px] italic leading-[1.1] text-primary">What happens next:</h2>
          <ul className="mt-4 space-y-2 text-[14px] leading-[1.8] text-muted">
            <li>Your Valentine gets a Cupid Call heads-up text.</li>
            <li>The phone call arrives from a +1 number.</li>
            <li>After the call, they get a referral text with a promo code.</li>
          </ul>
          <p className="mt-4 text-[14px] leading-[1.8] text-muted">Now just wait for their reaction!</p>
        </div>

        <div className="mt-8 flex justify-center">
          <Link href="/" className="btn-secondary min-w-[184px]">
            Back Home
          </Link>
        </div>
      </motion.section>
    </main>
  )
}

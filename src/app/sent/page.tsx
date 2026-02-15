'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function SentPage() {
  return (
    <main className="min-h-screen px-6 py-16">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="wizard-shell surface-card text-center"
      >
        <h1 className="mt-4 font-display text-[54px] italic leading-[1.08] tracking-[0.04em] text-primary">
          Richie will be anonymously Cupid called!
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

'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="landing-white-base relative min-h-screen overflow-hidden">
      <div className="landing-bg-image-wrap" aria-hidden>
        <img
          src="/cupid-phone-heart.png"
          alt=""
          className="landing-bg-image"
          loading="eager"
          decoding="async"
        />
      </div>
      <div className="landing-text-vignette" aria-hidden />

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-110px)] w-full max-w-6xl items-center px-6 py-14 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="landing-copy-panel max-w-[660px]"
        >
          <img
            src="/cupid-call-logo.png"
            alt="Cupid Call"
            className="h-auto w-[220px] sm:w-[290px]"
            loading="eager"
            decoding="async"
          />
          <h1 className="mt-4 font-display text-[29px] italic leading-[1.12] tracking-[0.03em] text-primary sm:text-[43px]">
            Impress your Valentine,
            <br />
            with a simple suprise.
          </h1>
          <p className="mt-6 max-w-[58ch] text-[15px] leading-[1.82] text-muted sm:text-[16px]">
            Hate using the phone? Don&apos;t know what to say? Choose your Cupid. Pick your intent. Preview the pitch.
            Then Cupid will call and say it for you.
          </p>

          <div className="mt-9">
            <Link href="/create" className="btn-cupid min-w-[220px] px-7 py-3 text-[15px]">
              Send a Cupid Call
            </Link>
          </div>

          <p className="mt-7 max-w-[62ch] text-[14px] leading-[1.8] text-muted sm:text-[15px]">
            Your valentine then receives a promo code to send a message back, for free!
          </p>
        </motion.div>
      </section>

      <footer className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-10 pt-4">
        <div className="border-t border-[var(--surface-border)] pt-6 text-[12px] tracking-[0.05em] text-muted">
          <p>Made with love by bitpixi</p>
        </div>
      </footer>
    </main>
  )
}

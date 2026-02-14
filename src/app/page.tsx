'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Share Your Story',
    detail: 'Add personal details, private references, and the emotional tone you want to send.',
  },
  {
    step: '02',
    title: 'Choose a Character',
    detail: 'Select from age-gated personas designed for warmth, drama, or playful charm.',
  },
  {
    step: '03',
    title: 'Deliver the Call',
    detail: 'Approve the script and send a live AI phone call with room for a short reply.',
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <nav className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8">
        <div className="text-[17px] tracking-[0.12em] uppercase text-muted">Cupid Call</div>
        <div className="text-[12px] uppercase tracking-[0.12em] text-muted">Live Valentine Voice Telegrams</div>
      </nav>

      <section className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-14 pt-10 text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-[12px] uppercase tracking-[0.22em] text-gold"
        >
          A Candlelit Letter, Delivered by Voice
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.55 }}
          className="mt-5 font-display text-[56px] italic leading-[1.04] tracking-[0.04em] text-primary md:text-[72px]"
        >
          Send a call that sounds
          <br />
          like you meant every word.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mx-auto mt-8 max-w-2xl text-[16px] leading-[1.8] text-muted"
        >
          Cupid Call turns your private memories into a refined voice telegram.
          Crafted with character, delivered live, and designed to feel personal from the first line.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.45 }}
          className="mt-11 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link href="/create" className="btn-cupid min-w-[180px]">
            Start Your Call
          </Link>
          <a href="#how" className="btn-secondary min-w-[180px]">
            How It Works
          </a>
        </motion.div>
      </section>

      <section id="how" className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {HOW_IT_WORKS.map((item) => (
            <article key={item.step} className="surface-card">
              <p className="text-[11px] uppercase tracking-[0.18em] text-gold">{item.step}</p>
              <h2 className="mt-4 font-display text-[34px] italic leading-[1.12] text-primary">{item.title}</h2>
              <p className="mt-4 text-[14px] leading-[1.8] text-muted">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-6 py-14">
        <article className="surface-card text-center">
          <p className="mx-auto max-w-2xl font-display text-[39px] italic leading-[1.2] text-primary md:text-[46px]">
            “A beautiful delivery can change how a message is remembered.”
          </p>
          <p className="mt-5 text-[13px] uppercase tracking-[0.16em] text-muted">
            Design Note
          </p>
        </article>
      </section>

      <footer className="mx-auto w-full max-w-6xl px-6 pb-12 pt-6">
        <div className="flex flex-col items-center justify-between gap-4 border-t border-[var(--surface-border)] pt-6 text-center text-[12px] tracking-[0.08em] text-muted md:flex-row md:text-left">
          <p>Cupid Call</p>
          <p>Personal voice telegrams for modern romance</p>
        </div>
      </footer>
    </main>
  )
}

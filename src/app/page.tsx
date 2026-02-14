'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

const TESTIMONIALS = [
  { name: 'Dave from Brisbane', text: 'My girlfriend cried. Then she called her mum. Then her mum cried. 10/10.', emoji: '😭' },
  { name: 'Sarah from Melbourne', text: 'I sent one to my husband at work. His boss heard it on speaker. He got a raise.', emoji: '📈' },
  { name: 'Anonymous', text: 'I sent one to myself. No regrets. I deserve it.', emoji: '💅' },
  { name: 'Chad from Sydney', text: 'Bro I literally proposed after the call ended. She said yes. Thanks Cupid Call.', emoji: '💍' },
  { name: 'Karen from Perth', text: 'Better than flowers. Better than chocolate. Better than my ex.', emoji: '🔥' },
]

const FLOATING_EMOJIS = ['💘', '💝', '💖', '💗', '💕', '💞', '💓', '☎️', '📞', '🏹', '😍', '🥰']

function FloatingHearts() {
  const [hearts, setHearts] = useState<Array<{ id: number; emoji: string; left: number; delay: number; duration: number }>>([])

  useEffect(() => {
    const newHearts = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      emoji: FLOATING_EMOJIS[Math.floor(Math.random() * FLOATING_EMOJIS.length)],
      left: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 8 + Math.random() * 12,
    }))
    setHearts(newHearts)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="heart-particle"
          style={{
            left: `${heart.left}%`,
            animationDuration: `${heart.duration}s`,
            animationDelay: `${heart.delay}s`,
          }}
        >
          {heart.emoji}
        </div>
      ))}
    </div>
  )
}

function RotatingTestimonials() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % TESTIMONIALS.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative h-32 flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md"
        >
          <p className="text-white/80 text-lg italic font-body">
            &ldquo;{TESTIMONIALS[current].text}&rdquo;
          </p>
          <p className="text-cupid-pink font-fun mt-2">
            {TESTIMONIALS[current].emoji} — {TESTIMONIALS[current].name}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function PhoneRinging() {
  return (
    <motion.div
      className="text-8xl"
      animate={{
        rotate: [0, 15, -15, 15, -15, 0],
      }}
      transition={{
        duration: 0.5,
        repeat: Infinity,
        repeatDelay: 2,
      }}
    >
      📞
    </motion.div>
  )
}

export default function HomePage() {
  const [showHow, setShowHow] = useState(false)

  return (
    <main className="relative min-h-screen">
      <FloatingHearts />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💘</span>
          <span className="font-fun text-xl font-bold text-white">Cupid Call</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/50">
          <span>A Sophiie AI Hackathon Project</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-12 pb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <PhoneRinging />
        </motion.div>

        <motion.h1
          className="font-display text-5xl md:text-7xl lg:text-8xl font-black mt-6 leading-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <span className="text-white">Send Your Valentine</span>
          <br />
          <span className="bg-gradient-to-r from-cupid-pink via-cupid-hot to-cupid-purple bg-clip-text text-transparent">
            an AI Love Telegram
          </span>
        </motion.h1>

        <motion.p
          className="mt-6 text-xl md:text-2xl text-white/70 max-w-2xl font-body"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          A personalised AI-powered phone call that&apos;ll make them laugh, cry,
          or wonder if you&apos;ve finally lost it. Probably all three.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col sm:flex-row gap-4 items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <Link href="/create" className="btn-cupid text-xl px-10 py-5 animate-pulse-glow">
            🏹 Send a Cupid Call
          </Link>
          <button
            onClick={() => setShowHow(!showHow)}
            className="text-white/60 hover:text-white transition-colors underline underline-offset-4 decoration-cupid-pink/50"
          >
            How does this even work?
          </button>
        </motion.div>

        {/* Price tag - mailaspud vibes */}
        <motion.div
          className="mt-6 inline-flex items-center gap-2 bg-cupid-gold/20 border border-cupid-gold/30 rounded-full px-4 py-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <span className="text-cupid-gold font-fun font-bold">100% FREE</span>
          <span className="text-white/50 text-sm">• because love shouldn&apos;t cost a thing*</span>
        </motion.div>
        <p className="text-white/20 text-xs mt-2">*Jk, Twilio charges us per call. But we love you anyway.</p>
      </section>

      {/* How it works */}
      <AnimatePresence>
        {showHow && (
          <motion.section
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative z-10 max-w-4xl mx-auto px-6 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
              {[
                { step: '1', emoji: '✍️', title: 'Spill the Beans', desc: 'Tell us about your Valentine. The more embarrassing details, the better.' },
                { step: '2', emoji: '🎭', title: 'Pick a Vibe', desc: 'Romantic serenade? Shakespearean drama? Comedic roast? Aussie slang love letter?' },
                { step: '3', emoji: '📱', title: 'We Call Them', desc: 'Our AI generates a personalised love telegram and calls their phone. Chaos ensues.' },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.2 }}
                  className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10"
                >
                  <div className="text-4xl mb-3">{item.emoji}</div>
                  <div className="font-fun text-cupid-pink text-sm mb-1">Step {item.step}</div>
                  <h3 className="font-display text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-white/60 font-body">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Social proof / testimonials */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center font-fun text-white/30 text-sm uppercase tracking-widest mb-6">
            What Real* Humans Said
          </h2>
          <RotatingTestimonials />
          <p className="text-center text-white/15 text-xs mt-4">
            *&quot;Real&quot; is a strong word. These are completely made up. But they COULD be real after you try it.
          </p>
        </div>
      </section>

      {/* Stats bar - absurd */}
      <section className="relative z-10 border-y border-white/10 py-8">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { number: '∞', label: 'Love generated' },
            { number: '0', label: 'Valentines harmed' },
            { number: '33', label: 'Hours to hack this' },
            { number: '1', label: 'Spud sent (wrong app)' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="font-display text-3xl font-black text-cupid-pink">{stat.number}</div>
              <div className="text-white/40 text-sm font-body mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* The "warning" section */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="telegram-paper rounded-2xl p-8 text-cupid-dark">
            <div className="font-display text-sm uppercase tracking-widest text-amber-800/60 mb-2">
              ⚡ IMPORTANT NOTICE ⚡
            </div>
            <h3 className="font-display text-2xl font-bold text-amber-900 mb-3">
              Every call starts with:
            </h3>
            <p className="font-body text-amber-900/80 text-lg leading-relaxed">
              &ldquo;G&apos;day! You&apos;re receiving a <strong>Cupid Call</strong> — a special Valentine&apos;s Day
              Love Telegram from the Sophiie AI Hackathon, sent with love by <em>[sender&apos;s name]</em>.
              Here&apos;s their message...&rdquo;
            </p>
            <p className="mt-4 text-amber-800/50 text-sm">
              So nobody gets spooked. We&apos;re romantic, not reckless. 💘
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-20 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-4xl md:text-5xl font-black mb-4">
            Don&apos;t just text them <span className="text-cupid-pink">&ldquo;Happy V Day&rdquo;</span>
          </h2>
          <p className="text-white/60 text-xl mb-8 font-body">
            That&apos;s what your ex would do. Be better than your ex.
          </p>
          <Link href="/create" className="btn-cupid text-xl px-10 py-5">
            🏹 Create Your Cupid Call
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8 px-6 text-center">
        <p className="text-white/30 text-sm font-body">
          Built with 💘 and questionable decisions for the{' '}
          <a href="https://sophiie.com" target="_blank" rel="noopener" className="text-cupid-pink/60 hover:text-cupid-pink">
            Sophiie AI Hackathon 2026
          </a>
        </p>
        <p className="text-white/15 text-xs mt-2">
          No AIs were emotionally damaged in the making of this product. (Probably.)
        </p>
      </footer>
    </main>
  )
}

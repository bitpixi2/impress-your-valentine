'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function SentPage() {
  const [senderName, setSenderName] = useState('')
  const [valentineName, setValentineName] = useState('')

  useEffect(() => {
    const stored = sessionStorage.getItem('cupidCallSent')
    if (stored) {
      const data = JSON.parse(stored)
      setSenderName(data.senderName)
      setValentineName(data.valentineName)
    }
  }, [])

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-6">
      {/* Confetti-like emojis */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 30 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl"
            initial={{
              x: '50vw',
              y: '50vh',
              scale: 0,
            }}
            animate={{
              x: `${Math.random() * 100}vw`,
              y: `${Math.random() * 100}vh`,
              scale: [0, 1.5, 1],
              rotate: Math.random() * 720,
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              delay: Math.random() * 0.5,
              ease: 'easeOut',
            }}
          >
            {['💘', '💝', '💖', '🏹', '✨', '🎉', '💌', '❤️‍🔥'][i % 8]}
          </motion.div>
        ))}
      </div>

      <motion.div
        className="relative z-10 text-center max-w-lg"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <motion.div
          className="text-8xl mb-6"
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          📞
        </motion.div>

        <h1 className="font-display text-4xl md:text-5xl font-black mb-4">
          <span className="text-cupid-pink">Cupid Call Sent!</span>
        </h1>

        <p className="text-white/70 text-xl font-body mb-2">
          {valentineName
            ? <>{valentineName}&apos;s phone is about to ring with a love telegram from {senderName}.</>
            : <>Your Valentine's phone is about to ring!</>
          }
        </p>

        <p className="text-white/40 font-body mb-8">
          If they don&apos;t pick up, they&apos;ll get a voicemail. Love finds a way. 💘
        </p>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
          <h3 className="font-fun text-cupid-gold mb-3">🌟 What Happens Now?</h3>
          <div className="text-left space-y-2 text-white/60 font-body text-sm">
            <p>📱 Their phone will ring in the next few seconds</p>
            <p>🗣️ The call starts with a friendly intro explaining it&apos;s a Cupid Call</p>
            <p>💌 Then your personalised love telegram plays</p>
            <p>🎁 At the end, they&apos;re told to visit CupidCall and use code <strong className="text-cupid-gold">LOVE</strong> for 1 free call back!</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/create" className="btn-cupid px-8 py-4">
            💘 Send Another Cupid Call
          </Link>
          <Link
            href="/"
            className="px-8 py-4 rounded-full border-2 border-white/20 text-white/60 hover:border-white/40 hover:text-white transition-all font-fun text-center"
          >
            ← Back to Home
          </Link>
        </div>

        <p className="text-white/20 text-xs mt-8 font-body">
          Built with 💘 for the Sophiie AI Hackathon 2026
        </p>
      </motion.div>
    </main>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function SentPage() {
  const [senderName, setSenderName] = useState('')
  const [valentineName, setValentineName] = useState('')
  const [scheduled, setScheduled] = useState(false)
  const [callStartsInMinutes, setCallStartsInMinutes] = useState(0)
  const [preCallTextSent, setPreCallTextSent] = useState(true)

  useEffect(() => {
    const stored = sessionStorage.getItem('cupidCallSent')
    if (!stored) return
    const data = JSON.parse(stored)
    setSenderName(data.senderName)
    setValentineName(data.valentineName)
    setScheduled(Boolean(data.scheduled))
    setCallStartsInMinutes(Number(data.callStartsInMinutes) || 0)
    setPreCallTextSent(data.preCallTextSent !== false)
  }, [])

  return (
    <main className="min-h-screen px-6 py-16">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="wizard-shell surface-card text-center"
      >
        <p className="text-[12px] uppercase tracking-[0.14em] text-gold">Call Status</p>
        <h1 className="mt-4 font-display text-[54px] italic leading-[1.08] tracking-[0.04em] text-primary">
          {scheduled ? 'Call Scheduled' : 'Call in Progress'}
        </h1>
        <p className="mx-auto mt-5 max-w-[520px] text-[15px] leading-[1.8] text-muted">
          {scheduled
            ? valentineName
              ? `${valentineName} will be called in about ${callStartsInMinutes} minutes with a telegram from ${senderName || 'you'}.`
              : `Your recipient will be called in about ${callStartsInMinutes} minutes.`
            : valentineName
              ? `${valentineName} is being called now with a telegram from ${senderName || 'you'}.`
              : 'Your recipient is being called now.'}
        </p>

        <div className="mx-auto mt-9 max-w-[560px] rounded-[12px] border border-[var(--surface-border)] bg-[var(--surface-bg)] px-5 py-5 text-left">
          <h2 className="font-display text-[34px] italic leading-[1.1] text-primary">What happens next</h2>
          <ul className="mt-4 space-y-2 text-[14px] leading-[1.8] text-muted">
            {scheduled ? (
              <li>
                {preCallTextSent
                  ? 'The recipient gets a Cupid Call heads-up text now.'
                  : 'The call is scheduled, but the pre-call SMS failed to send.'}
              </li>
            ) : (
              <li>The phone rings within a few seconds.</li>
            )}
            {scheduled ? (
              <li>The phone call starts in about {callStartsInMinutes} minutes.</li>
            ) : (
              <li>The recipient hears a Cupid Call introduction.</li>
            )}
            <li>The personalized telegram is delivered live.</li>
            <li>After the call, they get a referral text with code LOVE.</li>
          </ul>
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/create" className="btn-cupid min-w-[184px]">
            Send another call
          </Link>
          <Link href="/" className="btn-secondary min-w-[184px]">
            Return home
          </Link>
        </div>
      </motion.section>
    </main>
  )
}

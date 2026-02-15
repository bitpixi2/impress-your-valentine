'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { GROK_VOICES, getCharacterById } from '@/lib/types'

export default function PreviewPage() {
  const router = useRouter()
  const [callData, setCallData] = useState<any>(null)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const stored = sessionStorage.getItem('cupidCall')
    if (!stored) {
      router.push('/create')
      return
    }
    setCallData(JSON.parse(stored))
  }, [router])

  const handleSend = async () => {
    if (!callData) return
    setIsSending(true)
    setError('')

    try {
      const res = await fetch('/api/make-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: callData.valentinePhone,
          senderName: callData.senderName,
          valentineName: callData.valentineName,
          script: callData.script,
          characterId: callData.characterId,
          voiceId: callData.voiceId,
        }),
      })

      const data = await res.json()

      if (data.needsCredits) {
        setError('No credits remaining. Return to the wizard to add credits.')
        setIsSending(false)
        return
      }

      if (!res.ok) throw new Error(data.error || 'Failed to send')

      const sentPayload = {
        ...callData,
        callSid: data.callSid,
        callId: data.callId,
        scheduled: data.scheduled,
        callStartsInMinutes: data.callStartsInMinutes,
        preCallTextSent: data.preCallTextSent,
        remainingCredits: data.remainingCredits,
      }
      sessionStorage.setItem('cupidCallResult', JSON.stringify(sentPayload))
      sessionStorage.setItem('cupidCallSent', JSON.stringify(sentPayload))
      router.push('/sent')
    } catch (err: any) {
      setError(err.message || 'Could not place the call.')
      setIsSending(false)
    }
  }

  if (!callData) {
    return (
      <main className="min-h-screen px-6 py-16">
        <div className="wizard-shell surface-card text-center">
          <p className="text-muted">Preparing your preview…</p>
        </div>
      </main>
    )
  }

  const selectedVoice = GROK_VOICES.find((v) => v.id === callData.voiceId)
  const selectedCharacter = getCharacterById(callData.characterId)

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="wizard-shell">
        <header className="mb-8 text-center">
          <h1 className="font-display text-[52px] italic leading-[1.08] tracking-[0.04em] text-primary">
            Preview Telegram
          </h1>
          <p className="mt-3 text-[14px] text-muted">
            Review the script before placing the call to {callData.valentineName}.
          </p>
        </header>

        <section className="mb-5 flex flex-wrap justify-center gap-2">
          <span className="rounded-[10px] border border-[var(--surface-border)] bg-[var(--surface-bg)] px-3 py-1 text-[12px] text-muted">
            {callData.valentinePhone}
          </span>
          {selectedVoice && (
            <span className="rounded-[10px] border border-[var(--surface-border)] bg-[var(--surface-bg)] px-3 py-1 text-[12px] text-muted">
              Voice: {selectedVoice.name}
            </span>
          )}
          {selectedCharacter && (
            <span className="rounded-[10px] border border-[var(--surface-border)] bg-[var(--surface-bg)] px-3 py-1 text-[12px] text-muted">
              Character: {selectedCharacter.name}
            </span>
          )}
        </section>

        <motion.article
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="telegram-paper"
        >
          <p className="text-center text-[12px] uppercase tracking-[0.14em] text-[#7c6650]">Cupid Call Telegram</p>
          <p className="mt-4 text-center text-[13px] text-[#6d5a48]">
            From <span className="font-medium">{callData.senderName}</span> to{' '}
            <span className="font-medium">{callData.valentineName}</span>
          </p>
          <hr className="my-5 border-[#c9b89c]" />
          <p className="message whitespace-pre-wrap">{callData.script}</p>
          <hr className="my-5 border-[#c9b89c]" />
          <p className="text-center text-[12px] text-[#7a6650]">
            Shared with care through cupidcall.bitpixi.com
          </p>
        </motion.article>

        <section className="mt-6 surface-card text-center">
          <p className="text-[13px] leading-[1.75] text-muted">
            The recipient hears the telegram, then can respond briefly in real time.
          </p>
        </section>

        <section className="mt-6 flex flex-col gap-3">
          {error && (
            <div className="rounded-[12px] border border-[rgba(184,107,107,0.4)] bg-[rgba(184,107,107,0.1)] px-4 py-3 text-center text-[13px] text-[var(--age-red)]">
              {error}
            </div>
          )}
          <button onClick={handleSend} disabled={isSending} className="btn-cupid w-full py-3">
            {isSending ? 'Connecting call…' : 'Send call'}
          </button>
          <button onClick={() => router.push('/create')} className="btn-secondary w-full">
            Return to editor
          </button>
        </section>
      </div>
    </main>
  )
}

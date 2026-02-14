'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { GROK_VOICES, VOICE_STYLES } from '@/lib/types'

export default function PreviewPage() {
  const { data: session } = useSession()
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
          style: callData.style,
          voiceId: callData.voiceId,
          isExplicit: callData.isExplicit || false,
        }),
      })

      const data = await res.json()

      if (data.needsCredits) {
        setError('No credits remaining! Go back and buy a 3-pack or use code LOVE.')
        setIsSending(false)
        return
      }

      if (!res.ok) throw new Error(data.error || 'Failed to send')

      sessionStorage.setItem('cupidCallResult', JSON.stringify({
        ...callData,
        callSid: data.callSid,
        remainingCredits: data.remainingCredits,
      }))
      router.push('/sent')
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Try again?')
      setIsSending(false)
    }
  }

  if (!callData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-4xl">💘</div>
      </div>
    )
  }

  const selectedVoice = GROK_VOICES.find(v => v.id === callData.voiceId)
  const selectedStyle = VOICE_STYLES.find(s => s.id === callData.style)

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
            <span className="text-6xl">📜</span>
          </motion.div>
          <h1 className="font-display text-3xl font-bold mt-4">Your Love Telegram</h1>
          <p className="text-white/50 font-body mt-2">
            Review your message before we call {callData.valentineName}
          </p>
        </div>

        {/* Call info badges */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-white/60">
            📞 {callData.valentinePhone}
          </span>
          {selectedVoice && (
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-white/60">
              {selectedVoice.emoji} Voice: {selectedVoice.name}
            </span>
          )}
          {selectedStyle && (
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-white/60">
              {selectedStyle.emoji} {selectedStyle.name}
            </span>
          )}
          {callData.isExplicit && (
            <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              🔞 After Dark
            </span>
          )}
        </div>

        {/* Telegram paper */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="telegram-paper mb-6"
        >
          <div className="text-center mb-4">
            <span className="font-fun text-sm text-amber-800/60">💘 CUPID CALL LOVE TELEGRAM 💘</span>
          </div>
          <div className="text-center mb-3">
            <span className="font-body text-amber-900/50 text-sm">
              From: <strong>{callData.senderName}</strong> → To: <strong>{callData.valentineName}</strong>
            </span>
          </div>
          <hr className="border-amber-900/10 mb-4" />
          <p className="font-body text-amber-900/80 leading-relaxed whitespace-pre-wrap text-base">
            {callData.script}
          </p>
          <hr className="border-amber-900/10 mt-4 mb-3" />
          <p className="text-center text-amber-900/40 text-xs font-body italic">
            &ldquo;Visit cupidcall.com — use code LOVE for 1 free call back!&rdquo;
          </p>
        </motion.div>

        {/* Live voice note */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-center">
          <p className="text-white/50 text-sm font-body">
            ⚡ <strong className="text-white/70">Powered by Grok Voice Agent</strong> — your telegram
            will be delivered by live AI voice in real-time. After the message plays,
            {callData.valentineName} can even talk back!
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={isSending}
            className={`btn-cupid w-full py-4 text-lg ${isSending ? 'opacity-50' : ''}`}
          >
            {isSending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">📞</span> Dialling {callData.valentineName}...
              </span>
            ) : (
              `📞 Call ${callData.valentineName} Now`
            )}
          </button>

          <button
            onClick={() => router.push('/create')}
            className="text-white/40 hover:text-white transition-colors text-sm text-center py-2"
          >
            ← Go back and edit
          </button>
        </div>
      </div>
    </main>
  )
}

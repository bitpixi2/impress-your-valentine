'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import CreditBar from '@/components/CreditBar'
import {
  CHARACTER_OPTIONS,
  CONTENT_TYPES,
  getCharacterById,
  type CharacterId,
  type ContentTypeId,
  type GrokVoiceId,
} from '@/lib/types'

interface FormData {
  characterId: CharacterId | ''
  contentType: ContentTypeId | ''
  personalTouch: string
  senderName: string
  valentineName: string
  valentinePhone: string
  script: string
  voiceId: GrokVoiceId | ''
}

const INITIAL_FORM: FormData = {
  characterId: '',
  contentType: '',
  personalTouch: '',
  senderName: '',
  valentineName: '',
  valentinePhone: '',
  script: '',
  voiceId: '',
}

const STEP_TITLES = ['Pick Your Character', 'Add Details', 'Preview + Send']

const CHARACTER_MENU_IMAGE: Record<CharacterId, { src: string; alt: string }> = {
  'kid-bot': {
    src: '/menu1-kidfriendly.png',
    alt: 'Kid Bot character selection',
  },
  'southern-belle': {
    src: '/menu2-lady.png',
    alt: 'Southern Belle character selection',
  },
  'victorian-gentleman': {
    src: '/menu3-gentleman.png',
    alt: 'Victorian Gentleman character selection',
  },
  'sakura-confession': {
    src: '/menu4-sakura.png',
    alt: 'Sakura Confession character selection',
  },
  'nocturne-vampire': {
    src: '/menu5-vampire.png',
    alt: 'Nocturne Vampire character selection',
  },
}

export default function CreatePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [error, setError] = useState('')
  const [audioError, setAudioError] = useState('')
  const [credits, setCredits] = useState(0)
  const [hasUsedLoveCode, setHasUsedLoveCode] = useState(false)
  const [purchaseStatus, setPurchaseStatus] = useState('')

  const [isGeneratingScript, setIsGeneratingScript] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isLoadingAudio, setIsLoadingAudio] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [audioPreviewDataUrl, setAudioPreviewDataUrl] = useState('')
  const [audioPreviewScriptSnapshot, setAudioPreviewScriptSnapshot] = useState('')

  const audioRef = useRef<HTMLAudioElement | null>(null)

  const totalSteps = 3
  const selectedCharacter = useMemo(() => getCharacterById(form.characterId), [form.characterId])
  const personalTouchChars = form.personalTouch.length

  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn(undefined, { callbackUrl: '/create' })
    }
  }, [status])

  const loadCredits = async () => {
    try {
      const res = await fetch('/api/credits')
      if (!res.ok) return
      const data = await res.json()
      setCredits(data.remainingCredits)
      setHasUsedLoveCode(data.hasUsedLoveCode)
    } catch {
      // Ignore transient fetch issues.
    }
  }

  useEffect(() => {
    if (session) loadCredits()
  }, [session])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setPurchaseStatus(params.get('purchase') || '')
  }, [])

  useEffect(() => {
    if (purchaseStatus !== 'success') return
    const poll = setInterval(loadCredits, 2000)
    setTimeout(() => clearInterval(poll), 15000)
  }, [purchaseStatus])

  useEffect(() => {
    if (session?.user?.name && !form.senderName) {
      setForm((prev) => ({ ...prev, senderName: session.user?.name || '' }))
    }
  }, [session, form.senderName])

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const stopAudio = () => {
    if (!audioRef.current) return
    audioRef.current.pause()
    audioRef.current.currentTime = 0
    setIsPlayingAudio(false)
  }

  const selectCharacter = (characterId: CharacterId) => {
    const character = getCharacterById(characterId)
    setForm((prev) => ({
      ...prev,
      characterId,
      voiceId: character?.voiceId || '',
      script: '',
    }))
    stopAudio()
    setAudioError('')
    setAudioPreviewDataUrl('')
    setAudioPreviewScriptSnapshot('')
  }

  const updateContentType = (contentType: ContentTypeId) => {
    setForm((prev) => ({ ...prev, contentType, script: '' }))
    stopAudio()
    setAudioError('')
    setAudioPreviewDataUrl('')
    setAudioPreviewScriptSnapshot('')
  }

  const updatePersonalTouch = (personalTouch: string) => {
    setForm((prev) => ({ ...prev, personalTouch, script: '' }))
    stopAudio()
    setAudioError('')
    setAudioPreviewDataUrl('')
    setAudioPreviewScriptSnapshot('')
  }

  const updateScript = (script: string) => {
    setForm((prev) => ({ ...prev, script }))
    stopAudio()
    setAudioError('')
    setAudioPreviewDataUrl('')
    setAudioPreviewScriptSnapshot('')
  }

  const canContinue = () => {
    if (step === 0) return Boolean(form.characterId)
    if (step === 1) return Boolean(form.contentType)
    return false
  }

  const generateScript = async () => {
    const character = getCharacterById(form.characterId)
    if (!character) {
      setError('Pick a character before generating.')
      return
    }
    if (!form.contentType) {
      setError('Choose a content type before generating.')
      return
    }

    setIsGeneratingScript(true)
    setError('')
    setAudioError('')

    try {
      const scriptRes = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: form.senderName || session?.user?.name || 'Someone',
          valentineName: form.valentineName || 'your valentine',
          contentType: form.contentType,
          personalTouch: form.personalTouch,
          characterId: character.id,
        }),
      })

      if (!scriptRes.ok) {
        const body = await scriptRes.json().catch(() => ({ error: 'Failed to generate script' }))
        throw new Error(body.error || 'Failed to generate script')
      }

      const { script } = await scriptRes.json()
      setForm((prev) => ({
        ...prev,
        script,
        voiceId: character.voiceId,
      }))
      setAudioPreviewDataUrl('')
      setAudioPreviewScriptSnapshot('')
    } catch (err: any) {
      setError(err.message || 'Could not generate script. Please try again.')
    } finally {
      setIsGeneratingScript(false)
    }
  }

  const handleContinue = async () => {
    if (step === 0) {
      setStep(1)
      return
    }
    if (step === 1) {
      if (!canContinue()) return
      setStep(2)
      if (!form.script) {
        await generateScript()
      }
    }
  }

  const handleAudioPreview = async () => {
    if (!form.script.trim()) {
      setAudioError('Add script text before previewing audio.')
      return
    }

    if (isPlayingAudio) {
      stopAudio()
      return
    }

    setAudioError('')
    let previewDataUrl = audioPreviewDataUrl

    try {
      if (!previewDataUrl || audioPreviewScriptSnapshot !== form.script) {
        setIsLoadingAudio(true)
        const res = await fetch('/api/preview-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            script: form.script,
            characterId: form.characterId,
            voiceId: selectedCharacter?.voiceId || form.voiceId || 'Ara',
          }),
        })

        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Could not generate audio preview')

        previewDataUrl = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`
        setAudioPreviewDataUrl(previewDataUrl)
        setAudioPreviewScriptSnapshot(form.script)
      }

      if (!audioRef.current) {
        audioRef.current = new Audio(previewDataUrl)
        audioRef.current.onended = () => setIsPlayingAudio(false)
      } else {
        audioRef.current.src = previewDataUrl
      }

      await audioRef.current.play()
      setIsPlayingAudio(true)
    } catch (err: any) {
      setAudioError(err.message || 'Audio preview failed.')
      setIsPlayingAudio(false)
    } finally {
      setIsLoadingAudio(false)
    }
  }

  const handleSend = async () => {
    const character = getCharacterById(form.characterId)
    if (!character) {
      setError('Pick a character first.')
      return
    }

    if (!form.script.trim()) {
      setError('Generate and review your script before sending.')
      return
    }

    if (!form.senderName.trim() || !form.valentineName.trim() || !form.valentinePhone.trim()) {
      setError('Fill in your name, their name, and their phone number.')
      return
    }

    if (credits <= 0) {
      setError('No call credits available. Apply LOVE or purchase a pack.')
      return
    }

    setIsSending(true)
    setError('')

    try {
      const res = await fetch('/api/make-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: form.valentinePhone.trim(),
          senderName: form.senderName.trim(),
          valentineName: form.valentineName.trim(),
          script: form.script.trim(),
          characterId: character.id,
        }),
      })

      const data = await res.json()

      if (data.needsCredits) {
        setError('No credits remaining. Use LOVE or purchase more.')
        setIsSending(false)
        return
      }

      if (!res.ok) throw new Error(data.error || 'Failed to send call')

      const sentPayload = {
        ...form,
        voiceId: character.voiceId,
        callSid: data.callSid,
        callId: data.callId,
        scheduled: data.scheduled,
        callStartsInMinutes: data.callStartsInMinutes,
        preCallTextSent: data.preCallTextSent,
        remainingCredits: data.remainingCredits,
      }

      sessionStorage.setItem('cupidCallSent', JSON.stringify(sentPayload))
      router.push('/sent')
    } catch (err: any) {
      setError(err.message || 'Could not place the call.')
      setIsSending(false)
    }
  }

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <main className="min-h-screen px-6 py-16">
        <div className="wizard-shell surface-card text-center">
          <p className="text-muted">Loading your workspace…</p>
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen pb-16">
      <nav className="wizard-shell flex items-center justify-between px-6 py-8">
        <a href="/" className="text-[14px] uppercase tracking-[0.14em] text-muted">
          Cupid Call
        </a>
        <div className="text-[12px] uppercase tracking-[0.12em] text-muted">
          Step {step + 1} / {totalSteps}
        </div>
      </nav>

      <section className="wizard-shell px-6">
        <CreditBar credits={credits} hasUsedLoveCode={hasUsedLoveCode} onCreditsUpdated={loadCredits} />
      </section>

      <section className="wizard-shell px-6 pb-12 pt-6">
        <div className="mb-6 flex justify-center gap-2">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className={`step-dot ${i === step ? 'active' : i < step ? 'completed' : 'pending'}`} />
          ))}
        </div>

        {purchaseStatus === 'success' && (
          <div className="mb-5 rounded-[12px] border border-[rgba(123,175,123,0.35)] bg-[rgba(123,175,123,0.09)] px-4 py-3 text-center text-[13px] text-[var(--age-green)]">
            Payment confirmed. Three call credits were added.
          </div>
        )}

        <div className="surface-card">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-center font-display text-[44px] italic leading-[1.08] tracking-[0.04em] text-primary md:text-[54px]">
                {STEP_TITLES[step]}
              </h1>

              {step === 0 && (
                <div className="mt-8">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                    {CHARACTER_OPTIONS.map((character) => (
                      <button
                        key={character.id}
                        onClick={() => selectCharacter(character.id)}
                        aria-label={CHARACTER_MENU_IMAGE[character.id].alt}
                        className={`overflow-hidden rounded-[12px] border border-transparent bg-transparent p-0 transition-all duration-200 ${
                          form.characterId === character.id
                            ? 'border-[rgba(196,122,142,0.9)]'
                            : 'hover:border-[rgba(255,255,255,0.25)]'
                        }`}
                      >
                        <img
                          src={CHARACTER_MENU_IMAGE[character.id].src}
                          alt={CHARACTER_MENU_IMAGE[character.id].alt}
                          className="block h-auto w-full"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="mt-8 space-y-6">
                  <div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                      {CONTENT_TYPES.map((ct) => (
                        <button
                          key={ct.id}
                          onClick={() => updateContentType(ct.id)}
                          className={`style-card text-left ${form.contentType === ct.id ? 'selected' : ''}`}
                        >
                          <div>
                            <p className="text-[15px] font-medium text-primary">{ct.name}</p>
                            <p className="mt-1 text-[13px] leading-[1.7] text-muted">{ct.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-[12px] uppercase tracking-[0.12em] text-muted">
                      Personal details (500 characters maximum)
                    </label>
                    <textarea
                      className="input-cupid min-h-[240px]"
                      maxLength={500}
                      value={form.personalTouch}
                      onChange={(e) => updatePersonalTouch(e.target.value)}
                      placeholder="How you met, inside jokes, what you love, pet names, memories..."
                    />
                    <p className="mt-2 text-right text-[12px] text-muted">{personalTouchChars}/500</p>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="mt-8">
                  {isGeneratingScript && !form.script ? (
                    <div className="rounded-[12px] border border-[var(--surface-border)] bg-[var(--surface-bg)] px-6 py-12 text-center">
                      <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-[var(--surface-border)] border-t-[var(--accent-rose)]" />
                      <p className="text-[14px] text-muted">Grok is generating your script…</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
                      <div className="space-y-4">
                        <div>
                          <label className="mb-2 block text-[12px] uppercase tracking-[0.12em] text-muted">
                            Editable Script
                          </label>
                          <textarea
                            className="input-cupid min-h-[360px]"
                            value={form.script}
                            onChange={(e) => updateScript(e.target.value)}
                            placeholder="Your generated script appears here."
                          />
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={handleAudioPreview}
                            disabled={isLoadingAudio || !form.script.trim()}
                            className="btn-secondary min-w-[190px]"
                          >
                            {isLoadingAudio
                              ? 'Generating Audio…'
                              : isPlayingAudio
                                ? 'Pause Audio Preview'
                                : 'Audio Preview'}
                          </button>
                          <button
                            onClick={generateScript}
                            disabled={isGeneratingScript}
                            className="btn-secondary min-w-[170px]"
                          >
                            {isGeneratingScript ? 'Regenerating…' : 'Regenerate Script'}
                          </button>
                        </div>
                        {audioError && <p className="text-[12px] text-[var(--age-red)]">{audioError}</p>}
                      </div>

                      <div className="space-y-4 rounded-[12px] border border-[var(--surface-border)] bg-[var(--surface-bg)] p-4">
                        <div>
                          <label className="mb-2 block text-[12px] uppercase tracking-[0.12em] text-muted">Your name</label>
                          <input
                            type="text"
                            className="input-cupid"
                            value={form.senderName}
                            onChange={(e) => setForm((prev) => ({ ...prev, senderName: e.target.value }))}
                            placeholder="Your name"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-[12px] uppercase tracking-[0.12em] text-muted">Their name</label>
                          <input
                            type="text"
                            className="input-cupid"
                            value={form.valentineName}
                            onChange={(e) => setForm((prev) => ({ ...prev, valentineName: e.target.value }))}
                            placeholder="Recipient name"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-[12px] uppercase tracking-[0.12em] text-muted">
                            Their phone number
                          </label>
                          <input
                            type="tel"
                            className="input-cupid"
                            value={form.valentinePhone}
                            onChange={(e) => setForm((prev) => ({ ...prev, valentinePhone: e.target.value }))}
                            placeholder="+61..."
                          />
                        </div>

                        <button
                          onClick={handleSend}
                          disabled={isSending || isGeneratingScript || credits <= 0}
                          className="btn-cupid mt-2 w-full py-3"
                        >
                          {isSending ? 'Sending Call…' : credits <= 0 ? 'Credits Required' : 'Send Call'}
                        </button>
                        <p className="text-[12px] text-muted">
                          {selectedCharacter
                            ? `Character: ${selectedCharacter.name} • Voice ${selectedCharacter.voiceId}`
                            : 'Choose a character to continue.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              onClick={() => {
                setError('')
                if (step > 0) {
                  setStep(step - 1)
                } else {
                  router.push('/')
                }
              }}
              className="btn-secondary min-w-[98px]"
            >
              {step > 0 ? 'Back' : 'Home'}
            </button>

            <p className="min-h-[20px] max-w-[360px] text-center text-[12px] leading-[1.5] text-[var(--age-red)]">
              {error}
            </p>

            {step < totalSteps - 1 ? (
              <button onClick={handleContinue} disabled={!canContinue()} className="btn-cupid min-w-[104px]">
                Continue
              </button>
            ) : (
              <div className="w-[104px]" />
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

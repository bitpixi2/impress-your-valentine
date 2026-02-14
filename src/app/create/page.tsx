'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import CreditBar from '@/components/CreditBar'
import {
  AGE_OPTIONS,
  CHARACTER_OPTIONS,
  CONTENT_TYPES,
  getCharacterById,
  getAvailableCharacters,
  isCharacterAvailableForAge,
  type AgeBand,
  type CharacterId,
  type ContentTypeId,
} from '@/lib/types'

interface FormData {
  senderName: string
  valentineName: string
  valentinePhone: string
  senderAgeBand: AgeBand | ''
  contentType: ContentTypeId | ''
  personalTouch: string
  customMessage: string
  characterId: CharacterId | ''
}

const INITIAL_FORM: FormData = {
  senderName: '',
  valentineName: '',
  valentinePhone: '',
  senderAgeBand: '',
  contentType: '',
  personalTouch: '',
  customMessage: '',
  characterId: '',
}

const AGE_ACCENT: Record<AgeBand, string> = {
  under_16: 'var(--age-green)',
  '16_plus': 'var(--age-amber)',
  '18_plus': 'var(--age-red)',
}

export default function CreatePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [credits, setCredits] = useState(0)
  const [hasUsedLoveCode, setHasUsedLoveCode] = useState(false)
  const [purchaseStatus, setPurchaseStatus] = useState('')

  const totalSteps = 4
  const stepTitles = [
    'Sign In and Age Gate',
    'Content Direction',
    'Personal Detail',
    'Character Selection',
  ]

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
      // Ignore transient fetch issues in UI.
    }
  }

  useEffect(() => {
    if (session) loadCredits()
  }, [session])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const purchase = params.get('purchase') || ''
    setPurchaseStatus(purchase)
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
    if (!form.senderAgeBand || !form.characterId) return
    if (!isCharacterAvailableForAge(form.characterId, form.senderAgeBand)) {
      setForm((prev) => ({ ...prev, characterId: '' }))
    }
  }, [form.senderAgeBand, form.characterId])

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const availableCharacters = getAvailableCharacters(form.senderAgeBand)
  const selectedCharacter = getCharacterById(form.characterId)
  const personalTouchChars = form.personalTouch.length

  const canProceed = () => {
    switch (step) {
      case 0:
        return Boolean(form.senderName && form.valentineName && form.valentinePhone && form.senderAgeBand)
      case 1:
        return Boolean(form.contentType)
      case 2:
        return Boolean(
          form.personalTouch.trim().length >= 20 &&
          (form.contentType !== 'custom' || form.customMessage.trim().length > 0)
        )
      case 3:
        return Boolean(form.characterId)
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    const chosenCharacter = getCharacterById(form.characterId)
    if (!chosenCharacter) {
      setError('Select a character before generating the preview.')
      return
    }
    if (credits <= 0) {
      setError('No call credits available. Apply a code or purchase a pack.')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      const scriptRes = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          voiceId: chosenCharacter.voiceId,
        }),
      })

      if (!scriptRes.ok) {
        const body = await scriptRes.json().catch(() => ({ error: 'Failed to generate script' }))
        throw new Error(body.error || 'Failed to generate script')
      }

      const { script } = await scriptRes.json()

      sessionStorage.setItem(
        'cupidCall',
        JSON.stringify({
          ...form,
          voiceId: chosenCharacter.voiceId,
          script,
        })
      )

      router.push('/preview')
    } catch (err: any) {
      setError(err.message || 'Could not generate preview. Please try again.')
      setIsGenerating(false)
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
    <main className="relative min-h-screen pb-28">
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
              <h1 className="text-center font-display text-[46px] italic leading-[1.08] tracking-[0.04em] text-primary md:text-[56px]">
                {stepTitles[step]}
              </h1>

              {step === 0 && (
                <div className="mt-9 space-y-6">
                  <p className="text-center text-[14px] text-muted">
                    Select your age band to unlock matching characters.
                  </p>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {AGE_OPTIONS.map((age) => {
                      const active = form.senderAgeBand === age.id
                      const border = AGE_ACCENT[age.id]
                      return (
                        <button
                          key={age.id}
                          onClick={() => update('senderAgeBand', age.id)}
                          className={`style-card text-left ${active ? 'selected' : ''}`}
                          style={{
                            borderColor: active ? border : undefined,
                            background: active ? 'rgba(255,255,255,0.06)' : undefined,
                          }}
                        >
                          <p className="text-[14px] font-medium text-primary">{age.label}</p>
                          <p className="mt-1 text-[12px] text-muted">{age.desc}</p>
                        </button>
                      )
                    })}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-[12px] uppercase tracking-[0.12em] text-muted">Your name</label>
                      <input
                        type="text"
                        className="input-cupid"
                        value={form.senderName}
                        onChange={(e) => update('senderName', e.target.value)}
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[12px] uppercase tracking-[0.12em] text-muted">Recipient name</label>
                      <input
                        type="text"
                        className="input-cupid"
                        value={form.valentineName}
                        onChange={(e) => update('valentineName', e.target.value)}
                        placeholder="Who should receive the call?"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[12px] uppercase tracking-[0.12em] text-muted">Phone number</label>
                      <input
                        type="tel"
                        className="input-cupid"
                        value={form.valentinePhone}
                        onChange={(e) => update('valentinePhone', e.target.value)}
                        placeholder="+61..."
                      />
                      <p className="mt-2 text-[12px] text-muted">Include country code.</p>
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="mt-10">
                  <p className="mb-6 text-center text-[14px] text-muted">Pick the emotional direction of the message.</p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {CONTENT_TYPES.map((ct) => (
                      <button
                        key={ct.id}
                        onClick={() => update('contentType', ct.id)}
                        className={`style-card text-left ${form.contentType === ct.id ? 'selected' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-[24px] leading-none">{ct.emoji}</span>
                          <div>
                            <p className="text-[15px] font-medium text-primary">{ct.name}</p>
                            <p className="mt-1 text-[13px] leading-[1.7] text-muted">{ct.desc}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="mt-10 space-y-5">
                  <p className="text-center text-[14px] text-muted">
                    Add context that only the two of you would recognize.
                  </p>
                  <div>
                    <label className="mb-2 block text-[12px] uppercase tracking-[0.12em] text-muted">Personal detail</label>
                    <textarea
                      className="input-cupid min-h-[220px]"
                      maxLength={1000}
                      value={form.personalTouch}
                      onChange={(e) => update('personalTouch', e.target.value)}
                      placeholder="How you met, shared phrases, private memories, the traits you admire..."
                    />
                    <p className="mt-2 text-right text-[12px] text-muted">{personalTouchChars}/1000</p>
                  </div>
                  {form.contentType === 'custom' && (
                    <div>
                      <label className="mb-2 block text-[12px] uppercase tracking-[0.12em] text-muted">Core message</label>
                      <textarea
                        className="input-cupid min-h-[140px]"
                        value={form.customMessage}
                        onChange={(e) => update('customMessage', e.target.value)}
                        placeholder="The exact sentiment that must be included."
                      />
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="mt-10">
                  <p className="mb-6 text-center text-[14px] text-muted">
                    Available now: {availableCharacters.length} of {CHARACTER_OPTIONS.length}
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {CHARACTER_OPTIONS.map((character) => {
                      const unlocked = form.senderAgeBand
                        ? isCharacterAvailableForAge(character.id, form.senderAgeBand)
                        : false

                      return (
                        <button
                          key={character.id}
                          onClick={() => unlocked && update('characterId', character.id)}
                          disabled={!unlocked}
                          className={`style-card character-card ${
                            form.characterId === character.id ? 'selected' : ''
                          } ${!unlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span className="emoji">{character.emoji}</span>
                          <p className="title mt-4">{character.name}</p>
                          <p className="meta mt-3">{character.ageGateLabel} • Voice {character.voiceId}</p>
                          <p className="desc mt-3">{character.desc}</p>
                          {!unlocked && (
                            <p className="mt-4 text-[11px] uppercase tracking-[0.12em] text-[var(--age-red)]">
                              Locked
                            </p>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {selectedCharacter && (
                    <div className="mt-5 rounded-[12px] border border-[var(--surface-border)] bg-[var(--surface-bg)] px-4 py-3 text-center text-[13px] text-muted">
                      Selected character: <span className="text-primary">{selectedCharacter.name}</span> with voice{' '}
                      <span className="text-primary">{selectedCharacter.voiceId}</span>.
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <div className="bottom-bar fixed bottom-0 left-0 right-0 z-40 px-6 py-4">
        <div className="wizard-shell flex items-center justify-between gap-4">
          <button
            onClick={() => (step > 0 ? setStep(step - 1) : router.push('/'))}
            className="btn-secondary min-w-[96px]"
          >
            {step > 0 ? 'Back' : 'Home'}
          </button>

          <p className="min-h-[20px] max-w-[270px] text-center text-[12px] leading-[1.5] text-[var(--age-red)]">
            {error}
          </p>

          {step < totalSteps - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="btn-cupid min-w-[96px]"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || isGenerating || credits <= 0}
              className="btn-cupid min-w-[146px]"
            >
              {isGenerating ? 'Generating…' : credits <= 0 ? 'Credits required' : 'Generate preview'}
            </button>
          )}
        </div>
      </div>
    </main>
  )
}

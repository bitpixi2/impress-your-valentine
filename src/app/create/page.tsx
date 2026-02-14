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
    'Sign In + Age Gate',
    'Choose Content Type',
    'Add Personal Touch',
    'Pick Your Character',
  ]

  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn(undefined, { callbackUrl: '/create' })
    }
  }, [status])

  const loadCredits = async () => {
    try {
      const res = await fetch('/api/credits')
      if (res.ok) {
        const data = await res.json()
        setCredits(data.remainingCredits)
        setHasUsedLoveCode(data.hasUsedLoveCode)
      }
    } catch { /* silently fail */ }
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
    if (purchaseStatus === 'success') {
      const poll = setInterval(loadCredits, 2000)
      setTimeout(() => clearInterval(poll), 15000)
    }
  }, [purchaseStatus])

  useEffect(() => {
    if (session?.user?.name && !form.senderName) {
      setForm((prev) => ({ ...prev, senderName: session.user!.name || '' }))
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
      default: return false
    }
  }

  const handleSubmit = async () => {
    const chosenCharacter = getCharacterById(form.characterId)
    if (!chosenCharacter) {
      setError('Pick a character before generating.')
      return
    }
    if (credits <= 0) {
      setError("You need credits! Use code LOVE for 1 free call, or buy a 3-pack.")
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

      sessionStorage.setItem('cupidCall', JSON.stringify({
        ...form,
        voiceId: chosenCharacter.voiceId,
        script,
      }))
      router.push('/preview')
    } catch (err: any) {
      setError(err.message || 'Something went wrong generating your love telegram. Try again?')
      setIsGenerating(false)
    }
  }

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-4xl">💘</div>
      </div>
    )
  }

  return (
    <main className="relative min-h-screen flex flex-col">
      {/* Header */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-4xl mx-auto w-full">
        <a href="/" className="flex items-center gap-2">
          <span className="text-2xl">💘</span>
          <span className="font-fun text-xl font-bold text-white">Cupid Call</span>
        </a>
        <div className="flex items-center gap-3">
          <span className="text-white/40 text-sm font-body">
            {session?.user?.name || session?.user?.email}
          </span>
          <span className="text-white/20">•</span>
          <span className="text-white/40 text-sm">Step {step + 1}/{totalSteps}</span>
        </div>
      </nav>

      {/* Credit bar */}
      <div className="max-w-2xl mx-auto w-full px-6 mb-6">
        <CreditBar credits={credits} hasUsedLoveCode={hasUsedLoveCode} onCreditsUpdated={loadCredits} />
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-6">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className={`step-dot ${i === step ? 'active' : i < step ? 'completed' : 'pending'}`} />
        ))}
      </div>

      {purchaseStatus === 'success' && (
        <div className="max-w-2xl mx-auto w-full px-6 mb-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
            <p className="text-green-400 font-fun">🎉 Payment successful! 3 credits added.</p>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="flex-1 flex items-start justify-center px-6 pb-32">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-2 text-center">
                {stepTitles[step]}
              </h2>

              {/* Step 0: Sign in + age + call info */}
              {step === 0 && (
                <div className="space-y-6 mt-8">
                  <p className="text-white/50 text-center font-body mb-6">
                    Pick your age band first. It unlocks characters automatically.
                  </p>

                  <div>
                    <label className="block text-white/70 font-fun text-sm mb-2">Your age band</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {AGE_OPTIONS.map((age) => (
                        <button
                          key={age.id}
                          onClick={() => update('senderAgeBand', age.id)}
                          className={`style-card text-left ${form.senderAgeBand === age.id ? 'selected' : ''}`}
                        >
                          <p className="font-fun text-white font-bold">{age.label}</p>
                          <p className="text-white/40 text-xs">{age.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/70 font-fun text-sm mb-2">Your Name</label>
                    <input type="text" className="input-cupid" placeholder="The one sending love..."
                      value={form.senderName} onChange={(e) => update('senderName', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-white/70 font-fun text-sm mb-2">Valentine&apos;s Name</label>
                    <input type="text" className="input-cupid" placeholder="The lucky recipient..."
                      value={form.valentineName} onChange={(e) => update('valentineName', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-white/70 font-fun text-sm mb-2">Their Phone Number</label>
                    <input type="tel" className="input-cupid" placeholder="+61 4XX XXX XXX"
                      value={form.valentinePhone} onChange={(e) => update('valentinePhone', e.target.value)} />
                    <p className="text-white/30 text-xs mt-1">Include country code. Australian: +614...</p>
                  </div>
                </div>
              )}

              {/* Step 1: Content type */}
              {step === 1 && (
                <div className="mt-8">
                  <p className="text-white/50 text-center font-body mb-4">
                    What should this call focus on?
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {CONTENT_TYPES.map((ct) => (
                      <button key={ct.id} onClick={() => update('contentType', ct.id)}
                        className={`style-card text-left ${form.contentType === ct.id ? 'selected' : ''}`}>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-2xl">{ct.emoji}</span>
                          <span className="font-fun font-bold text-white text-sm">{ct.name}</span>
                        </div>
                        <p className="text-white/50 text-xs font-body">{ct.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Personal touch */}
              {step === 2 && (
                <div className="space-y-5 mt-8">
                  <p className="text-white/50 text-center font-body mb-6">
                    Add the details only the two of you would understand.
                  </p>
                  <div>
                    <label className="block text-white/70 font-fun text-sm mb-2">
                      Personal touch (max 1000 chars)
                    </label>
                    <textarea
                      className="input-cupid min-h-[170px]"
                      maxLength={1000}
                      placeholder="How you met, inside jokes, what you love about them, pet names, best memories..."
                      value={form.personalTouch}
                      onChange={(e) => update('personalTouch', e.target.value)}
                    />
                    <p className="text-white/30 text-xs mt-1">{personalTouchChars}/1000</p>
                  </div>
                  {form.contentType === 'custom' && (
                    <div>
                      <label className="block text-white/70 font-fun text-sm mb-2">Your core message</label>
                      <textarea
                        className="input-cupid min-h-[90px]"
                        placeholder="Write what you absolutely want included."
                        value={form.customMessage}
                        onChange={(e) => update('customMessage', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Character selection */}
              {step === 3 && (
                <div className="mt-8">
                  <p className="text-white/50 text-center font-body mb-2">
                    Pick your character. Voice and delivery are baked in.
                  </p>
                  <p className="text-white/30 text-center font-body text-xs mb-6">
                    Available now: {availableCharacters.length} of {CHARACTER_OPTIONS.length}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {CHARACTER_OPTIONS.map((character) => {
                      const unlocked = form.senderAgeBand
                        ? isCharacterAvailableForAge(character.id, form.senderAgeBand)
                        : false

                      return (
                        <button
                          key={character.id}
                          onClick={() => unlocked && update('characterId', character.id)}
                          disabled={!unlocked}
                          className={`style-card text-left ${
                            form.characterId === character.id ? 'selected' : ''
                          } ${!unlocked ? 'opacity-45 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center justify-between gap-3 mb-1">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{character.emoji}</span>
                              <span className="font-fun font-bold text-white text-sm">{character.name}</span>
                            </div>
                            <span className="text-[10px] bg-white/10 text-white/70 px-2 py-0.5 rounded-full">
                              {character.ageGateLabel}
                            </span>
                          </div>
                          <p className="text-white/50 text-xs font-body">{character.desc}</p>
                          <p className="text-white/20 text-xs font-body italic mt-1">&ldquo;{character.sample}&rdquo;</p>
                          {!unlocked && (
                            <p className="text-red-300/70 text-[11px] mt-2">Locked by age gate</p>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  {selectedCharacter && (
                    <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                      <p className="text-white/40 text-xs font-body">
                        Selected: <strong className="text-white/70">{selectedCharacter.name}</strong>
                        {' '}with voice <strong className="text-white/70">{selectedCharacter.voiceId}</strong>.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-cupid-dark/90 backdrop-blur-lg border-t border-white/10 px-6 py-4 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => (step > 0 ? setStep(step - 1) : router.push('/'))}
            className="text-white/50 hover:text-white transition-colors font-body">
            ← {step > 0 ? 'Back' : 'Home'}
          </button>
          {error && <p className="text-red-400 text-sm font-body max-w-xs text-center">{error}</p>}
          {step < totalSteps - 1 ? (
            <button onClick={() => setStep(step + 1)} disabled={!canProceed()}
              className={`btn-cupid px-8 py-3 ${!canProceed() ? 'opacity-30 cursor-not-allowed' : ''}`}>
              Next →
            </button>
          ) : (
            <button onClick={handleSubmit}
              disabled={!canProceed() || isGenerating || credits <= 0}
              className={`btn-cupid px-8 py-3 ${!canProceed() || isGenerating || credits <= 0 ? 'opacity-30 cursor-not-allowed' : ''}`}>
              {isGenerating ? (
                <span className="flex items-center gap-2"><span className="animate-spin">💘</span> Generating love...</span>
              ) : credits <= 0 ? '🔒 Need Credits' : '✨ Generate Preview'}
            </button>
          )}
        </div>
      </div>
    </main>
  )
}

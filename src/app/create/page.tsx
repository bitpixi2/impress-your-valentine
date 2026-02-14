'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import CreditBar from '@/components/CreditBar'
import { VOICE_STYLES, CONTENT_TYPES, GROK_VOICES } from '@/lib/types'

interface FormData {
  senderName: string
  valentineName: string
  valentinePhone: string
  howMet: string
  insideJoke: string
  loveAbout: string
  petName: string
  extraDetails: string
  customMessage: string
  style: string
  contentType: string
  voiceId: string
  isExplicit: boolean
}

const INITIAL_FORM: FormData = {
  senderName: '',
  valentineName: '',
  valentinePhone: '',
  howMet: '',
  insideJoke: '',
  loveAbout: '',
  petName: '',
  extraDetails: '',
  customMessage: '',
  style: '',
  contentType: '',
  voiceId: '',
  isExplicit: false,
}

export default function CreatePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [credits, setCredits] = useState(0)
  const [hasUsedLoveCode, setHasUsedLoveCode] = useState(false)
  const [explicitUnlocked, setExplicitUnlocked] = useState(false)

  const totalSteps = 5
  const stepTitles = [
    "Who's Getting Called?",
    'Spill the Tea ☕',
    'What Do You Want to Say?',
    'Pick Your Character',
    'Choose a Voice',
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
    if (searchParams.get('purchase') === 'success') {
      const poll = setInterval(loadCredits, 2000)
      setTimeout(() => clearInterval(poll), 15000)
    }
  }, [searchParams])

  useEffect(() => {
    if (session?.user?.name && !form.senderName) {
      setForm((prev) => ({ ...prev, senderName: session.user!.name || '' }))
    }
  }, [session])

  const update = (field: keyof FormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // Filter styles and content types based on explicit mode
  const availableStyles = VOICE_STYLES.filter(s => !s.explicit || form.isExplicit)
  const availableContentTypes = CONTENT_TYPES.filter(c => !(c as any).explicit || form.isExplicit)

  const canProceed = () => {
    switch (step) {
      case 0: return form.senderName && form.valentineName && form.valentinePhone
      case 1: return form.loveAbout || form.customMessage
      case 2: return form.contentType
      case 3: return form.style
      case 4: return form.voiceId
      default: return false
    }
  }

  const handleSubmit = async () => {
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
        body: JSON.stringify(form),
      })
      if (!scriptRes.ok) throw new Error('Failed to generate script')
      const { script } = await scriptRes.json()

      sessionStorage.setItem('cupidCall', JSON.stringify({ ...form, script }))
      router.push('/preview')
    } catch {
      setError('Something went wrong generating your love telegram. Try again?')
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

      {searchParams.get('purchase') === 'success' && (
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

              {/* Step 0: Basic info */}
              {step === 0 && (
                <div className="space-y-6 mt-8">
                  <p className="text-white/50 text-center font-body mb-6">
                    We won&apos;t call them without your approval first.
                  </p>
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

                  {/* Explicit mode toggle */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-fun text-sm text-white">🔞 After Dark Mode</span>
                        <p className="text-white/30 text-xs mt-1">
                          Unlock spicy &amp; explicit styles. Adults only.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (!explicitUnlocked) {
                            setExplicitUnlocked(true)
                            update('isExplicit', true)
                          } else {
                            update('isExplicit', !form.isExplicit)
                          }
                        }}
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                          form.isExplicit ? 'bg-red-500' : 'bg-white/10'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-transform ${
                          form.isExplicit ? 'translate-x-7' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                    {form.isExplicit && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-red-400/60 text-xs mt-2">
                        ⚠️ By enabling this, you confirm both you and the recipient are 18+
                        and you take full responsibility for the content delivered.
                      </motion.p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 1: Personal details */}
              {step === 1 && (
                <div className="space-y-5 mt-8">
                  <p className="text-white/50 text-center font-body mb-4">
                    The more you share, the more personal it gets.
                  </p>
                  <div>
                    <label className="block text-white/70 font-fun text-sm mb-2">How did you meet? 💫</label>
                    <textarea className="input-cupid min-h-[70px]"
                      placeholder="Bumped into each other at a coffee shop, matched on an app..."
                      value={form.howMet} onChange={(e) => update('howMet', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-white/70 font-fun text-sm mb-2">An inside joke 🤭</label>
                    <textarea className="input-cupid min-h-[70px]"
                      placeholder="That time you accidentally ordered 47 dumplings..."
                      value={form.insideJoke} onChange={(e) => update('insideJoke', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-white/70 font-fun text-sm mb-2">
                      What do you love about them? ❤️ <span className="text-cupid-pink">(required)</span>
                    </label>
                    <textarea className="input-cupid min-h-[70px]"
                      placeholder="Their laugh, the way they steal your chips, their terrible dance moves..."
                      value={form.loveAbout} onChange={(e) => update('loveAbout', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/70 font-fun text-sm mb-2">Pet name? 🐨</label>
                      <input type="text" className="input-cupid" placeholder="Babe, honey, legend..."
                        value={form.petName} onChange={(e) => update('petName', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-white/70 font-fun text-sm mb-2">Anything else?</label>
                      <input type="text" className="input-cupid" placeholder="Loves cats, hates pineapple pizza..."
                        value={form.extraDetails} onChange={(e) => update('extraDetails', e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Content type */}
              {step === 2 && (
                <div className="mt-8">
                  <p className="text-white/50 text-center font-body mb-6">
                    What kind of message do you want to send?
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableContentTypes.map((ct) => (
                      <button key={ct.id} onClick={() => update('contentType', ct.id)}
                        className={`style-card text-left ${form.contentType === ct.id ? 'selected' : ''} ${
                          (ct as any).explicit ? 'border-red-500/30' : ''
                        }`}>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-2xl">{ct.emoji}</span>
                          <span className="font-fun font-bold text-white text-sm">{ct.name}</span>
                        </div>
                        <p className="text-white/50 text-xs font-body">{ct.desc}</p>
                      </button>
                    ))}
                  </div>
                  {form.contentType === 'custom' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4">
                      <label className="block text-white/70 font-fun text-sm mb-2">What do you want to say? 🎨</label>
                      <textarea className="input-cupid min-h-[100px]"
                        placeholder="Write your message idea here — we'll make it shine in your chosen style..."
                        value={form.customMessage} onChange={(e) => update('customMessage', e.target.value)} />
                    </motion.div>
                  )}
                </div>
              )}

              {/* Step 3: Style selection */}
              {step === 3 && (
                <div className="mt-8">
                  <p className="text-white/50 text-center font-body mb-6">
                    Pick the character voice for your telegram
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableStyles.map((style) => (
                      <button key={style.id} onClick={() => update('style', style.id)}
                        className={`style-card text-left ${form.style === style.id ? 'selected' : ''} ${
                          style.explicit ? 'border-red-500/30 hover:border-red-500/60' : ''
                        }`}>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-2xl">{style.emoji}</span>
                          <span className="font-fun font-bold text-white text-sm">{style.name}</span>
                          {style.explicit && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">18+</span>}
                        </div>
                        <p className="text-white/50 text-xs font-body">{style.desc}</p>
                        <p className="text-white/20 text-xs font-body italic mt-1">&ldquo;{style.sample}&rdquo;</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Grok Voice selection */}
              {step === 4 && (
                <div className="mt-8">
                  <p className="text-white/50 text-center font-body mb-2">
                    Choose a Grok voice to deliver your telegram
                  </p>
                  <p className="text-white/30 text-center font-body text-xs mb-6">
                    Powered by xAI&apos;s Voice Agent — real-time AI voice, not pre-recorded
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {GROK_VOICES.map((voice) => (
                      <button key={voice.id} onClick={() => update('voiceId', voice.id)}
                        className={`style-card text-left ${form.voiceId === voice.id ? 'selected' : ''}`}>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-2xl">{voice.emoji}</span>
                          <div>
                            <span className="font-fun font-bold text-white text-sm">{voice.name}</span>
                            <span className="text-white/30 text-xs ml-2">{voice.gender}</span>
                          </div>
                        </div>
                        <p className="text-white/50 text-xs font-body">{voice.desc}</p>
                        <p className="text-white/20 text-xs font-body mt-1">{voice.tone}</p>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <p className="text-white/40 text-xs font-body">
                      💡 The call is <strong className="text-white/60">live AI</strong> — after your telegram plays,
                      your valentine can actually talk back! Grok will have a brief warm conversation before saying goodbye.
                    </p>
                  </div>
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
              ) : credits <= 0 ? '🔒 Need Credits' : '✨ Generate My Telegram'}
            </button>
          )}
        </div>
      </div>
    </main>
  )
}

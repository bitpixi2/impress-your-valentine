'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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
  senderEmail: string
  valentineName: string
  valentinePhone: string
  script: string
  voiceId: GrokVoiceId | ''
}

const INITIAL_FORM: FormData = {
  characterId: '',
  contentType: '',
  personalTouch: '',
  senderEmail: '',
  valentineName: '',
  valentinePhone: '',
  script: '',
  voiceId: '',
}

const STEP_TITLES = ['Choose Your Cupid', 'Add Details', 'Preview', 'Add Credits', 'Delivery']
const REGENERATE_COOLDOWN_SECONDS = 12

const CHARACTER_MENU_IMAGE: Record<CharacterId, { src: string; alt: string }> = {
  'kid-bot': {
    src: '/menu1-kidfriendly.png',
    alt: 'Kid-Friendly character selection',
  },
  'southern-belle': {
    src: '/menu2-lady.png',
    alt: 'Lady character selection',
  },
  'victorian-gentleman': {
    src: '/menu3-gentleman.png',
    alt: 'Gentleman character selection',
  },
  'sakura-confession': {
    src: '/menu4-sakura.png',
    alt: 'Sakura character selection',
  },
  'nocturne-vampire': {
    src: '/menu5-vampire.png',
    alt: 'Vampire character selection',
  },
}

const CONTENT_TYPE_IMAGE: Record<ContentTypeId, { src: string; alt: string }> = {
  'love-poem': {
    src: '/love-poem.jpg',
    alt: 'Love poem module art',
  },
  'miss-you': {
    src: '/miss-you.jpg',
    alt: 'Miss you module art',
  },
  'always-wanted-to-say': {
    src: '/always-wanted-to-say.jpg',
    alt: 'Always wanted to say module art',
  },
  'hype-up': {
    src: '/hype-up.jpg',
    alt: 'Hype up module art',
  },
  apology: {
    src: '/apology.jpg',
    alt: 'Apology module art',
  },
}

const CHARACTER_VOICE_PREVIEW_TEXT: Record<CharacterId, string> = {
  'kid-bot': "Hey, I'm Kid-friendly from Cupid Call. Suitable for children.",
  'southern-belle': "Greetings, I'm Lady from Cupid Call. Happy to be of service.",
  'victorian-gentleman': "Greetings, I'm Gentleman from Cupid Call. Happy to be of service.",
  'nocturne-vampire': "Hey, I'm Vampire from Cupid Call. 18+ only!",
  'sakura-confession': "Hey, I'm Sakura from Cupid Call. 18+ only!",
}

const CHARACTER_VOICE_STYLE_HINT: Record<CharacterId, string> = {
  'kid-bot': 'Playful, bright, child-friendly, crisp pacing.',
  'victorian-gentleman': 'Clear, polished, refined male delivery with elegant articulation.',
  'southern-belle': 'Warm, charming, soft, lightly musical cadence.',
  'nocturne-vampire': 'Deep, handsome, gruff baritone with slow, intimate pacing.',
  'sakura-confession': 'Soft, sincere, feminine delivery with cinematic intimacy.',
}

function countWords(value: string) {
  const text = value.trim()
  if (!text) return 0
  return text.split(/\s+/).filter(Boolean).length
}

export default function CreatePage() {
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [error, setError] = useState('')
  const [voicePreviewError, setVoicePreviewError] = useState('')
  const [credits, setCredits] = useState(0)
  const [purchaseStatus, setPurchaseStatus] = useState('')

  const [isGeneratingScript, setIsGeneratingScript] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [scriptDraft, setScriptDraft] = useState('')
  const [scriptSaveMessage, setScriptSaveMessage] = useState('')
  const [loadingVoiceCharacter, setLoadingVoiceCharacter] = useState<CharacterId | ''>('')
  const [isPlayingVoicePreview, setIsPlayingVoicePreview] = useState(false)
  const [voicePreviewCache, setVoicePreviewCache] = useState<Partial<Record<CharacterId, string>>>({})
  const [activeVoiceCharacter, setActiveVoiceCharacter] = useState<CharacterId | ''>('')
  const [regenerateCooldown, setRegenerateCooldown] = useState(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  const totalSteps = 5
  const shellClass = 'mx-auto w-full max-w-[1320px]'
  const selectedCharacter = useMemo(() => getCharacterById(form.characterId), [form.characterId])
  const personalTouchWords = countWords(form.personalTouch)
  const isScriptDirty = scriptDraft !== form.script

  const loadCredits = async () => {
    try {
      const res = await fetch('/api/credits')
      if (!res.ok) return
      const data = await res.json()
      setCredits(data.remainingCredits)
    } catch {
      // Ignore transient fetch issues.
    }
  }

  useEffect(() => {
    loadCredits()
  }, [])

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
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (regenerateCooldown <= 0) return
    const timer = setInterval(() => {
      setRegenerateCooldown((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [regenerateCooldown])

  const stopVoicePreview = () => {
    if (!audioRef.current) return
    audioRef.current.pause()
    audioRef.current.currentTime = 0
    setIsPlayingVoicePreview(false)
    setActiveVoiceCharacter('')
  }

  const selectCharacter = (characterId: CharacterId) => {
    const character = getCharacterById(characterId)
    setForm((prev) => ({
      ...prev,
      characterId,
      voiceId: character?.voiceId || '',
      script: '',
    }))
    setScriptDraft('')
    setScriptSaveMessage('')
    stopVoicePreview()
    setVoicePreviewError('')
  }

  const updateContentType = (contentType: ContentTypeId) => {
    setForm((prev) => ({ ...prev, contentType, script: '' }))
    setScriptDraft('')
    setScriptSaveMessage('')
    setVoicePreviewError('')
  }

  const updatePersonalTouch = (personalTouch: string) => {
    setForm((prev) => ({ ...prev, personalTouch, script: '' }))
    setScriptDraft('')
    setScriptSaveMessage('')
    setVoicePreviewError('')
  }

  const canContinue = () => {
    if (step === 0) return Boolean(form.characterId)
    if (step === 1) return Boolean(form.contentType) && personalTouchWords <= 500
    if (step === 2) return Boolean(form.script.trim()) && !isScriptDirty
    if (step === 3) return true
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
    if (personalTouchWords > 500) {
      setError('Personal details must be 500 words or less.')
      return
    }

    setIsGeneratingScript(true)
    setError('')
    setVoicePreviewError('')

    try {
      const scriptRes = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: 'Someone special',
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
      setScriptDraft(script)
      setScriptSaveMessage('')
    } catch (err: any) {
      setError(err.message || 'Could not generate script. Please try again.')
    } finally {
      setIsGeneratingScript(false)
    }
  }

  const handleContinue = async () => {
    const scrollToTopOnMobile = () => {
      if (typeof window === 'undefined') return
      if (window.matchMedia('(max-width: 1023px)').matches) {
        window.requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        })
      }
    }

    if (step === 0) {
      setStep(1)
      scrollToTopOnMobile()
      return
    }
    if (step === 1) {
      if (!canContinue()) return
      setStep(2)
      scrollToTopOnMobile()
      if (!form.script) {
        await generateScript()
      }
      return
    }
    if (step === 2) {
      if (!canContinue()) return
      setStep(3)
      scrollToTopOnMobile()
      return
    }
    if (step === 3) {
      if (!canContinue()) return
      setStep(4)
      scrollToTopOnMobile()
    }
  }

  const handleRegenerate = async () => {
    if (isGeneratingScript || regenerateCooldown > 0) return
    setRegenerateCooldown(REGENERATE_COOLDOWN_SECONDS)
    await generateScript()
  }

  const handleSaveScript = () => {
    const nextScript = scriptDraft.trim()
    if (!nextScript) {
      setError('Script cannot be empty.')
      return
    }
    setForm((prev) => ({ ...prev, script: nextScript }))
    setScriptDraft(nextScript)
    setScriptSaveMessage('Saved')
    setError('')
  }

  const previewVoiceForCharacter = async (characterId: CharacterId) => {
    const character = getCharacterById(characterId)
    if (!character) return

    if (isPlayingVoicePreview && activeVoiceCharacter === characterId) {
      stopVoicePreview()
      return
    }

    setVoicePreviewError('')
    let previewDataUrl = voicePreviewCache[characterId] || ''
    const previewScript = CHARACTER_VOICE_PREVIEW_TEXT[characterId]

    try {
      if (!previewDataUrl) {
        setLoadingVoiceCharacter(characterId)
        const res = await fetch('/api/preview-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            script: previewScript,
            characterId,
            voiceId: character.voiceId || form.voiceId || 'Ara',
            styleHint: CHARACTER_VOICE_STYLE_HINT[characterId],
          }),
        })

        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Could not generate voice preview')

        previewDataUrl = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`
        setVoicePreviewCache((prev) => ({ ...prev, [characterId]: previewDataUrl }))
      }

      if (!audioRef.current) {
        audioRef.current = new Audio(previewDataUrl)
        audioRef.current.onended = () => {
          setIsPlayingVoicePreview(false)
          setActiveVoiceCharacter('')
        }
      } else {
        audioRef.current.src = previewDataUrl
      }

      await audioRef.current.play()
      setIsPlayingVoicePreview(true)
      setActiveVoiceCharacter(characterId)
    } catch (err: any) {
      setVoicePreviewError(err.message || 'Voice preview failed.')
      setIsPlayingVoicePreview(false)
      setActiveVoiceCharacter('')
    } finally {
      setLoadingVoiceCharacter('')
    }
  }

  const handlePreviewVoice = async () => {
    if (!selectedCharacter) {
      setVoicePreviewError('Choose a character first.')
      return
    }
    await previewVoiceForCharacter(selectedCharacter.id)
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

    if (!form.senderEmail.trim() || !form.valentineName.trim() || !form.valentinePhone.trim()) {
      setError('Fill in your email, their name, and their phone number.')
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
          senderEmail: form.senderEmail.trim(),
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

  return (
    <main className="relative min-h-screen pb-16">
      <nav className={`${shellClass} flex flex-col items-center px-6 py-8 text-center`}>
        <a href="/" aria-label="Cupid Call home">
          <img
            src="/cupid-call-logo.png"
            alt="Cupid Call"
            className="h-auto w-[234px] max-w-[70vw]"
            loading="eager"
            decoding="async"
          />
        </a>
        <div className="mt-2 text-[12px] uppercase tracking-[0.12em] text-muted">Step {step + 1}</div>
      </nav>

      <section className={`${shellClass} px-6 pb-12 pt-6`}>
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
              <h1 className="text-center font-display text-[52px] italic leading-[1.06] tracking-[0.04em] text-primary md:text-[64px]">
                {STEP_TITLES[step]}
              </h1>

              {step === 0 && (
                <div className="mt-8">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                    {CHARACTER_OPTIONS.map((character) => (
                      <div key={character.id} className="space-y-3">
                        <button
                          onClick={() => selectCharacter(character.id)}
                          aria-label={CHARACTER_MENU_IMAGE[character.id].alt}
                          className="character-choice-btn"
                        >
                          <div className={`character-choice-ring ${form.characterId === character.id ? 'selected' : ''}`}>
                            <img
                              src={CHARACTER_MENU_IMAGE[character.id].src}
                              alt={CHARACTER_MENU_IMAGE[character.id].alt}
                              className="character-choice-img"
                              loading="lazy"
                            />
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => previewVoiceForCharacter(character.id)}
                          className={`btn-secondary w-full ${loadingVoiceCharacter === character.id ? 'btn-loading-fill' : ''}`}
                          disabled={Boolean(loadingVoiceCharacter && loadingVoiceCharacter !== character.id)}
                        >
                          {loadingVoiceCharacter === character.id
                            ? 'Loading...'
                            : isPlayingVoicePreview && activeVoiceCharacter === character.id
                              ? 'Pause Voice'
                              : 'Play Voice'}
                        </button>
                      </div>
                    ))}
                  </div>
                  {voicePreviewError && <p className="mt-4 text-[12px] text-[var(--age-red)]">{voicePreviewError}</p>}
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
                          className={`style-card style-card-bleed text-left ${form.contentType === ct.id ? 'selected' : ''}`}
                        >
                          <div>
                            <img
                              src={CONTENT_TYPE_IMAGE[ct.id].src}
                              alt={CONTENT_TYPE_IMAGE[ct.id].alt}
                              className="h-[120px] w-full object-cover"
                              loading="lazy"
                            />
                            <div className="px-4 pb-4 pt-3">
                              <p className="text-[15px] font-medium text-primary">{ct.name}</p>
                              <p className="mt-1 text-[13px] leading-[1.7] text-muted">{ct.desc}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-[12px] uppercase tracking-[0.12em] text-muted">
                      Personal details (500 words maximum)
                    </label>
                    <textarea
                      className="input-cupid min-h-[240px]"
                      value={form.personalTouch}
                      onChange={(e) => updatePersonalTouch(e.target.value)}
                      placeholder="How you met, inside jokes, what you love, pet names, memories..."
                    />
                    <p className={`mt-2 text-right text-[12px] ${personalTouchWords > 500 ? 'text-[var(--age-red)]' : 'text-muted'}`}>
                      {personalTouchWords}/500 words
                    </p>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="mt-8">
                  {isGeneratingScript && !form.script ? (
                    <div className="rounded-[12px] border border-[var(--surface-border)] bg-[var(--surface-bg)] px-6 py-12 text-center">
                      <img
                        src="/loader.png"
                        alt="Loading"
                        className="loader-float mx-auto h-20 w-20 object-contain"
                        loading="eager"
                        decoding="async"
                      />
                      <p className="mt-3 text-[14px] text-muted">Loading...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                      <div className="space-y-5">
                        {selectedCharacter && (
                          <div className="space-y-4">
                            <div className="character-choice-ring mx-auto w-full max-w-[240px]">
                              <img
                                src={CHARACTER_MENU_IMAGE[selectedCharacter.id].src}
                                alt={CHARACTER_MENU_IMAGE[selectedCharacter.id].alt}
                                className="character-choice-img"
                                loading="lazy"
                              />
                            </div>
                            <p className="text-[14px] leading-[1.8] text-muted">
                              {CHARACTER_VOICE_PREVIEW_TEXT[selectedCharacter.id]}
                            </p>
                            <button
                              onClick={handlePreviewVoice}
                              disabled={Boolean(loadingVoiceCharacter && loadingVoiceCharacter !== selectedCharacter.id)}
                              className={`btn-secondary min-w-[190px] ${
                                loadingVoiceCharacter === selectedCharacter.id ? 'btn-loading-fill' : ''
                              }`}
                            >
                              {loadingVoiceCharacter === selectedCharacter.id
                                ? 'Loading...'
                                : isPlayingVoicePreview && activeVoiceCharacter === selectedCharacter.id
                                  ? 'Pause Voice'
                                  : 'Play Voice'}
                            </button>
                          </div>
                        )}

                        {voicePreviewError && <p className="text-[12px] text-[var(--age-red)]">{voicePreviewError}</p>}
                      </div>

                      <div>
                        <label className="mb-2 block text-[12px] uppercase tracking-[0.12em] text-muted">
                          Script
                        </label>
                        <textarea
                          className="input-cupid min-h-[920px] md:min-h-[620px] lg:min-h-[620px]"
                          value={scriptDraft}
                          onChange={(e) => {
                            setScriptDraft(e.target.value)
                            setScriptSaveMessage('')
                          }}
                          placeholder="Your generated script appears here."
                        />
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                          <button
                            onClick={handleRegenerate}
                            disabled={isGeneratingScript || regenerateCooldown > 0}
                            className="btn-secondary w-full sm:w-auto sm:min-w-[190px]"
                          >
                            {isGeneratingScript
                              ? 'Loading...'
                              : regenerateCooldown > 0
                                ? `Re-generate (${regenerateCooldown}s)`
                                : 'Re-generate'}
                          </button>
                          <button
                            onClick={handleSaveScript}
                            disabled={!isScriptDirty}
                            className="btn-save w-full sm:w-auto sm:min-w-[160px]"
                          >
                            Save
                          </button>
                        </div>
                        {isScriptDirty && <p className="mt-2 text-[12px] text-[var(--age-amber)]">Unsaved changes.</p>}
                        {scriptSaveMessage && <p className="mt-2 text-[12px] text-[var(--age-green)]">{scriptSaveMessage}</p>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="mx-auto mt-8 w-full max-w-[760px]">
                  <CreditBar credits={credits} onCreditsUpdated={loadCredits} />
                </div>
              )}

              {step === 4 && (
                <div className="mx-auto mt-8 w-full max-w-[760px]">
                  <div className="space-y-4 rounded-[12px] border border-[var(--surface-border)] bg-[var(--surface-bg)] p-6">
                    <div>
                      <label className="mb-2 block text-[12px] uppercase tracking-[0.12em] text-muted">Your email</label>
                      <input
                        type="email"
                        className="input-cupid"
                        value={form.senderEmail}
                        onChange={(e) => setForm((prev) => ({ ...prev, senderEmail: e.target.value }))}
                        placeholder="you@example.com"
                      />
                    </div>
                    <p className="text-[12px] leading-[1.6] text-muted">
                      We won&apos;t show this to your valentine. It&apos;s used for credit tracking and fraud controls.
                    </p>
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

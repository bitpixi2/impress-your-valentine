'use client'

import { useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { motion } from 'framer-motion'

export default function SignInPage() {
  const [callbackUrl, setCallbackUrl] = useState('/create')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const nextCallback = params.get('callbackUrl')
    if (nextCallback) {
      setCallbackUrl(nextCallback)
    }
  }, [])

  const handleQuickSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setIsLoading(true)
    await signIn('credentials', {
      email,
      name,
      callbackUrl,
    })
  }

  return (
    <main className="min-h-screen px-6 py-14">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="wizard-shell surface-card"
      >
        <div className="text-center">
          <p className="text-[12px] uppercase tracking-[0.14em] text-gold">Account Access</p>
          <h1 className="mt-4 font-display text-[52px] italic leading-[1.08] tracking-[0.04em] text-primary">
            Sign in to continue
          </h1>
          <p className="mt-3 text-[14px] text-muted">
            We use sign-in only for call credits and purchase history.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <button
            onClick={() => signIn('google', { callbackUrl })}
            className="btn-secondary w-full border-[rgba(255,255,255,0.12)] text-primary"
          >
            Continue with Google
          </button>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--surface-border)]" />
            </div>
            <div className="relative flex justify-center text-[12px] uppercase tracking-[0.12em] text-muted">
              <span className="bg-[var(--bg-main)] px-4">or email sign in</span>
            </div>
          </div>

          <form onSubmit={handleQuickSignIn} className="space-y-4">
            <div>
              <label className="mb-2 block text-[12px] uppercase tracking-[0.12em] text-muted">Your name</label>
              <input
                type="text"
                className="input-cupid"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-[12px] uppercase tracking-[0.12em] text-muted">Email</label>
              <input
                type="email"
                className="input-cupid"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={!email || isLoading} className="btn-cupid w-full">
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-[12px] text-muted">
            We do not send promotional emails.
          </p>
        </div>

        <div className="mt-7 text-center">
          <a href="/" className="text-[13px] text-muted hover:text-primary">
            Back to home
          </a>
        </div>
      </motion.div>
    </main>
  )
}

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
    <main className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">💘</div>
          <h1 className="font-display text-3xl font-bold">Sign In to Cupid Call</h1>
          <p className="text-white/50 font-body mt-2">
            Quick sign in to start sending love telegrams
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 space-y-6">
          {/* Google OAuth */}
          <button
            onClick={() => signIn('google', { callbackUrl })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-gray-800 font-bold hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-cupid-dark px-4 text-white/30">or quick sign in</span>
            </div>
          </div>

          {/* Email quick sign in */}
          <form onSubmit={handleQuickSignIn} className="space-y-4">
            <div>
              <label className="block text-white/70 font-fun text-sm mb-2">Your Name</label>
              <input
                type="text"
                className="input-cupid"
                placeholder="Romeo..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-white/70 font-fun text-sm mb-2">Email</label>
              <input
                type="email"
                className="input-cupid"
                placeholder="romeo@montague.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={!email || isLoading}
              className={`btn-cupid w-full py-3 ${!email || isLoading ? 'opacity-30' : ''}`}
            >
              {isLoading ? '💘 Signing in...' : '💘 Sign In & Start'}
            </button>
          </form>

          <p className="text-white/20 text-xs text-center">
            We just need this to track your credits. No spam, ever.
          </p>
        </div>

        <div className="text-center mt-6">
          <a href="/" className="text-white/40 hover:text-white transition-colors text-sm">
            ← Back to home
          </a>
        </div>
      </motion.div>
    </main>
  )
}

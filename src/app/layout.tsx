import type { Metadata } from 'next'
import AuthProvider from '@/components/AuthProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cupid Call | Premium AI Valentine Voice Telegrams',
  description: 'Impress your Valentine with a personalized AI-powered phone call. Pick an age-gated character, add private details, and send a live Grok voice telegram.',
  openGraph: {
    title: 'Cupid Call | Voice Telegrams',
    description: 'Send your Valentine a personalized AI love telegram — straight to their phone.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="noise-overlay gradient-mesh min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}

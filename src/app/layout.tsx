import type { Metadata } from 'next'
import AuthProvider from '@/components/AuthProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cupid Call 💘 Send Your Valentine an AI Love Telegram',
  description: 'Impress your Valentine with a personalized AI-powered phone call. Choose a voice, pick a style, add personal details only you\'d know. From the Sophiie AI Hackathon.',
  openGraph: {
    title: 'Cupid Call 💘 AI Love Telegrams',
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

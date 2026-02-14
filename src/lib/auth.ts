import { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getOrCreateUser } from '@/lib/credits'

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    // Simple email "auth" for hackathon demo — no actual verification
    // In production, use email magic link provider
    CredentialsProvider({
      name: 'Quick Sign In',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
        name: { label: 'Name', type: 'text', placeholder: 'Your name' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null
        // For hackathon: auto-approve any email
        return {
          id: credentials.email,
          email: credentials.email,
          name: credentials.name || credentials.email.split('@')[0],
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id || user.email
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).userId = token.userId as string
        if (token.userId && session.user.email) {
          getOrCreateUser(token.userId as string, session.user.email)
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'cupid-call-hackathon-secret-2026',
}

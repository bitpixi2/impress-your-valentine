# 💘 Cupid Call — AI Love Telegram Phone Calls

> Send your Valentine a personalized AI love telegram — straight to their phone.
> Built for the Sophiie AI Hackathon 2026 (Feb 14-15).

## What is it?

Cupid Call lets you craft a deeply personal love message using your relationship details, pick a character style (Cowboy, Wizard, Southern Belle, 1800s Literature...), choose a voice, and have it delivered as a **live AI phone call**.

The recipient can even **talk back** — the AI will have a brief warm conversation before saying goodbye.

### 🔞 After Dark Mode
Unlock **Spicy** and **X-Rated** styles for explicitly romantic content. Grok doesn't hold back.

## Tech Stack

- **Frontend:** Next.js 14 + React + TypeScript + Tailwind + Framer Motion
- **Script Gen:** xAI Grok text API (replaces OpenAI)
- **Voice:** xAI Grok Voice Agent — real-time WebSocket (replaces ElevenLabs)
- **Phone:** Twilio + WebSocket Media Streams
- **Payments:** Stripe Checkout ($10 AUD / 3-pack)
- **Auth:** NextAuth (Google + quick email)
- **Promo:** Code LOVE = 1 free call

One xAI key replaces both OpenAI + ElevenLabs. $0.05/min flat rate.

## Setup

```bash
# 1. Frontend
npm install && cp .env.example .env && npm run dev

# 2. Bridge server (separate terminal)
cd server && npm install && npm run dev

# 3. Public URL for Twilio
ngrok http 8081  # Copy URL to BRIDGE_DOMAIN in .env

# 4. Stripe webhooks
stripe listen --forward-to localhost:3000/api/webhook
```

## Grok Voices

Ara (warm female), Rex (confident male), Sal (smooth neutral), Eve (energetic female), Leo (authoritative male)

## Viral Loop

Every call ends with: "Use code LOVE at cupidcall.com for 1 free call back!"

# Participant

| Field | Your Answer |
|---|---|
| Name | Kasey Robinson |
| University / Employer | Unemployed |

# Project

| Field | Your Answer |
|---|---|
| Project Name | Cupid Call |
| One-Line Description | AI-generated Valentine phone calls delivered live with a character voice. |
| Demo Video Link | _Add your demo link here_ |
| Tech Stack | Next.js 14, React, TypeScript, Tailwind CSS, NextAuth, Stripe, Twilio, Fastify WebSocket bridge |
| AI Provider(s) Used | xAI Grok (text + voice/realtime) |

# About Your Project

## What does it do?

Cupid Call lets a user create a personalized Valentine telegram and deliver it as a live AI phone call.  
The user chooses a content type, adds private relationship details, selects a character persona, previews the generated script, and sends the call.

## How does the interaction work?

The sender signs in, picks an age band, fills in message context, and chooses one of five character personas.  
The app generates a script with Grok, shows a preview, and when approved it triggers a Twilio outbound call.  
A realtime bridge streams audio between Twilio and Grok Voice so the recipient can hear the telegram and speak back briefly.

## What makes it special?

It combines high-personalization text generation with live voice interaction in a single flow.  
Age-gated character options and scripted call framing make the experience feel playful, memorable, and safe by design.

## How to run it

```bash
# Example:
# git clone <your-repo>
# cd <your-project>
# npm install
# cp .env.example .env  # add your API keys
# npm start
```

## Architecture / Technical Notes

Frontend/API runs on Next.js. Checkout and webhook handling use Stripe.  
Phone calls use Twilio. Realtime two-way voice uses a separate WebSocket bridge service (`server/bridge.ts`) that connects Twilio Media Streams to xAI Realtime Voice.

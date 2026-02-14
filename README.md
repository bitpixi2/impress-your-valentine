# Participant

| Field | Your Answer |
|---|---|
| Name | Kasey Robinson |
| University / Employer | fUnemployed |

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

The sender signs in, fills in message intent, and chooses one of five character personas.  
The app generates a script with Grok, shows a preview, and when approved it triggers a Twilio outbound call.  
A realtime bridge streams audio between Twilio and Grok Voice so the recipient can hear the telegram and speak back briefly.  
The viral loop adds SMS touchpoints: one text 5 minutes before the call to increase pickup/recording behavior, and one text 5 minutes after the call with code LOVE to drive referral sends.

## What makes it special?

It combines high-personalization text generation with live voice interaction in a single flow.  
Age-gated character options and scripted call framing make the experience feel playful, memorable, and safe by design.

## How to run it

How to Use Cupid Call:

1. Go to https://cupidcall.bitpixi.com
2. Sign in with Google or email
3. Use code LOVE to get your first call free
4. Fill in your valentine's details, pick a character, preview the script
5. Hit send, and their phone rings with a live AI love telegram
6. Want more? Grab a 3-pack for $10 AUD

## Viral Loop

Five minutes before the call, your valentine gets a text:  
"💘 A Cupid Call is on its way. You might want to pick up and hit record."

Five minutes after the call ends, they get another:  
"💘 Enjoyed Cupid Call? Send one 1 free with code LOVE at https://cupidcall.bitpixi.com. Reply STOP to opt out."

That's the loop for one call to become more. 92% of people trust recommendations from someone they know over any ad, and word of mouth drives 5x more sales than paid media.

## Architecture / Technical Notes

Frontend/API runs on Next.js. Checkout and webhook handling use Stripe.  
Phone calls and viral-loop SMS use Twilio. Realtime two-way voice uses a separate WebSocket bridge service (`server/bridge.ts`) that connects Twilio Media Streams to xAI Realtime Voice.  
Viral loop behavior is two scheduled SMS events per successful send: pre-call alert (+5 min before call) and post-call referral message (+5 min after call end, includes code LOVE and opt-out language).

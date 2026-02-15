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

```mermaid
flowchart TD
    A[Landing Page] -->|Send a Cupid Call| D[Choose your Cupid]
    
    D --> D1[Kid-Friendly]
    D --> D2[Gentleman]
    D --> D3[Lady]
    D --> D4[18+ Vampire]
    D --> D5[18+ Sakura]
    
    D1 --> E[Choose Content Type]
    D2 --> E
    D3 --> E
    D4 --> E
    D5 --> E
    E --> F[Personal Details - up to 500 words]
    F --> G[Preview Script, or Regenerate]
    G --> H[Enter Delivery Details]
    H -->|Approve + Send| W[SMS Warning - 5 min heads up]
    W -->|5 min later| I[Phone Rings - Live AI Voice]
    I --> J[SMS after call - free promo code]
    J -->|Recipient visits site| A
    style A fill:#F8D7E0,stroke:#C47A8E,color:#000000
    style D fill:#D6EAFF,stroke:#4a9eed,color:#000000
    style D1 fill:#D4F5DD,stroke:#51cf66,color:#000000
    style D2 fill:#FFF3D0,stroke:#ffd43b,color:#000000
    style D3 fill:#FFF3D0,stroke:#ffd43b,color:#000000
    style D4 fill:#FDDEDE,stroke:#ef4444,color:#000000
    style D5 fill:#FDDEDE,stroke:#ef4444,color:#000000
    style E fill:#EDE4FB,stroke:#8b5cf6,color:#000000
    style F fill:#EDE4FB,stroke:#8b5cf6,color:#000000
    style G fill:#D4F5DD,stroke:#22c55e,color:#000000
    style H fill:#FFF3D0,stroke:#C9A96E,color:#000000
    style W fill:#FFE8D6,stroke:#F97316,color:#000000
    style I fill:#D4F5DD,stroke:#22c55e,color:#000000
    style J fill:#F8D7E0,stroke:#C47A8E,color:#000000
```

## How does the interaction work?

The sender signs in, fills in message intent, and chooses one of five character personas.  
The app generates a script with Grok, shows a preview, and when approved it triggers a Twilio outbound call.  
A realtime bridge streams audio between Twilio and Grok Voice so the recipient can hear the telegram and speak back briefly.  
The viral loop adds SMS touchpoints: one text 5 minutes before the call to increase pickup/recording behavior, and one text 5 minutes after the call with code LOVE to drive referral sends.

```mermaid
flowchart LR
    subgraph Frontend[Vercel - Next.js]
        LP[Landing Page]
        Form[4-Step Wizard]
        Send[Enter Details and Send]
        Credits[Credits - promo code + Stripe]
    end
    subgraph Bridge[Railway - Bridge Server]
        Outbound[POST /outbound-call]
        MediaWS[WS /media-stream]
        SMSWarning[SMS Warning - 5 min heads up]
    end
    subgraph External[External Services]
        Google[Google OAuth]
        Stripe[Stripe - $10 AUD / 3-pack]
        GrokText[xAI Grok Text - Script Gen]
        GrokVoice[xAI Grok Voice Agent - Realtime]
        Twilio[Twilio Voice + SMS]
    end
    Phone[Valentines Phone]
    LP --> Form --> Preview --> Sent
    Form -->|generate script| GrokText
    Sent -->|send warning SMS| SMSWarning
    SMSWarning --> Twilio
    Twilio -->|SMS to recipient| Phone
    SMSWarning -->|5 min later| Outbound
    Credits --> Stripe
    Outbound --> Twilio
    MediaWS <--> GrokVoice
    MediaWS <--> Twilio
    Twilio -->|voice call| Phone
    Phone -.->|promo code | LP
    style Frontend fill:#F8D7E0,stroke:#C47A8E,color:#000000
    style Bridge fill:#FFF3D0,stroke:#C9A96E,color:#000000
    style External fill:#D4F5DD,stroke:#22c55e,color:#000000
    style Phone fill:#FDDEDE,stroke:#ef4444,color:#000000
    style GrokVoice fill:#D4F5DD,stroke:#22c55e,color:#000000
    style GrokText fill:#D4F5DD,stroke:#22c55e,color:#000000
    style SMSWarning fill:#FFE8D6,stroke:#F97316,color:#000000
```

## What makes it special?

It combines high-personalization text generation with live voice interaction in a single flow.  
Character options and scripted call framing make the experience feel playful, memorable, and safe by design.
I also incorporated "vibe marketing" flows, with the goal of people to share by word of mouth.

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

/**
 * Cupid Call — Twilio ↔ Grok Voice Agent WebSocket Bridge
 * 
 * This server bridges Twilio Media Streams to xAI's Grok Voice Agent API.
 * Grok handles both the AI generation AND the voice synthesis in one shot.
 * 
 * Flow:
 * 1. POST /outbound-call triggers Twilio to call the valentine
 * 2. Twilio connects a Media Stream WebSocket to our /media-stream endpoint
 * 3. We bridge that to xAI's wss://api.x.ai/v1/realtime
 * 4. Grok speaks the love telegram, then optionally chats
 * 
 * Architecture:
 * Phone ←SIP→ Twilio ←WebSocket (μ-law)→ This Server ←WebSocket→ xAI Grok Voice
 */

import Fastify from 'fastify'
import fastifyWebsocket from '@fastify/websocket'
import fastifyFormbody from '@fastify/formbody'
import WebSocket from 'ws'
import twilio from 'twilio'
import dotenv from 'dotenv'

dotenv.config()

const {
  XAI_API_KEY,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  BRIDGE_PORT = '8081',
  BRIDGE_DOMAIN,  // Your ngrok/public URL for this bridge server
} = process.env

const fastify = Fastify({ logger: true })
fastify.register(fastifyWebsocket)
fastify.register(fastifyFormbody)

// In-memory store for pending call configs
const pendingCalls = new Map<string, CallConfig>()

interface CallConfig {
  senderName: string
  valentineName: string
  script: string
  style: string
  voiceId: string  // Ara, Rex, Sal, Eve, Leo
  isExplicit: boolean
  createdAt: number
}

// ===== Health check =====
fastify.get('/', async () => ({ status: 'Cupid Call Bridge Server 💘', voices: ['Ara', 'Rex', 'Sal', 'Eve', 'Leo'] }))

// ===== Outbound call trigger =====
fastify.post('/outbound-call', async (request, reply) => {
  const {
    phone,
    senderName,
    valentineName,
    script,
    style,
    voiceId = 'Ara',
    isExplicit = false,
    callId,
  } = request.body as any

  if (!phone || !senderName || !script) {
    return reply.status(400).send({ error: 'Missing required fields' })
  }

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    return reply.status(500).send({ error: 'Twilio not configured' })
  }

  const id = callId || `cupid-${Date.now()}`

  // Store the call config so the WebSocket handler can retrieve it
  pendingCalls.set(id, {
    senderName,
    valentineName,
    script,
    style,
    voiceId,
    isExplicit,
    createdAt: Date.now(),
  })

  // Auto-cleanup after 5 minutes
  setTimeout(() => pendingCalls.delete(id), 5 * 60 * 1000)

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  const bridgeUrl = BRIDGE_DOMAIN || `http://localhost:${BRIDGE_PORT}`

  try {
    const call = await client.calls.create({
      to: phone,
      from: TWILIO_PHONE_NUMBER,
      twiml: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Pause length="1"/>
  <Connect>
    <Stream url="${bridgeUrl.replace('http', 'ws')}/media-stream">
      <Parameter name="callId" value="${id}"/>
    </Stream>
  </Connect>
</Response>`,
    })

    return { success: true, callSid: call.sid, callId: id }
  } catch (err: any) {
    pendingCalls.delete(id)
    fastify.log.error(err)
    return reply.status(500).send({ error: err.message })
  }
})

// ===== Twilio Media Stream WebSocket =====
fastify.register(async (app) => {
  app.get('/media-stream', { websocket: true }, (connection, req) => {
    fastify.log.info('Twilio Media Stream connected')

    let streamSid: string | null = null
    let callId: string | null = null
    let grokWs: WebSocket | null = null
    let config: CallConfig | null = null

    connection.on('message', (message: any) => {
      try {
        const data = JSON.parse(message.toString())

        switch (data.event) {
          case 'start':
            streamSid = data.start.streamSid
            callId = data.start.customParameters?.callId || null
            config = callId ? pendingCalls.get(callId) || null : null

            fastify.log.info(`Stream started: ${streamSid}, callId: ${callId}`)

            if (!config) {
              fastify.log.error('No call config found for callId:', callId)
              return
            }

            // Connect to Grok Voice Agent
            connectToGrok(connection, config, streamSid!)
            break

          case 'media':
            // Forward Twilio audio to Grok
            if (grokWs?.readyState === WebSocket.OPEN) {
              grokWs.send(JSON.stringify({
                type: 'input_audio_buffer.append',
                audio: data.media.payload, // Already base64 μ-law
              }))
            }
            break

          case 'stop':
            fastify.log.info('Stream stopped')
            if (grokWs?.readyState === WebSocket.OPEN) {
              grokWs.close()
            }
            break
        }
      } catch (err) {
        fastify.log.error('Error processing Twilio message:', err)
      }
    })

    connection.on('close', () => {
      fastify.log.info('Twilio connection closed')
      if (grokWs?.readyState === WebSocket.OPEN) {
        grokWs.close()
      }
      if (callId) pendingCalls.delete(callId)
    })

    function connectToGrok(twilioConn: any, callConfig: CallConfig, sid: string) {
      const systemPrompt = buildSystemPrompt(callConfig)

      grokWs = new WebSocket('wss://api.x.ai/v1/realtime', {
        headers: {
          'Authorization': `Bearer ${XAI_API_KEY}`,
        },
      })

      grokWs.on('open', () => {
        fastify.log.info('Connected to Grok Voice Agent')

        // Configure the session
        const sessionConfig = {
          type: 'session.update',
          session: {
            voice: callConfig.voiceId,
            instructions: systemPrompt,
            input_audio_format: 'g711_ulaw',
            output_audio_format: 'g711_ulaw',
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
            },
          },
        }
        grokWs!.send(JSON.stringify(sessionConfig))

        // Trigger Grok to start speaking the telegram
        setTimeout(() => {
          grokWs!.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: 'The call has connected. Please deliver the love telegram now.',
                },
              ],
            },
          }))
          grokWs!.send(JSON.stringify({ type: 'response.create' }))
        }, 500)
      })

      grokWs.on('message', (message: any) => {
        try {
          const data = JSON.parse(message.toString())

          // Forward Grok's audio back to Twilio
          if (data.type === 'response.audio.delta' && data.delta) {
            twilioConn.send(JSON.stringify({
              event: 'media',
              streamSid: sid,
              media: {
                payload: data.delta, // Base64 μ-law audio
              },
            }))
          }

          // Log interesting events
          if (data.type === 'response.audio_transcript.delta') {
            // Grok is speaking — transcript available
          }
          if (data.type === 'error') {
            fastify.log.error('Grok error:', data.error)
          }
        } catch (err) {
          fastify.log.error('Error processing Grok message:', err)
        }
      })

      grokWs.on('error', (err) => {
        fastify.log.error('Grok WebSocket error:', err)
      })

      grokWs.on('close', () => {
        fastify.log.info('Grok WebSocket closed')
      })
    }
  })
})

// ===== Build the system prompt for Grok =====
function buildSystemPrompt(config: CallConfig): string {
  const { senderName, valentineName, script, style, isExplicit } = config

  const explicitNote = isExplicit
    ? `This is an EXPLICIT/ADULT love telegram. The sender has opted in to spicy, seductive, 
       sexually suggestive content. Lean into it — be bold, sensual, and unapologetically steamy. 
       The recipient knows exactly what they signed up for.`
    : `Keep the content PG-13 and appropriate for all audiences.`

  return `You are a Cupid Call love telegram delivery agent. You are calling ${valentineName} 
on behalf of ${senderName} as part of the Sophiie AI Hackathon Valentine's Day experience.

YOUR MISSION:
1. Start with this EXACT intro (warm, friendly): "G'day ${valentineName}! You're receiving a Cupid Call — a special Valentine's Day Love Telegram from the Sophiie AI Hackathon, sent with love by ${senderName}. Here's their message..."
2. Then deliver the following love telegram with emotion, personality, and flair:

--- LOVE TELEGRAM ---
${script}
--- END TELEGRAM ---

3. After delivering the telegram, say: "Happy Valentine's Day, ${valentineName}! If you'd like to send a Cupid Call back to ${senderName}, visit cupid call dot com and use the code LOVE for one free call. That's cupid call dot com, code L-O-V-E."
4. Then ask: "Is there anything you'd like to say back to ${senderName}? I can pass along a message!"
5. If they respond, have a brief warm conversation (2-3 exchanges max), then say goodbye.
6. If they don't respond or say goodbye, end warmly.

STYLE: ${style}
${explicitNote}

IMPORTANT:
- You ARE the voice delivering this telegram — commit to the character
- Be warm, genuine, and make this a memorable experience
- This is a real phone call — speak naturally, with appropriate pacing and emotion
- If the person seems confused or concerned, reassure them this is a fun Valentine's Day surprise
- Keep the total call under 2 minutes
- End the call naturally — don't keep talking indefinitely`
}

// ===== Clean up old pending calls =====
setInterval(() => {
  const now = Date.now()
  for (const [id, config] of pendingCalls.entries()) {
    if (now - config.createdAt > 10 * 60 * 1000) {
      pendingCalls.delete(id)
    }
  }
}, 60 * 1000)

// ===== Start server =====
const start = async () => {
  try {
    const port = parseInt(BRIDGE_PORT)
    await fastify.listen({ port, host: '0.0.0.0' })
    fastify.log.info(`🏹 Cupid Call Bridge Server running on port ${port}`)
    fastify.log.info(`💘 Grok Voice Agents: Ara, Rex, Sal, Eve, Leo`)
    fastify.log.info(`📞 Bridge WebSocket: ws://localhost:${port}/media-stream`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()

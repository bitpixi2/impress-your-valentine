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
  PORT,
  BRIDGE_PORT = '8081',
  BRIDGE_DOMAIN,  // Your ngrok/public URL for this bridge server
} = process.env

const PRE_CALL_SMS_LEAD_MINUTES = parseMinutes(process.env.PRE_CALL_SMS_LEAD_MINUTES, 5)
const POST_CALL_SMS_DELAY_MINUTES = parseMinutes(process.env.POST_CALL_SMS_DELAY_MINUTES, 5)
const PENDING_CALL_TTL_MS = Math.max(PRE_CALL_SMS_LEAD_MINUTES + POST_CALL_SMS_DELAY_MINUTES + 15, 20) * 60 * 1000
const PRE_CALL_SMS_BODY = '💘 A Cupid Call is on its way. You might want to pick up and hit record.'
const POST_CALL_SMS_BODY = '💘 Enjoyed Cupid Call? Send one 1 free with code LOVE at https://cupidcall.bitpixi.com. Reply STOP to opt out.'
const PREVIEW_AUDIO_SAMPLE_RATE = parsePositiveInt(process.env.PREVIEW_AUDIO_SAMPLE_RATE, 24000)
const PREVIEW_AUDIO_TIMEOUT_MS = parsePositiveInt(process.env.PREVIEW_AUDIO_TIMEOUT_MS, 22000)

const fastify = Fastify({ logger: true })
fastify.register(fastifyWebsocket)
fastify.register(fastifyFormbody)

// In-memory store for pending call configs
const pendingCalls = new Map<string, CallConfig>()
const callLookupBySid = new Map<string, { callId: string; phone: string; senderName: string; valentineName: string; createdAt: number }>()
const postCallTextScheduled = new Set<string>()

interface CallConfig {
  senderName: string
  valentineName: string
  script: string
  characterId: string
  voiceId: string  // Ara, Rex, Sal, Eve, Leo
  createdAt: number
}

function parseMinutes(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || '', 10)
  if (!Number.isFinite(parsed) || parsed < 0) return fallback
  return parsed
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || '', 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return parsed
}

function callStartDelayMs(): number {
  return PRE_CALL_SMS_LEAD_MINUTES * 60 * 1000
}

function pcm16ToWav(pcmData: Buffer, sampleRate: number): Buffer {
  const channels = 1
  const bitsPerSample = 16
  const byteRate = sampleRate * channels * (bitsPerSample / 8)
  const blockAlign = channels * (bitsPerSample / 8)

  const wav = Buffer.alloc(44 + pcmData.length)
  wav.write('RIFF', 0)
  wav.writeUInt32LE(36 + pcmData.length, 4)
  wav.write('WAVE', 8)
  wav.write('fmt ', 12)
  wav.writeUInt32LE(16, 16) // PCM subchunk size
  wav.writeUInt16LE(1, 20) // Audio format = PCM
  wav.writeUInt16LE(channels, 22)
  wav.writeUInt32LE(sampleRate, 24)
  wav.writeUInt32LE(byteRate, 28)
  wav.writeUInt16LE(blockAlign, 32)
  wav.writeUInt16LE(bitsPerSample, 34)
  wav.write('data', 36)
  wav.writeUInt32LE(pcmData.length, 40)
  pcmData.copy(wav, 44)

  return wav
}

function synthesizePreviewAudio(script: string, voiceId: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    if (!XAI_API_KEY) {
      reject(new Error('XAI_API_KEY is not configured'))
      return
    }

    const ws = new WebSocket('wss://api.x.ai/v1/realtime', {
      headers: { Authorization: `Bearer ${XAI_API_KEY}` },
    })

    const pcmChunks: Buffer[] = []
    let settled = false
    let receivedAudio = false
    let timeoutHandle: NodeJS.Timeout | null = null
    let idleHandle: NodeJS.Timeout | null = null

    const clearTimers = () => {
      if (timeoutHandle) clearTimeout(timeoutHandle)
      if (idleHandle) clearTimeout(idleHandle)
      timeoutHandle = null
      idleHandle = null
    }

    const finalize = (err?: Error) => {
      if (settled) return
      settled = true
      clearTimers()
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }

      if (err) {
        reject(err)
        return
      }

      if (!pcmChunks.length) {
        reject(new Error('No audio generated for preview'))
        return
      }

      const wav = pcm16ToWav(Buffer.concat(pcmChunks), PREVIEW_AUDIO_SAMPLE_RATE)
      resolve(wav)
    }

    const refreshIdle = () => {
      if (idleHandle) clearTimeout(idleHandle)
      idleHandle = setTimeout(() => {
        if (receivedAudio) finalize()
      }, 900)
    }

    ws.on('open', () => {
      timeoutHandle = setTimeout(() => finalize(new Error('Preview audio timed out')), PREVIEW_AUDIO_TIMEOUT_MS)

      ws.send(JSON.stringify({
        type: 'session.update',
        session: {
          voice: voiceId,
          instructions: 'Read the user script in a warm, natural tone. Keep pacing clean and expressive.',
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
        },
      }))

      ws.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `Read this exact script as a polished audio preview:\n\n${script}`,
            },
          ],
        },
      }))

      ws.send(JSON.stringify({ type: 'response.create' }))
    })

    ws.on('message', (raw: any) => {
      try {
        const data = JSON.parse(raw.toString())

        if (data.type === 'response.audio.delta' && data.delta) {
          receivedAudio = true
          pcmChunks.push(Buffer.from(data.delta, 'base64'))
          refreshIdle()
          return
        }

        if (
          data.type === 'response.done' ||
          data.type === 'response.completed' ||
          data.type === 'response.output_audio.done'
        ) {
          finalize()
          return
        }

        if (data.type === 'error') {
          finalize(new Error(data.error?.message || 'Grok realtime preview failed'))
        }
      } catch (err: any) {
        finalize(new Error(err.message || 'Failed to parse Grok preview message'))
      }
    })

    ws.on('error', (err: any) => {
      finalize(new Error(err?.message || 'Grok preview websocket error'))
    })

    ws.on('close', () => {
      if (!settled) {
        if (receivedAudio) finalize()
        else finalize(new Error('Grok preview websocket closed before audio response'))
      }
    })
  })
}

// ===== Health check =====
fastify.get('/', async () => ({ status: 'Cupid Call Bridge Server 💘', voices: ['Ara', 'Rex', 'Sal', 'Eve', 'Leo'] }))

// ===== Script audio preview (Grok voice) =====
fastify.post('/preview-audio', async (request, reply) => {
  const { script, voiceId = 'Ara' } = request.body as any

  if (!script || typeof script !== 'string') {
    return reply.status(400).send({ error: 'Script is required' })
  }

  const text = script.trim()
  if (!text) {
    return reply.status(400).send({ error: 'Script is required' })
  }
  if (text.length > 3000) {
    return reply.status(400).send({ error: 'Script exceeds preview limit' })
  }

  try {
    const wav = await synthesizePreviewAudio(text, voiceId)
    return {
      audioBase64: wav.toString('base64'),
      mimeType: 'audio/wav',
      sampleRate: PREVIEW_AUDIO_SAMPLE_RATE,
    }
  } catch (err: any) {
    fastify.log.error({ err }, 'Failed to generate preview audio')
    return reply.status(500).send({ error: err.message || 'Preview audio generation failed' })
  }
})

// ===== Outbound call trigger =====
fastify.post('/outbound-call', async (request, reply) => {
  const {
    phone,
    senderName,
    valentineName,
    script,
    characterId = 'kid-bot',
    voiceId = 'Ara',
    callId,
  } = request.body as any

  if (!phone || !senderName || !script || !characterId) {
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
    characterId,
    voiceId,
    createdAt: Date.now(),
  })

  // Auto-cleanup after delay + call window
  setTimeout(() => pendingCalls.delete(id), PENDING_CALL_TTL_MS)

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  const bridgeUrl = BRIDGE_DOMAIN || `http://localhost:${BRIDGE_PORT}`
  const streamUrl = `${bridgeUrl.replace('http', 'ws')}/media-stream`
  const statusCallbackUrl = `${bridgeUrl}/twilio/call-status`

  const sendPreCallText = async () => {
    try {
      await client.messages.create({
        to: phone,
        from: TWILIO_PHONE_NUMBER,
        body: PRE_CALL_SMS_BODY,
      })
      return true
    } catch (err: any) {
      fastify.log.error({ err, phone }, 'Failed to send pre-call SMS')
      return false
    }
  }

  const placeCall = async () => {
    const call = await client.calls.create({
      to: phone,
      from: TWILIO_PHONE_NUMBER,
      statusCallback: statusCallbackUrl,
      statusCallbackEvent: ['completed'],
      statusCallbackMethod: 'POST',
      twiml: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Pause length="1"/>
  <Connect>
    <Stream url="${streamUrl}">
      <Parameter name="callId" value="${id}"/>
    </Stream>
  </Connect>
</Response>`,
    })

    callLookupBySid.set(call.sid, {
      callId: id,
      phone,
      senderName,
      valentineName: valentineName || 'there',
      createdAt: Date.now(),
    })

    return call
  }

  try {
    const preCallTextSent = await sendPreCallText()
    const delayMs = callStartDelayMs()

    if (delayMs > 0) {
      setTimeout(async () => {
        try {
          const scheduledCall = await placeCall()
          fastify.log.info({ callSid: scheduledCall.sid, callId: id }, 'Scheduled outbound call started')
        } catch (err: any) {
          pendingCalls.delete(id)
          fastify.log.error({ err, callId: id }, 'Scheduled call failed to start')
        }
      }, delayMs)

      return {
        success: true,
        callId: id,
        scheduled: true,
        callStartsInMinutes: PRE_CALL_SMS_LEAD_MINUTES,
        preCallTextSent,
      }
    }

    const call = await placeCall()
    return {
      success: true,
      callSid: call.sid,
      callId: id,
      scheduled: false,
      callStartsInMinutes: 0,
      preCallTextSent,
    }
  } catch (err: any) {
    pendingCalls.delete(id)
    fastify.log.error(err)
    return reply.status(500).send({ error: err.message })
  }
})

// ===== Twilio status callback (for post-call referral SMS) =====
fastify.post('/twilio/call-status', async (request, reply) => {
  const body = request.body as any
  const callSid = body?.CallSid as string | undefined
  const callStatus = body?.CallStatus as string | undefined

  if (!callSid || !callStatus) {
    return reply.status(200).send({ ok: true, ignored: true })
  }

  if (callStatus !== 'completed') {
    return reply.status(200).send({ ok: true, ignored: true })
  }

  if (postCallTextScheduled.has(callSid)) {
    return reply.status(200).send({ ok: true, ignored: true })
  }

  const callRecord = callLookupBySid.get(callSid)
  if (!callRecord) {
    fastify.log.warn({ callSid }, 'No call record found for completed call')
    return reply.status(200).send({ ok: true, ignored: true })
  }

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    return reply.status(500).send({ error: 'Twilio not configured' })
  }

  postCallTextScheduled.add(callSid)
  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  const delayMs = POST_CALL_SMS_DELAY_MINUTES * 60 * 1000

  setTimeout(async () => {
    try {
      await client.messages.create({
        to: callRecord.phone,
        from: TWILIO_PHONE_NUMBER,
        body: POST_CALL_SMS_BODY,
      })
      fastify.log.info({ callSid, phone: callRecord.phone }, 'Post-call referral SMS sent')
    } catch (err: any) {
      fastify.log.error({ err, callSid, phone: callRecord.phone }, 'Failed to send post-call SMS')
    } finally {
      postCallTextScheduled.delete(callSid)
      callLookupBySid.delete(callSid)
      pendingCalls.delete(callRecord.callId)
    }
  }, delayMs)

  return reply.status(200).send({
    ok: true,
    scheduled: true,
    sendInMinutes: POST_CALL_SMS_DELAY_MINUTES,
  })
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
  const { senderName, valentineName, script, characterId } = config

  const CHARACTER_DELIVERY_PROMPTS: Record<string, string> = {
    'kid-bot': 'Playful, friendly robot delivery. Cheerful and wholesome.',
    'victorian-gentleman': 'Elegant and poetic delivery. Warm gentleman tone.',
    'southern-belle': 'Honey-sweet charm with graceful playful warmth.',
    'nocturne-vampire': 'Dramatic gothic romance, velvety and intense but respectful.',
    'sakura-confession': 'Soft, intimate confession energy with tender warmth.',
  }

  const characterNote = CHARACTER_DELIVERY_PROMPTS[characterId] || 'Warm romantic delivery.'
  const safetyNote = 'Keep the delivery romantic, respectful, and consensual. Avoid explicit sexual details.'

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

CHARACTER MODE: ${characterNote}
SAFETY: ${safetyNote}

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
    if (now - config.createdAt > PENDING_CALL_TTL_MS) {
      pendingCalls.delete(id)
    }
  }
  for (const [sid, call] of callLookupBySid.entries()) {
    if (now - call.createdAt > PENDING_CALL_TTL_MS + (POST_CALL_SMS_DELAY_MINUTES * 60 * 1000)) {
      callLookupBySid.delete(sid)
      postCallTextScheduled.delete(sid)
    }
  }
}, 60 * 1000)

// ===== Start server =====
const start = async () => {
  try {
    const port = parseInt(PORT || BRIDGE_PORT)
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

import { NextRequest, NextResponse } from 'next/server'
import {
  getCharacterById,
  type CharacterId,
  type ContentTypeId,
} from '@/lib/types'

const XAI_API_KEY = process.env.XAI_API_KEY

const CHARACTER_PROMPTS: Record<CharacterId, string> = {
  'kid-bot': `You are Kid Bot: cheerful, playful, and wholesome. Add light robot flavor words like 
    "beep", "boop", "systems online", and "love detected" in moderation. Keep it friendly and sweet.`,
  'victorian-gentleman': `You are a Victorian Gentleman: elegant, composed, poetic, and sincere. 
    Use refined romantic language with tasteful old-world phrasing, but keep it natural when spoken aloud.`,
  'southern-belle': `You are a Southern Belle: charming, warm, witty, and affectionate. 
    A little playful Southern color is welcome, but keep it genuine and not caricatured.`,
  'nocturne-vampire': `You are the Nocturne Vampire: dramatic, velvety, intense, and magnetic. 
    Use gothic romance imagery and deep longing, while remaining respectful and emotionally warm.`,
  'sakura-confession': `You are Sakura Confession: tender, heartfelt, and cinematic. 
    Use soft confession energy like an anime love scene under cherry blossoms, honest and vulnerable.`,
}

const CONTENT_PROMPTS: Record<ContentTypeId, string> = {
  'love-poem': 'Write it as a lyrical love poem with clear imagery and cadence.',
  'miss-you': 'Write it as a heartfelt miss-you message: longing, memory, and hopeful reunion.',
  'always-wanted-to-say': 'Write it as a brave confession of words the sender has held back.',
  'hype-up': 'Write it as a loving hype message that celebrates strengths and uplifts confidence.',
  'apology': 'Write it as a sincere apology that takes ownership and asks for repair with care.',
}

export async function POST(req: NextRequest) {
  try {
    if (!XAI_API_KEY) {
      return NextResponse.json({ error: 'XAI_API_KEY is not configured' }, { status: 500 })
    }

    const body = await req.json()
    const {
      senderName,
      valentineName,
      personalTouch,
      contentType,
      characterId,
    } = body

    if (!contentType || !characterId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    const character = getCharacterById(characterId)
    const contentPrompt = CONTENT_PROMPTS[contentType as ContentTypeId]

    if (!character) {
      return NextResponse.json({ error: 'Invalid character selected' }, { status: 400 })
    }
    if (!contentPrompt) {
      return NextResponse.json({ error: 'Invalid content type selected' }, { status: 400 })
    }
    const personalTouchSafe = typeof personalTouch === 'string' ? personalTouch.trim() : ''
    if (personalTouchSafe.length > 500) {
      return NextResponse.json({ error: 'Personal details must be 500 characters or less' }, { status: 400 })
    }

    const senderNameSafe = (senderName || 'Someone').trim() || 'Someone'
    const valentineNameSafe = (valentineName || 'your valentine').trim() || 'your valentine'
    const globalSafetyPrompt = 'Keep it romantic, respectful, and consensual. Avoid explicit sexual content, coercion, or harassment.'

    const prompt = `You are writing a personalised Cupid Call telegram that will be spoken out loud on a real phone call.

CHARACTER:
${CHARACTER_PROMPTS[character.id]}

CONTENT GOAL:
${contentPrompt}

SENDER:
${senderNameSafe}

RECIPIENT:
${valentineNameSafe}

PRIVATE CONTEXT TO WEAVE IN:
${personalTouchSafe || 'No personal details provided. Focus on the selected style and character voice.'}

SAFETY POLICY:
${globalSafetyPrompt}

OUTPUT RULES:
- 80-150 words total (about 30-60 seconds spoken)
- Write only the telegram text (no labels, no stage directions, no markdown)
- Start immediately with the message itself
- Use concrete details from the private context when available
- End with one memorable sign-off line
- Keep cadence natural for spoken voice
- Stay in character throughout`

    // Use xAI's Grok API (OpenAI-compatible endpoint)
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a creative writer for spoken romantic voice telegrams. You keep writing specific, emotionally clear, and natural to read aloud.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.85,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const errBody = await response.text()
      throw new Error(`Grok API error: ${response.status} - ${errBody}`)
    }

    const completion = await response.json()
    const script = completion.choices?.[0]?.message?.content?.trim()

    if (!script) {
      throw new Error('No script generated')
    }

    return NextResponse.json({
      script,
      characterId: character.id,
      voiceId: character.voiceId,
    })
  } catch (error: any) {
    console.error('Script generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate script' },
      { status: 500 }
    )
  }
}

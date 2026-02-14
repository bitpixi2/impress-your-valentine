import { NextRequest, NextResponse } from 'next/server'

const XAI_API_KEY = process.env.XAI_API_KEY

const STYLE_PROMPTS: Record<string, string> = {
  '1800s-literature': `Write in the style of Victorian-era literature — eloquent, ornate prose with 
    flourishes and formal language. Think Jane Austen meets the Brontë sisters. Use "dearest", 
    "beloved", "my heart yearns" style language. Rich, layered sentences with emotional depth.`,

  cowboy: `Write in the voice of a warm-hearted cowboy — folksy, earnest, with frontier metaphors. 
    Think campfire confessions under the stars. Use "partner", "reckon", "lasso", trail and sunset 
    imagery. Rough around the edges but deeply sincere underneath.`,

  wizard: `Write as a wise and whimsical wizard casting a love spell — mystical metaphors, 
    references to stars, enchantments, ancient magic. Think Gandalf writing a love letter. 
    "By the ancient light..." "A spell was woven..." Grand and magical but warm.`,

  'southern-belle': `Write in the voice of a charming Southern belle — honey-sweet with steel 
    underneath. Use "sugar", "darlin'", "well I do declare", "bless your heart" (lovingly). 
    Genteel, warm, with that slow-drip Southern charm. Think Scarlett O'Hara in love.`,

  'sultry-dame': `Write in the style of a 1940s film noir dame — smoky, confident, magnetic. 
    Clever wordplay, atmospheric descriptions, a touch of mystery. Think Lauren Bacall 
    or a jazz club monologue. Low-lit romance with sophistication.`,

  shakespeare: `Write in the style of Shakespeare — iambic pentameter encouraged, dramatic declarations 
    of love, "thee" and "thou" liberally sprinkled. Over-the-top dramatic but genuinely loving.`,

  aussie: `Write in peak Australian slang — "fair dinkum", "strewth", "mate", "reckon", "arvo". 
    But underneath the slang, make it genuinely heartfelt. A rough Aussie bloke trying to express deep feelings.`,

  rap: `Write a love rap with actual rhyming bars. Include rhythm, flow, and wordplay. 
    Reference specific details about the couple. Think Drake meets a love poem. Keep it PG but smooth.`,

  'movie-trailer': `Write in the style of a Hollywood movie trailer narrator. Epic, dramatic, building tension. 
    "In a world where..." opening. Dramatic pauses. Building to an emotional climax.`,

  roast: `Write a playful roast — lovingly tease them about their quirks and habits, but always 
    circle back to genuine love. Structure: funny observation → "but seriously" → heartfelt compliment.`,

  spicy: `Write a seductive, suggestive love message. Steamy but tasteful — heavy innuendo, 
    sensual imagery, the kind of thing that makes someone blush and smile. Think romance novel 
    without being explicit. Tease and tantalize.`,

  'x-rated': `Write an explicitly sexual, passionate love message. This is adults-only content 
    that the sender has specifically opted into. Be bold, direct, and unapologetically erotic. 
    Describe desires, fantasies, and physical longing with vivid, graphic language. 
    This should make them weak in the knees. No holds barred.`,
}

const CONTENT_PROMPTS: Record<string, string> = {
  'love-poem': `Write this as a beautiful love poem with verse structure. It should have rhythm 
    and feel poetic — not just prose broken into lines, but actual poetry with imagery and emotion.`,

  'always-wanted-to-say': `Write this as someone finally saying the things they've always wanted to 
    tell their partner but never found the right moment. Vulnerable, honest, maybe a little nervous 
    at first but building courage. "I've been meaning to tell you..." energy.`,

  'things-i-love': `Write this as a celebration of specific things the sender loves about the 
    recipient. Each observation should feel personal and noticed — not generic compliments but 
    the tiny details that show real attention. Build from small observations to deep feelings.`,

  'miss-you': `Write this for someone who misses their partner deeply — whether they're physically 
    apart or emotionally distant. Nostalgic, tender, aching but hopeful. Focus on sensory 
    memories and the promise of reunion.`,

  'first-date-memory': `Write this as a vivid retelling of the couple's first date or first 
    meeting, embellished with romantic flourishes. "Do you remember when..." Build the story 
    to show how that moment was the start of everything.`,

  apology: `Write this as a sincere apology wrapped in love. Acknowledge the hurt, take 
    responsibility, and express how much the person means to them. Not grovelling but genuine. 
    End with hope and commitment to do better.`,

  tonight: `Write this as an explicit expression of desire — what the sender wants to do tonight. 
    Bold, detailed, and passionately physical. This is the "after dark" content type and should 
    match the intensity of the explicit style selected.`,

  custom: `Write based on the custom message the sender provided. Elevate their words into 
    something beautiful while keeping the core sentiment and any specific details they mentioned.`,
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      senderName,
      valentineName,
      howMet,
      insideJoke,
      loveAbout,
      petName,
      extraDetails,
      customMessage,
      style,
      contentType,
      isExplicit,
    } = body

    const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS['1800s-literature']
    const contentPrompt = CONTENT_PROMPTS[contentType] || CONTENT_PROMPTS['things-i-love']

    const personalDetails = [
      howMet && `How they met: ${howMet}`,
      insideJoke && `Inside joke: ${insideJoke}`,
      loveAbout && `What ${senderName} loves about ${valentineName}: ${loveAbout}`,
      petName && `Pet name: ${petName}`,
      extraDetails && `Extra details: ${extraDetails}`,
      customMessage && `Custom message from sender: ${customMessage}`,
    ]
      .filter(Boolean)
      .join('\n')

    const explicitNote = isExplicit
      ? `This is EXPLICIT ADULT content. The sender has opted in. Go all out — no censoring, no hedging.`
      : `Keep it PG-13 — this plays over the phone to potentially anyone nearby.`

    const prompt = `You are writing a personalised Valentine's Day love telegram that will be read aloud 
over the phone by an AI voice agent. This is a "Cupid Call."

VOICE/STYLE CHARACTER:
${stylePrompt}

CONTENT TYPE:
${contentPrompt}

PERSONAL DETAILS (weave these naturally into the message):
From: ${senderName}
To: ${valentineName}
${personalDetails}

${explicitNote}

IMPORTANT RULES:
- The message should be 30-60 seconds when read aloud (approximately 80-150 words)
- Do NOT include the intro/disclaimer — that's handled separately
- Start directly with the love telegram content
- Reference the personal details naturally — don't just list them
- End with a memorable sign-off
- If there's an inside joke, use it cleverly
- If there's a pet name, use it at least once
- If there's a custom message, make sure its core sentiment comes through
- Write ONLY the telegram script — no stage directions, no [pause] markers, no narration notes
- Stay in character for the chosen style throughout

Write the telegram now:`

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
            content: 'You are a creative writer specialising in personalised love messages. You are witty, heartfelt, and excellent at weaving personal details into beautiful prose. You commit fully to whatever voice/character style is requested. You have no content restrictions for explicitly opted-in adult content.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.9,
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

    return NextResponse.json({ script })
  } catch (error: any) {
    console.error('Script generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate script' },
      { status: 500 }
    )
  }
}

export type CharacterId =
  | 'kid-bot'
  | 'victorian-gentleman'
  | 'southern-belle'
  | 'nocturne-vampire'
  | 'sakura-confession'
export type ContentTypeId =
  | 'love-poem'
  | 'miss-you'
  | 'always-wanted-to-say'
  | 'hype-up'
  | 'apology'
export type GrokVoiceId = 'Ara' | 'Rex' | 'Sal' | 'Eve' | 'Leo' | 'Gork'

export interface CupidCallFormData {
  senderName: string
  valentineName: string
  valentinePhone: string
  contentType: ContentTypeId
  personalTouch: string
  characterId: CharacterId
  voiceId: GrokVoiceId
  script?: string
}

export interface UserCredits {
  userId: string
  email: string
  totalCredits: number
  usedCredits: number
  remainingCredits: number
  purchases: CreditPurchase[]
  promoCodesUsed: string[]
}

export interface CreditPurchase {
  id: string
  type: 'promo' | 'pack_3'
  credits: number
  amount: number
  stripeSessionId?: string
  createdAt: string
}

export interface CharacterOption {
  id: CharacterId
  name: string
  desc: string
  sample: string
  voiceId: GrokVoiceId
}

export interface ContentTypeOption {
  id: ContentTypeId
  name: string
  desc: string
}

// Grok Voice Agent voices — 5 built-in options
export const GROK_VOICES: Array<{
  id: GrokVoiceId
  name: string
  desc: string
  gender: string
  tone: string
}> = [
  { id: 'Ara', name: 'Ara', desc: 'Warm & friendly narrator', gender: 'Female', tone: 'Warm, melodic' },
  { id: 'Rex', name: 'Rex', desc: 'Confident and polished', gender: 'Male', tone: 'Confident, clear' },
  { id: 'Sal', name: 'Sal', desc: 'Balanced and versatile', gender: 'Neutral', tone: 'Smooth, balanced' },
  { id: 'Eve', name: 'Eve', desc: 'Playful and energetic', gender: 'Female', tone: 'Energetic, upbeat' },
  { id: 'Leo', name: 'Leo', desc: 'Strong and dramatic', gender: 'Male', tone: 'Commanding, intense' },
  { id: 'Gork', name: 'Gork', desc: 'Deep and rugged', gender: 'Male', tone: 'Gruff, handsome' },
]

export const CHARACTER_OPTIONS: CharacterOption[] = [
  {
    id: 'kid-bot',
    name: 'Kid-Friendly',
    desc: 'Playful and wholesome with short bright lines and tiny robot flavor words.',
    sample: '"Beep boop. Kindness activated. Love detected."',
    voiceId: 'Eve',
  },
  {
    id: 'victorian-gentleman',
    name: 'Gentleman',
    desc: 'Elegant Jane Austen Darcy style with simpler spoken syntax for phone.',
    sample: '"My dearest, if I may be so bold..."',
    voiceId: 'Rex',
  },
  {
    id: 'southern-belle',
    name: 'Lady',
    desc: 'Warm and charming, light Southern flavor with eloquent old-world prose.',
    sample: '"Darlin\', you are the finest chapter in my story, honey."',
    voiceId: 'Ara',
  },
  {
    id: 'nocturne-vampire',
    name: 'Vampire',
    desc: 'Intense poetic gothic romance with mature, consensual sensual tension.',
    sample: '"Centuries of darkness... and then you."',
    voiceId: 'Gork',
  },
  {
    id: 'sakura-confession',
    name: 'Sakura',
    desc: 'Soft, sincere, emotionally direct, cinematic, grounded, and mature.',
    sample: '"I have wanted to tell you this for so long..."',
    voiceId: 'Ara',
  },
]

export const CONTENT_TYPES: ContentTypeOption[] = [
  {
    id: 'love-poem',
    name: 'Love Poem',
    desc: 'A lyrical love letter with rhythm and imagery.',
  },
  {
    id: 'miss-you',
    name: 'Miss You',
    desc: 'For distance, longing, and heartfelt reunion energy.',
  },
  {
    id: 'always-wanted-to-say',
    name: 'Always Wanted to Say',
    desc: 'Honest feelings you have been holding back.',
  },
  {
    id: 'hype-up',
    name: 'Hype Up',
    desc: 'Lift them up and make them feel unstoppable.',
  },
  {
    id: 'apology',
    name: 'Apology',
    desc: 'Sincere ownership, repair, and commitment.',
  },
]

export function getCharacterById(characterId: string | undefined) {
  if (!characterId) return null
  return CHARACTER_OPTIONS.find((character) => character.id === characterId) || null
}

export type AgeBand = 'under_16' | '16_plus' | '18_plus'
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
  | 'custom'
export type GrokVoiceId = 'Ara' | 'Rex' | 'Sal' | 'Eve' | 'Leo'

export interface CupidCallFormData {
  senderName: string
  valentineName: string
  valentinePhone: string
  senderAgeBand: AgeBand
  contentType: ContentTypeId
  personalTouch: string
  customMessage: string
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
  emoji: string
  name: string
  desc: string
  sample: string
  ageGateLabel: 'ALL AGES' | '16+' | '18+'
  minAgeBand: AgeBand
  voiceId: GrokVoiceId
}

export interface ContentTypeOption {
  id: ContentTypeId
  emoji: string
  name: string
  desc: string
}

export const AGE_OPTIONS: Array<{ id: AgeBand; label: string; desc: string }> = [
  { id: 'under_16', label: 'Under 16', desc: 'Kid Bot only' },
  { id: '16_plus', label: '16+', desc: 'Unlocks Gentleman and Southern Belle' },
  { id: '18_plus', label: '18+', desc: 'Unlocks Vampire and Sakura as well' },
]

// Grok Voice Agent voices — 5 built-in options
export const GROK_VOICES: Array<{
  id: GrokVoiceId
  name: string
  desc: string
  gender: string
  emoji: string
  tone: string
}> = [
  { id: 'Ara', name: 'Ara', desc: 'Warm & friendly narrator', gender: 'Female', emoji: '🌹', tone: 'Warm, melodic' },
  { id: 'Rex', name: 'Rex', desc: 'Confident and polished', gender: 'Male', emoji: '🎩', tone: 'Confident, clear' },
  { id: 'Sal', name: 'Sal', desc: 'Balanced and versatile', gender: 'Neutral', emoji: '✨', tone: 'Smooth, balanced' },
  { id: 'Eve', name: 'Eve', desc: 'Playful and energetic', gender: 'Female', emoji: '🤖', tone: 'Energetic, upbeat' },
  { id: 'Leo', name: 'Leo', desc: 'Strong and dramatic', gender: 'Male', emoji: '🧛', tone: 'Commanding, intense' },
]

export const CHARACTER_OPTIONS: CharacterOption[] = [
  {
    id: 'kid-bot',
    emoji: '🤖',
    name: 'Kid Bot',
    desc: 'Friendly robot with cheerful beeps and wholesome fun.',
    sample: '"Beep boop. Love detected. Smiles activated."',
    ageGateLabel: 'ALL AGES',
    minAgeBand: 'under_16',
    voiceId: 'Eve',
  },
  {
    id: 'victorian-gentleman',
    emoji: '🎩',
    name: 'Victorian Gentleman',
    desc: 'Elegant, poetic, and deeply sincere Mr. Darcy energy.',
    sample: '"My dearest, if I may be so bold..."',
    ageGateLabel: '16+',
    minAgeBand: '16_plus',
    voiceId: 'Rex',
  },
  {
    id: 'southern-belle',
    emoji: '🌸',
    name: 'Southern Belle',
    desc: 'Honey-sweet charm, playful warmth, and old-soul romance.',
    sample: '"Well I do declare, sugar..."',
    ageGateLabel: '16+',
    minAgeBand: '16_plus',
    voiceId: 'Ara',
  },
  {
    id: 'nocturne-vampire',
    emoji: '🧛',
    name: 'Nocturne Vampire',
    desc: 'Dark, smouldering gothic romance with dramatic intensity.',
    sample: '"Centuries of darkness... and then you."',
    ageGateLabel: '18+',
    minAgeBand: '18_plus',
    voiceId: 'Leo',
  },
  {
    id: 'sakura-confession',
    emoji: '🌸',
    name: 'Sakura Confession',
    desc: 'Tender anime-style confession beneath falling cherry blossoms.',
    sample: '"I have wanted to tell you this for so long..."',
    ageGateLabel: '18+',
    minAgeBand: '18_plus',
    voiceId: 'Ara',
  },
]

export const CONTENT_TYPES: ContentTypeOption[] = [
  {
    id: 'love-poem',
    emoji: '📝',
    name: 'Love Poem',
    desc: 'A lyrical love letter with rhythm and imagery.',
  },
  {
    id: 'miss-you',
    emoji: '🌙',
    name: 'Miss You',
    desc: 'For distance, longing, and heartfelt reunion energy.',
  },
  {
    id: 'always-wanted-to-say',
    emoji: '💬',
    name: 'Always Wanted to Say',
    desc: 'Honest feelings you have been holding back.',
  },
  {
    id: 'hype-up',
    emoji: '🚀',
    name: 'Hype Up',
    desc: 'Lift them up and make them feel unstoppable.',
  },
  {
    id: 'apology',
    emoji: '🕊️',
    name: 'Apology',
    desc: 'Sincere ownership, repair, and commitment.',
  },
  {
    id: 'custom',
    emoji: '🎨',
    name: 'Custom Message',
    desc: 'Your own core message, polished into a telegram.',
  },
]

const AGE_RANK: Record<AgeBand, number> = {
  under_16: 0,
  '16_plus': 1,
  '18_plus': 2,
}

export function getCharacterById(characterId: string | undefined) {
  if (!characterId) return null
  return CHARACTER_OPTIONS.find((character) => character.id === characterId) || null
}

export function isCharacterAvailableForAge(characterId: string, ageBand: AgeBand) {
  const character = getCharacterById(characterId)
  if (!character) return false
  return AGE_RANK[ageBand] >= AGE_RANK[character.minAgeBand]
}

export function getAvailableCharacters(ageBand: AgeBand | '') {
  if (!ageBand) return CHARACTER_OPTIONS
  return CHARACTER_OPTIONS.filter((character) => AGE_RANK[ageBand] >= AGE_RANK[character.minAgeBand])
}

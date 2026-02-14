export interface CupidCallFormData {
  senderName: string
  valentineName: string
  valentinePhone: string
  howMet: string
  insideJoke: string
  loveAbout: string
  petName: string
  extraDetails: string
  customMessage: string
  style: string
  contentType: string
  voiceId: string
  isExplicit: boolean
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

// Grok Voice Agent voices — 5 built-in options
export const GROK_VOICES = [
  { id: 'Ara', name: 'Ara', desc: 'Warm & friendly — the classic romantic narrator', gender: 'Female', emoji: '🌹', tone: 'Warm, friendly' },
  { id: 'Rex', name: 'Rex', desc: 'Confident & clear — suave professional energy', gender: 'Male', emoji: '🎩', tone: 'Confident, clear' },
  { id: 'Sal', name: 'Sal', desc: 'Smooth & balanced — versatile, fits anything', gender: 'Neutral', emoji: '✨', tone: 'Smooth, balanced' },
  { id: 'Eve', name: 'Eve', desc: 'Energetic & upbeat — hype and enthusiasm', gender: 'Female', emoji: '⚡', tone: 'Energetic, upbeat' },
  { id: 'Leo', name: 'Leo', desc: 'Authoritative & strong — commanding presence', gender: 'Male', emoji: '🦁', tone: 'Authoritative, strong' },
]

export const VOICE_STYLES = [
  {
    id: '1800s-literature',
    emoji: '📜',
    name: '1800s Literature',
    desc: 'Eloquent Victorian prose, darling',
    sample: 'My dearest, the very thought of your countenance...',
    explicit: false,
  },
  {
    id: 'cowboy',
    emoji: '🤠',
    name: 'Cowboy',
    desc: 'Dusty trails and big hearts',
    sample: "Well partner, I reckon you lassoed my heart...",
    explicit: false,
  },
  {
    id: 'wizard',
    emoji: '🧙',
    name: 'Wizard',
    desc: 'Mystical enchantments of love',
    sample: 'By the ancient stars, a spell was cast the day we met...',
    explicit: false,
  },
  {
    id: 'southern-belle',
    emoji: '🌸',
    name: 'Southern Belle',
    desc: "Sweet tea and sweeter words, sugar",
    sample: "Well I do declare, you are the finest thing since sweet tea...",
    explicit: false,
  },
  {
    id: 'sultry-dame',
    emoji: '🖤',
    name: 'Sultry Dame',
    desc: 'Film noir romance, low-lit and smooth',
    sample: 'Of all the gin joints in all the world, you walked into mine...',
    explicit: false,
  },
  {
    id: 'shakespeare',
    emoji: '🎭',
    name: 'Shakespearean Drama',
    desc: 'Dramatic iambic pentameter, over the top',
    sample: 'Hark! What light through yonder phone doth ring...',
    explicit: false,
  },
  {
    id: 'aussie',
    emoji: '🦘',
    name: 'Aussie Love Letter',
    desc: 'Fair dinkum romance, mate',
    sample: "Crikey, you're the Vegemite to my toast...",
    explicit: false,
  },
  {
    id: 'rap',
    emoji: '🎤',
    name: 'Love Rap',
    desc: 'Bars about your boo. Actual rhymes.',
    sample: 'Yo, let me tell you about the one I adore...',
    explicit: false,
  },
  {
    id: 'movie-trailer',
    emoji: '🎬',
    name: 'Movie Trailer Voice',
    desc: 'In a world... where one person... loved another...',
    sample: 'IN A WORLD full of ordinary love stories...',
    explicit: false,
  },
  {
    id: 'roast',
    emoji: '🔥',
    name: 'Loving Roast',
    desc: 'Playful burns followed by genuine love',
    sample: 'Look, you snore like a freight train, BUT...',
    explicit: false,
  },
  {
    id: 'spicy',
    emoji: '🌶️',
    name: 'Spicy & Seductive',
    desc: 'Steamy, suggestive, turned up to 11',
    sample: "Let's just say... I can't stop thinking about last Tuesday...",
    explicit: true,
  },
  {
    id: 'x-rated',
    emoji: '🔞',
    name: 'After Dark',
    desc: 'Explicitly romantic. Adults only. You\'ve been warned.',
    sample: 'This one writes itself... if you dare.',
    explicit: true,
  },
]

export const CONTENT_TYPES = [
  {
    id: 'love-poem',
    emoji: '📝',
    name: 'Love Poem',
    desc: 'A beautiful poem written just for them',
  },
  {
    id: 'always-wanted-to-say',
    emoji: '💬',
    name: 'Something I Always Wanted to Tell You',
    desc: "Those words you've been holding back",
  },
  {
    id: 'things-i-love',
    emoji: '❤️',
    name: 'Things I Love About You',
    desc: 'A celebration of everything that makes them special',
  },
  {
    id: 'miss-you',
    emoji: '🌙',
    name: 'I Miss You',
    desc: 'For the one who is far away but close in heart',
  },
  {
    id: 'first-date-memory',
    emoji: '✨',
    name: 'Remember Our First Date?',
    desc: 'Relive that magical moment together',
  },
  {
    id: 'apology',
    emoji: '🕊️',
    name: "I'm Sorry & I Love You",
    desc: 'When you need to make it right',
  },
  {
    id: 'tonight',
    emoji: '🔥',
    name: "What I Want Tonight",
    desc: 'For when words aren\'t enough. Explicit styles only.',
    explicit: true,
  },
  {
    id: 'custom',
    emoji: '🎨',
    name: 'Custom Message',
    desc: "Tell us what you want to say, we'll make it shine",
  },
]

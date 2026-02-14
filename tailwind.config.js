/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'cupid-bg': '#110D15',
        'cupid-rose': '#C47A8E',
        'cupid-gold': '#C9A96E',
        'cupid-text': '#E8E0E4',
        'cupid-muted': '#8A7F85',
        'cupid-age-green': '#7BAF7B',
        'cupid-age-amber': '#C9A96E',
        'cupid-age-red': '#B86B6B',
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
        fun: ['Plus Jakarta Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

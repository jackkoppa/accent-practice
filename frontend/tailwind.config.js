/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neo-brutalism color palette
        'neo-bg': '#e0e5ec',
        'neo-main': '#88aaee',
        'neo-accent': '#a388ee',
        'neo-success': '#44cc77',
        'neo-warning': '#ffcc44',
        'neo-error': '#ff6b6b',
      },
      boxShadow: {
        'neo': '4px 4px 0px 0px #000',
        'neo-sm': '2px 2px 0px 0px #000',
        'neo-lg': '6px 6px 0px 0px #000',
        'neo-pressed': '1px 1px 0px 0px #000',
      },
      borderWidth: {
        '3': '3px',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'word-reveal': 'wordReveal 0.3s ease-out forwards',
      },
      keyframes: {
        wordReveal: {
          '0%': { opacity: '0.5', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
}

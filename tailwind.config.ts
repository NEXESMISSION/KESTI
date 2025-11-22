import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0063BD',      // Logo blue
        secondary: '#6FC605',    // Logo green
        danger: '#EF4444',
        accent: {
          blue: '#0063BD',
          green: '#6FC605',
        },
      },
      keyframes: {
        'scroll-infinite': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'scroll-infinite': 'scroll-infinite 20s linear infinite',
        'scroll-infinite-slow': 'scroll-infinite 40s linear infinite',
      },
    },
  },
  plugins: [],
}
export default config

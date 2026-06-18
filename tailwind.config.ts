import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        clara: {
          black: '#0a0a0b',
          dark: '#111113',
          surface: '#18181b',
          'surface-2': '#1e1e22',
          'surface-3': '#27272c',
          border: '#2e2e35',
          'border-subtle': '#232328',
          orange: '#f97316',
          'orange-light': '#fb923c',
          'orange-dim': 'rgba(194,89,16,0.53)',
          white: '#fafafa',
          muted: '#71717a',
          'muted-2': '#52525b',
          text: '#e4e4e7',
          'text-dim': '#a1a1aa',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', '-apple-system', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-left': 'slideInLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config

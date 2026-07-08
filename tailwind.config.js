import typography from '@tailwindcss/typography';
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Mockup v14 Design Tokens
        'white': '#fff',
        'bg': '#fafafa',
        'bg-warm': '#f7f6f4',
        'border': '#e8e6e3',
        'text-primary': '#1a1a1a',
        'text-secondary': '#555',
        'text-muted': '#999',
        // Brand colors (fuchsia is primary)
        'fuchsia': '#C108AB',
        'fuchsia-light': 'rgba(193,8,171,.08)',
        'fuchsia-10': 'rgba(193,8,171,.1)',
        'fuchsia-20': 'rgba(193,8,171,.2)',
        // Semantic colors
        'green': '#2d8a4e',
        'amber': '#b8860b',
        'red': '#c0392b',
        'blue': '#2c5282',
        // Legacy compatibility
        'accent': '#C108AB',
        'accent-light': '#E040C8',
        'bg-primary': '#FFFFFF',
        'bg-secondary': '#F5F5F5',
        'bg-tertiary': '#EDEDED',
        'bg-hover': '#E5E5E5',
        'tier-1': '#16A34A',
        'tier-1Bg': 'rgba(22,163,74,0.15)',
        'tier-2': '#CA8A04',
        'tier-2Bg': 'rgba(202,138,4,0.15)',
        'tier-3': '#6B7280',
        'tier-3Bg': 'rgba(107,114,128,0.15)',
        // Pipeline stages
        'sweep': '#00897B',
        'canva': '#ec4899',
        'grid': '#f59e0b',
        'lens': '#06b6d4',
        'placed': '#22c55e',
        // Legacy brand palette
        'teal': '#00897B',
        'teal-light': '#4DB6AC',
        'ocean': '#4FC3F7',
        'ocean-deep': '#0288D1',
        'slate': '#607D8B',
        'sky': '#E8F4FD',
        'mist': '#F0F7FF',
        'lavender': '#EDE7F6',
        'cream': '#FAFAFA',
      },
      fontFamily: {
        serif: ['Libre Baskerville', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xxs': '10px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.1)',
        'modal': '0 8px 32px rgba(0,0,0,0.15)',
      },
      borderRadius: {
        'card': '12px',
      },
      animation: {
        'pulse-icon': 'iconPulse 2s ease-in-out infinite',
        'rotate-icon': 'iconRotate 8s linear infinite',
        'draw-icon': 'iconDraw 3s ease-in-out infinite',
        'glow-cta': 'ctaGlow 2.5s ease-in-out infinite',
        'float': 'dreamyFloat 8s ease-in-out infinite',
        'enter': 'pageEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [typography],
};
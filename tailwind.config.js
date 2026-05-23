/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': 'var(--bg-primary, #0A0A0A)',
        'bg-secondary': 'var(--bg-secondary, #1A1A1A)',
        'bg-tertiary': 'var(--bg-tertiary, #2A2A2A)',
        'bg-hover': 'var(--bg-hover, #333333)',
        'text-primary': 'var(--text-primary, #FFFFFF)',
        'text-secondary': 'var(--text-secondary, #CCCCCC)',
        'text-muted': 'var(--text-muted, #888888)',
        'accent': 'var(--accent, #C108AB)',
        'accent-light': 'var(--accent-light, #E040C8)',
        'tier-1': '#10B981',
        'tier-1Bg': 'rgba(16,185,129,0.15)',
        'tier-2': '#F59E0B',
        'tier-2Bg': 'rgba(245,158,11,0.15)',
        'tier-3': '#6B7280',
        'tier-3Bg': 'rgba(107,114,128,0.15)',
        'secondary-400': '#818CF8',
        'secondary-500': '#6366F1',
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

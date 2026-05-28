/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': 'var(--bg-primary, #FFFFFF)',
        'bg-secondary': 'var(--bg-secondary, #F5F5F5)',
        'bg-tertiary': 'var(--bg-tertiary, #EDEDED)',
        'bg-hover': 'var(--bg-hover, #E5E5E5)',
        'text-primary': 'var(--text-primary, #000000)',
        'text-secondary': 'var(--text-secondary, #333333)',
        'text-muted': 'var(--text-muted, #666666)',
        'accent': 'var(--accent, #C108AB)',
        'accent-light': 'var(--accent-light, #E040C8)',
        'tier-1': '#16A34A',
        'tier-1Bg': 'rgba(22,163,74,0.15)',
        'tier-2': '#CA8A04',
        'tier-2Bg': 'rgba(202,138,4,0.15)',
        'tier-3': '#6B7280',
        'tier-3Bg': 'rgba(107,114,128,0.15)',
        'secondary-400': '#818CF8',
        'secondary-500': '#6366F1',
      },
      fontFamily: {
        serif: ['Libre Baskerville', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

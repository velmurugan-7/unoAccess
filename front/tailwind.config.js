/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['DM Sans', 'system-ui', 'sans-serif'], mono: ['DM Mono', 'Fira Code', 'monospace'] },
      colors: {
        surface: 'var(--c-surface)',
        surface2: 'var(--c-surface2)',
        border: 'var(--c-border)',
        border2: 'var(--c-border2)',
        'c-text': 'var(--c-text)',
        'c-text2': 'var(--c-text2)',
        'c-text3': 'var(--c-text3)',
        'c-blue': 'var(--c-blue)',
        'c-indigo': 'var(--c-indigo)',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
      borderRadius: { sm: 'var(--r-sm)', md: 'var(--r-md)', lg: 'var(--r-lg)', xl: 'var(--r-xl)' },
    },
  },
  plugins: [],
};

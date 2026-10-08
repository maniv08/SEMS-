/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--bg)',
        surface: 'var(--surface)',
        border: 'var(--border)',
        primary: 'var(--text-primary)',
        muted: 'var(--text-muted)',
        brand: 'var(--brand)',
        accent: 'var(--accent)',
        warning: 'var(--warning)',
        critical: 'var(--critical)',
        violet: 'var(--violet)',
      },
      borderRadius: {
        card: 'var(--radius-card)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

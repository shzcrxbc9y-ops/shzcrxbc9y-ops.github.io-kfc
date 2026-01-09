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
        primary: {
          50: '#fff5f5',
          100: '#ffe3e3',
          200: '#ffcdcd',
          300: '#ffa8a8',
          400: '#ff7575',
          500: '#ff4444',
          600: '#e62e2e',
          700: '#cc1f1f',
          800: '#b31a1a',
          900: '#991515',
        },
      },
    },
  },
  plugins: [],
}
export default config


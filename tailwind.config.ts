import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          50: '#e7f7ff',
          100: '#cbeeff',
          200: '#a0dcff',
          300: '#6cc3ff',
          400: '#34a7ff',
          500: '#128dff',
          600: '#0970db',
          700: '#0a58ad',
          800: '#0f4a89',
          900: '#123e71',
        },
      },
    },
  },
  plugins: [],
} satisfies Config



import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          500: '#1e3a5f',
          600: '#172e4c',
          700: '#122340',
          900: '#0a1628',
        },
      },
    },
  },
  plugins: [],
} satisfies Config

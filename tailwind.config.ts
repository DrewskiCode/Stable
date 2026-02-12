import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        stable: {
          50: '#fdf8f3',
          100: '#f5ebe0',
          200: '#e8d5c4',
          300: '#d4b896',
          400: '#c19a6b',
          500: '#a67c52',
          600: '#8b5e3c',
          700: '#6b4423',
          800: '#4a2c17',
          900: '#2d1a0e',
        },
        chore: {
          todo: '#fbbf24',
          progress: '#3b82f6',
          done: '#22c55e',
        }
      },
    },
  },
  plugins: [],
}
export default config

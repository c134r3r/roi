import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f8f9fa',
          100: '#eaeef5',
          200: '#d0dde8',
          500: '#5b63b5',
          600: '#4a50a1',
          700: '#3a3f88',
          900: '#1a1d2e',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;

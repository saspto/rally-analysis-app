/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#e8eef7',
          100: '#c5d5ea',
          200: '#9eb9db',
          300: '#779ccb',
          400: '#5987c0',
          500: '#3b72b5',
          600: '#2d5f9e',
          700: '#1e3a5f',
          800: '#162d4a',
          900: '#0e1f35',
        },
      },
    },
  },
  plugins: [],
}

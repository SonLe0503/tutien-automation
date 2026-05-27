/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: '#0A0F0D',
          card: 'rgba(16, 20, 18, 0.45)',
          border: 'rgba(255, 255, 255, 0.08)'
        }
      }
    },
  },
  plugins: [],
}

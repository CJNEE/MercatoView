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
        food: {
          orange: '#FF6B35',
          amber: '#FFB627',
          cream: '#FFF8F0',
          charcoal: '#1A1A1A',
          charcoalLight: '#2D2D2D',
          gold: '#E3B448',
          cardBg: 'rgba(30, 30, 30, 0.65)',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass-light': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow-orange': '0 0 15px rgba(255, 107, 53, 0.4)',
      }
    },
  },
  plugins: [],
}

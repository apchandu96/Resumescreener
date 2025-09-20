// tailwind.config.cjs
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brandBlue: '#0C022F',
        brandBlueHover: '#1b1540',
        brandBlueActive: '#07001a',
        brandOrange: '#FF5010',
        brandOrangeHover: '#ff6a33',
        brandOrangeBorder: '#d2460e',
      },
      borderRadius: { xl: '0.9rem', '2xl': '1.25rem' },
      boxShadow: { soft: '0 2px 10px rgba(0,0,0,.06)', elevated: '0 10px 25px rgba(0,0,0,.08)' },
      container: { center: true, padding: '1rem', screens: { '2xl': '1200px' } },
    },
  },
  plugins: [],
};

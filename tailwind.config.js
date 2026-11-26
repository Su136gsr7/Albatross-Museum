/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        museum: {
          bg: '#140f0c',
          cream: '#f5efe6',
          gold: '#d4af6a',
          espresso: '#2b1d16',
          walnut: '#4a3225',
        },
      },
    },
  },
  plugins: [],
};

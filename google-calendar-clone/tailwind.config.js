/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        google: {
          blue: '#1a73e8',
          red: '#ea4335',
          green: '#34a853',
          yellow: '#fbbc05',
          gray: '#dadce0',
          hover: '#f1f3f4',
        },
      },
      fontFamily: {
        sans: ['"Google Sans"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        google: '0 1px 2px rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
        googleHover: '0 2px 6px rgba(60,64,67,0.35)',
      },
    },
  },
  plugins: [],
}


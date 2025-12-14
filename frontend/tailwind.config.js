/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#E6375F', // Rose Yespark
        'primary-50': '#fdf2f4',
        'primary-100': '#fbe5e9',
        'primary-200': '#f7ccd5',
        'primary-300': '#f0a3b3',
        'primary-400': '#e6375f', // Main color
        'primary-500': '#d12f54',
        'primary-600': '#ab1f40',
        'primary-700': '#8a1632',
        'primary-800': '#6b1126',
        'primary-900': '#500c1c',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Cabinet Grotesk', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}


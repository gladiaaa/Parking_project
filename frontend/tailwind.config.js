/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a365d', // Bleu marine élégant et épuré
        'primary-50': '#f0f4f8',
        'primary-100': '#d9e2ec',
        'primary-200': '#bcccdc',
        'primary-300': '#9fb3c8',
        'primary-400': '#829ab1',
        'primary-500': '#627d98',
        'primary-600': '#486581',
        'primary-700': '#334e68',
        'primary-800': '#243b53',
        'primary-900': '#1a365d',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Cabinet Grotesk', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}


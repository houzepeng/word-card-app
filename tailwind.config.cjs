/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        hand: ['Patrick Hand', 'Zcool KuaiLe', 'cursive'],
        title: ['Fredoka One', 'Zcool KuaiLe', 'cursive'],
        pinyin: ['Noto Sans SC', 'sans-serif'],
      },
      animation: {
        'bounce-in': 'bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'fade-in': 'fade-in 0.2s ease-out forwards',
        'slide-down': 'slide-down 0.3s ease-out forwards',
      },
      keyframes: {
        'bounce-in': {
          '0%': { opacity: '0', transform: 'translate(-50%, 20px) scale(0.9)' },
          '100%': { opacity: '1', transform: 'translate(-50%, 0) scale(1)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
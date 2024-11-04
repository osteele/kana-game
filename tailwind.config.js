/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'bounce-in': {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' }
        },
        'correct-answer': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)', backgroundColor: 'rgb(187 247 208)' },
          '100%': { transform: 'scale(1)' }
        },
        'wrong-answer': {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-5px)' },
          '40%, 80%': { transform: 'translateX(5px)' }
        },
        'slide-up': {
          '0%': {
            transform: 'translateY(100%)',
            opacity: '0'
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1'
          }
        }
      },
      animation: {
        'bounce-in': 'bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'correct-answer': 'correct-answer 0.6s ease-in-out',
        'wrong-answer': 'wrong-answer 0.5s ease-in-out',
        'slide-up-1': 'slide-up 0.5s ease-out forwards',
        'slide-up-2': 'slide-up 0.5s ease-out 0.1s forwards',
        'slide-up-3': 'slide-up 0.5s ease-out 0.2s forwards',
        'slide-up-4': 'slide-up 0.5s ease-out 0.3s forwards',
        'slide-up-5': 'slide-up 0.5s ease-out 0.4s forwards',
      }
    },
  },
  plugins: [],
}

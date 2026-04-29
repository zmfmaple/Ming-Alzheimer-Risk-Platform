/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'almond': '#e2c694',
        'almond-light': '#f0dcc5',
        'warm-wood': '#755852',
        'warm-wood-light': '#9a7a72',
        'sage': '#8c9d79',
        'sage-light': '#a8b89a',
        'sage-dark': '#6d7a5c',
      },
      fontFamily: {
        'display': ['Playfair Display', 'serif'],
        'body': ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl': '24px',
        '2xl': '32px',
      },
      boxShadow: {
        'soft': '0 4px 24px rgba(117, 88, 82, 0.08)',
        'soft-hover': '0 8px 32px rgba(117, 88, 82, 0.15)',
        'glass': '0 8px 32px rgba(255, 255, 255, 0.2)',
      },
      animation: {
        'breathe': 'breathe 4s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

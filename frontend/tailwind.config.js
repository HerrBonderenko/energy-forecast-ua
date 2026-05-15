/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Канонічна палітра з артефактів
        primary: {
          DEFAULT: '#2563EB',
          light: '#60A5FA',
        },
        forecast: {
          DEFAULT: '#EA580C',
          light: '#FB923C',
        },
      },
      keyframes: {
        'toast-in': {
          '0%': { opacity: 0, transform: 'translateX(20px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        'scale-in': {
          '0%': { opacity: 0, transform: 'scale(0.96)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
      },
      animation: {
        'toast-in': 'toast-in 220ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in-left': 'slide-in-left 240ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 200ms ease-out both',
        'scale-in': 'scale-in 180ms cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
};

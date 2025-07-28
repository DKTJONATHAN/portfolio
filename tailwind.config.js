/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  purge: ['./*.html', './**/*.html', './scripts/*.js'], // Adjust paths as needed
  theme: {
    extend: {
      colors: {
        primary: '#4f46e5',
        secondary: '#10b981',
        text: '#1f2937',
        'light-bg': '#f9fafb',
        white: '#ffffff',
        'border-color': '#e5e7eb',
        'light-text': '#6b7280',
        'primary-dark': '#3b82f6',
        gray: {
          900: '#111827',
          700: '#4b5563',
          200: '#e5e7eb',
        },
      },
      fontFamily: {
        poppins: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 10px 30px rgba(0, 0, 0, 0.15)',
        'nav': '0 2px 4px rgba(0, 0, 0, 0.05)',
        'mobile-nav': '0 -2px 10px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};
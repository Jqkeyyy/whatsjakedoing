export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FFFBEB',
        ink: '#292524',
        terracotta: { DEFAULT: '#9A3412', light: '#C2410C' },
        sage: '#059669',
        gold: '#D97706',
      },
      fontFamily: {
        display: ['Calistoga', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        offset: '4px 4px 0 #292524',
      },
    },
  },
  plugins: [],
};

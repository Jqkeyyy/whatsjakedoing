export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#08080B',
        surface: '#17171A',
        hairline: 'rgba(255,255,255,0.06)',
        ink: '#F5F3EF',
        muted: '#9C9CA3',
        faint: '#7A7A80',
        ember: '#FF8A3D',
        teal: '#4FD1C5',
        violet: '#9D8CFF',
      },
      fontFamily: {
        display: ['"Inter Tight"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        depth: '0 8px 20px -8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)',
      },
    },
  },
  plugins: [],
};

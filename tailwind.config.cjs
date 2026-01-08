module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1f2937',
        muted: '#5f6b7a',
        accent: '#c96d2d',
        accent2: '#2f6f68',
        income: '#58a999',
        expense: '#c96d2d',
        balance: '#2f5fa8',
        benefit: '#1a7f37',
        benefitNegative: '#b42318'
      },
      boxShadow: {
        card: '0 18px 40px -30px rgba(27, 32, 38, 0.12)'
      },
      fontFamily: {
        sans: ['"Open Sans"', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};

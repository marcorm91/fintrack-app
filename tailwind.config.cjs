module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#213047',
        muted: '#7a8798',
        accent: '#2878ff',
        accent2: '#f15f91',
        income: '#70e3b6',
        expense: '#ff6b8f',
        balance: '#2878ff',
        portfolio: '#f4bc45',
        totalWealth: '#68778c',
        benefit: '#22b984',
        benefitNegative: '#f05268'
      },
      boxShadow: {
        card: '0 24px 60px -36px rgba(33, 48, 71, 0.22)'
      },
      fontFamily: {
        sans: ['"Open Sans"', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};

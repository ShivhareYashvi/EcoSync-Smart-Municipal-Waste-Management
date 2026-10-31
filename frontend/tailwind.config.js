/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        civic: {
          navy: '#0f172a',
          blue: '#0ea5e9',
          green: '#10b981',
          mint: '#d1fae5'
        },
        ecosync: {
          primary: '#009B70',
          deep: '#006B4F',
          navy: '#101828',
          secondary: '#475467',
          bg: '#F7F9FC',
          card: '#FFFFFF',
          border: '#E4E7EC',
          light: '#EAFBF4',
        }
      },
      boxShadow: {
        glass: '0 24px 80px rgba(15, 23, 42, 0.18)'
      },
      backgroundImage: {
        'ecosync-gradient': 'linear-gradient(135deg, #009B70 0%, #006B4F 50%, #101828 100%)'
      }
    }
  },
  plugins: []
};

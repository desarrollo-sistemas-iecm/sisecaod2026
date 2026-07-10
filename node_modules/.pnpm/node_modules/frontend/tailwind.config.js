/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        iecm: {
          purple:         '#4A1D8F',
          'purple-dark':  '#2D0F5E',
          'purple-light': '#7B4FBF',
          'purple-50':    '#F3EFF9',
          'purple-100':   '#E5D9F5',
          amber:          '#F5A623',
          'amber-dark':   '#D4881C',
          light:          '#F8F7FF',
          indigo:         '#1e1b4b',
          'indigo-900':   '#0f0e2a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'iecm':     '0 4px 24px 0 rgba(74, 29, 143, 0.12)',
        'iecm-lg':  '0 8px 40px 0 rgba(74, 29, 143, 0.18)',
        'card':     '0 1px 3px 0 rgba(0,0,0,.08), 0 1px 2px -1px rgba(0,0,0,.06)',
        'card-lg':  '0 4px 16px -2px rgba(0,0,0,.10), 0 2px 4px -2px rgba(0,0,0,.06)',
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      screens: {
        'xs': '480px',
      },
      animation: {
        'fade-in':    'fadeIn .3s ease-out',
        'slide-up':   'slideUp .4s ease-out',
        'count-up':   'countUp .6s ease-out',
      },
      keyframes: {
        fadeIn:   { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:  { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        countUp:  { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      }
    }
  },
  plugins: []
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1a1714',
          80: '#3d3835',
          60: '#57534e',
        },
        muted: '#78716c',
        subtle: '#a8a29e',
        divider: {
          DEFAULT: '#ccc7c1',
          lt: '#e2ddd8',
        },
        surface: {
          warm: '#faf8f5',
          subtle: '#f0ece7',
        },
        accent: '#b45309',
        star: '#d97706',
        sand: {
          50:  '#fdf8f2',
          100: '#f5ede0',
          200: '#e8d8c4',
          800: '#6b4a2e',
          900: '#4a2e1a',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1.25' }],
      },
      letterSpacing: {
        label: '0.12em',
        'label-md': '0.14em',
        'label-lg': '0.16em',
        'label-xl': '0.18em',
        'label-2xl': '0.2em',
      },
      boxShadow: {
        card: '0 1px 3px rgba(26,23,20,.05), 0 4px 12px rgba(26,23,20,.07)',
        'card-h': '0 8px 32px rgba(26,23,20,.14)',
        nav: '0 2px 24px rgba(26,23,20,.08)',
        md: '0 4px 16px rgba(26,23,20,.1)',
      },
      aspectRatio: {
        book: '3/4',
        card: '4/3',
      },
      transitionDuration: {
        460: '460ms',
      },
    },
  },
  plugins: [],
}

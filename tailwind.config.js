/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#f8fafc',
        chrome: '#ffffff',
        band: {
          DEFAULT: '#f1f5f9',
          blue: '#eff6ff',
          lavender: '#f8fafc',
        },
        primary: {
          DEFAULT: '#0c6cf2', // Razorpay Dodger/Electric Blue
          deep: '#0957d0',
          hover: '#0957d0',
        },
        razor: {
          blue: '#0c6cf2',
          blueHover: '#0957d0',
          navy: '#0c1a30',
          navyDark: '#08162d',
          navyHover: '#132847',
          surface: '#f8fafc',
          border: '#e2e8f0',
        },
        navy: '#0c1a30',
        sky: '#38bdf8',
        ink: {
          DEFAULT: '#0f172a', // Slate 900
          lead: '#1e293b',
          body: '#334155',    // Slate 700
          list: '#475569',
          meta: '#64748b',
          nav: '#64748b',
          subtle: '#64748b',
          muted: '#64748b',
          tertiary: '#94a3b8',
        },
        hairline: {
          DEFAULT: '#e2e8f0',
          soft: '#f1f5f9',
          dark: '#94a3b8',
        },
        surface: {
          1: '#ffffff',
          2: '#f5f6f7',
          3: '#eaecee',
        },
        fin: {
          orange: '#ff5600',
          orangeHover: '#e04c00',
          orangeLight: '#fff0eb',
        },
        report: {
          blue: '#0057d2',
          green: '#16a34a',
          pink: '#db2777',
          amber: '#d97706',
          purple: '#7c3aed',
        }
      },
      fontFamily: {
        sans: ['72', 'Inter', 'Segoe UI', '-apple-system', 'BlinkMacSystemFont', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        'none': '0px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      boxShadow: {
        'card': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'lift': '0 4px 12px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}

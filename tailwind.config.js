/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#f5f1ec',
        surface: {
          1: '#ffffff',
          2: '#ece7e1',
          3: '#e4dfd8',
        },
        hairline: {
          DEFAULT: '#d3cec6',
          soft: '#e6e2db',
          dark: '#b8b2a8',
        },
        ink: {
          DEFAULT: '#111111',
          muted: '#626260',
          subtle: '#7b7b78',
          tertiary: '#9c9fa5',
        },
        fin: {
          orange: '#ff5600',
          orangeHover: '#e04c00',
          orangeLight: '#fff0eb',
        },
        report: {
          blue: '#2563eb',
          green: '#16a34a',
          pink: '#ec4899',
          lime: '#84cc16',
          orange: '#ea580c',
        },
        brand: {
          blue: '#0007cb',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        'pill': '9999px',
      },
      boxShadow: {
        'card': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'lift': '0 4px 12px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}


/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#faf9f6', // Warm off-white / parchment-like neutral
          subtle: '#f5f4ef',
          muted: '#edece6',
        },
        ink: {
          DEFAULT: '#1c1917', // Stone-900 high contrast readable dark
          muted: '#57534e',   // Stone-600
          subtle: '#a8a29e',  // Stone-400
        },
        brand: {
          50: '#f4f6f8',
          100: '#e5e9ee',
          500: '#2d3748',
          600: '#1a202c',
          700: '#171923',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0B1D2D',
          800: '#102A43',
          700: '#1B3B5A',
          600: '#274B72',
          100: '#E2EBF4',
          50: '#F0F5FA',
        },
        brandTeal: {
          DEFAULT: '#0FAF9A',
          hover: '#0C9684',
          light: '#E8F8F5',
          dark: '#086E61',
        },
        navBlue: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
          light: '#EEF5FF',
          dark: '#1D4ED8',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F8FAFC',
          muted: '#F1F5F9',
          dark: '#0B1320',
          darkCard: '#131F32',
          darkBorder: '#1E2F48',
        }
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(16, 42, 67, 0.05), 0 1px 2px -1px rgba(16, 42, 67, 0.05)',
        'card': '0 4px 6px -1px rgba(16, 42, 67, 0.07), 0 2px 4px -2px rgba(16, 42, 67, 0.05)',
        'elevated': '0 12px 24px -4px rgba(16, 42, 67, 0.12), 0 4px 8px -4px rgba(16, 42, 67, 0.06)',
        'glow-teal': '0 0 20px -4px rgba(15, 175, 154, 0.4)',
        'glow-blue': '0 0 20px -4px rgba(59, 130, 246, 0.4)',
      },
      keyframes: {
        pulseSlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        radarScan: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      },
      animation: {
        'pulse-slow': 'pulseSlow 3s ease-in-out infinite',
        'radar-scan': 'radarScan 4s linear infinite',
      }
    },
  },
  plugins: [],
}

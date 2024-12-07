/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Custom colors for the prison locations
        'prison': {
          cell: '#FF6B6B',
          yard: '#4ECDC4',
          gym: '#45B7D1',
          infirmary: '#96CEB4',
          showers: '#4A90E2',
          kitchen: '#F7D794',
          workshop: '#786FA6',
          guard: '#E056FD',
          director: '#F8C291',
        }
      },
      animation: {
        'pulse': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: 0.1 },
          '50%': { opacity: 0.3 },
        }
      },
      boxShadow: {
        'location': '0 0 20px rgba(255, 255, 255, 0.2)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        minecraft: {
          dark: '#1e1e1e',
          gray: '#313131',
          green: '#55ff55',
          red: '#ff5555',
          gold: '#ffaa00',
        }
      },
      fontFamily: {
        minecraft: ['Minecraft', 'monospace'],
      }
    },
  },
  plugins: [],
}

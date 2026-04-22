/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: '#0B0B14',
        card: '#1E1E35',
        border: '#2A2A45',
        accent: '#6B46C1',
        'accent-hover': '#5a3aad',
        'text-primary': '#FFFFFF',
        'text-secondary': '#A0A0C0',
        'text-muted': '#6B6B8A',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["IBM Plex Sans", "Segoe UI", "sans-serif"],
        heading: ["Manrope", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
}


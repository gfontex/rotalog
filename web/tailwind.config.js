/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#060911',
          900: '#0B1120',
          850: '#111827',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
        },
      },
    },
  },
  plugins: [],
}

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
        surface: {
          bg: 'var(--bg-main)',
          card: 'var(--bg-card)',
          elevated: 'var(--bg-elevated)',
          border: 'var(--border-primary)',
          logo: 'var(--bg-logo)',
        },
        brand: {
          primary: 'var(--brand-accent)',
          'primary-hover': 'var(--brand-accent-hover)',
          secondary: 'var(--brand-secondary)',
        },
        content: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        dark: {
          950: 'var(--bg-main)',
          900: 'var(--bg-main)',
          850: 'var(--bg-card)',
          800: 'var(--bg-card)',
          700: 'var(--border-primary)',
          600: 'var(--text-muted)',
        },
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
      },
    },
  },
  plugins: [],
};

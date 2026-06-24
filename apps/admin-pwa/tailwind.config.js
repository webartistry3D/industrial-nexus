/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    {
      pattern: /(from|to)-(blue|green|red|purple|amber)-(500|600)\/(5|10|20)/,
      variants: ['dark'],
    },
    {
      pattern: /(border)-(blue|green|red|purple)-(200|700)\/(50)/,
      variants: ['dark'],
    },
    {
      pattern: /shadow-(blue|green|red|purple)-500\/(10|20)/,
      variants: ['dark'],
    },
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: '#0f172a',
          light: '#1e293b',
        },
        accent: '#3b82f6',
      },
    },
  },
  plugins: [],
}

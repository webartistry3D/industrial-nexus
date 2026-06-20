import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        navy: {
          DEFAULT: "#0A1628",
          80: "#0D1D35",
          60: "#112240",
          40: "#1C3155",
        },
        steel: {
          DEFAULT: "#2A3F5F",
          40: "#3D5A80",
          20: "#98A8C0",
        },
        brand: {
          orange: "#E85D04",
          "orange-lt": "#FF7800",
          electric: "#1E88E5",
          "electric-lt": "#42A5F5",
          green: "#00BFA5",
          "green-dk": "#00897B",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

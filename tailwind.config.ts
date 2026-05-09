import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        twilight: "#0f172a",
        dusk: "#1e1b4b",
        roseglow: "#f472b6",
        mintnote: "#5eead4",
      },
      boxShadow: {
        aurora: "0 10px 40px rgba(236, 72, 153, 0.25)",
      },
      keyframes: {
        "hero-breathe": {
          "0%, 100%": { opacity: "0.45", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.06)" },
        },
        "hero-drift": {
          "0%, 100%": { transform: "translate(0, 0) rotate(0deg)" },
          "33%": { transform: "translate(8%, -4%) rotate(2deg)" },
          "66%": { transform: "translate(-6%, 6%) rotate(-1deg)" },
        },
        "hero-shimmer": {
          "0%": { backgroundPosition: "200% 50%" },
          "100%": { backgroundPosition: "-200% 50%" },
        },
        "live-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.45", transform: "scale(0.85)" },
        },
      },
      animation: {
        "hero-breathe": "hero-breathe 14s ease-in-out infinite",
        "hero-drift-slow": "hero-drift 22s ease-in-out infinite",
        "hero-drift-medium": "hero-drift 17s ease-in-out infinite reverse",
        "hero-shimmer": "hero-shimmer 12s linear infinite",
        "live-dot": "live-dot 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

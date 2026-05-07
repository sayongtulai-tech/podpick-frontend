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
    },
  },
  plugins: [],
};

export default config;

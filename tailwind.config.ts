import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "rgb(var(--color-primary-rgb) / <alpha-value>)",
          dark: "rgb(var(--color-primary-dark-rgb) / <alpha-value>)",
          light: "rgb(var(--color-primary-light-rgb) / <alpha-value>)",
        },
        accent: {
          gold: "#FFC72C",
          maroon: "#7A0016",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F8F9FA",
        },
      },
      fontFamily: {
        script: ["var(--font-dancing)", "cursive"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        panel: "0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)",
      },
    },
  },
  plugins: [],
};
export default config;

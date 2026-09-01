import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        workspace: "var(--workspace)",
        surface: "var(--surface)",
        "surface-muted": "var(--surface-muted)",
        line: "var(--line)",
        "line-soft": "var(--line-soft)",
        ink: "var(--ink)",
        "ink-secondary": "#4B5563",
        muted: "var(--muted)",
        primary: {
          DEFAULT: "#005E82",
          hover: "#004B68",
          soft: "#e6f4f8",
          ring: "rgba(0, 94, 130, 0.2)",
        },
        orange: {
          DEFAULT: "#F15A29",
          hover: "#D9471B",
          soft: "#fff0eb",
        },
        success: {
          DEFAULT: "#15803D",
          soft: "#f0fdf4",
          border: "#bbf7d0",
        },
        warning: {
          DEFAULT: "#B45309",
          soft: "#fffbeb",
          border: "#fde68a",
        },
        danger: {
          DEFAULT: "#DC2626",
          hover: "#b91c1c",
          soft: "#fef2f2",
          border: "#fecdd3",
        },
        info: {
          DEFAULT: "#005E82",
          soft: "#e6f4f8",
          border: "#b8e2f0",
        },
        brand: {
          50: "#e6f4f8",
          100: "#cce9f1",
          200: "#99d3e3",
          300: "#66bdd5",
          400: "#33a7c7",
          500: "#005E82",
          600: "#005E82",
          700: "#004B68",
          800: "#00384e",
          900: "#002534",
          950: "#00121a",
        },
        accentOrange: {
          50: "#fff0eb",
          100: "#ffe0d6",
          200: "#ffc1ad",
          300: "#ffa285",
          400: "#ff835c",
          500: "#F15A29",
          600: "#D9471B",
          700: "#b3330e",
          800: "#8c2408",
          900: "#661803",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'popover': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};
export default config;

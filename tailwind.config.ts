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
        // Design-system tokens used by src/components/ui/* only — see globals.css :root comment.
        workspace: "var(--workspace)",
        surface: "var(--surface)",
        "surface-muted": "var(--surface-muted)",
        line: "var(--line)",
        "line-soft": "var(--line-soft)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          soft: "var(--primary-soft)",
          ring: "var(--primary-ring)",
        },
        success: {
          DEFAULT: "var(--success)",
          soft: "var(--success-soft)",
          border: "var(--success-border)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          soft: "var(--warning-soft)",
          border: "var(--warning-border)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          hover: "var(--danger-hover)",
          soft: "var(--danger-soft)",
          border: "var(--danger-border)",
        },
        info: {
          DEFAULT: "var(--info)",
          soft: "var(--info-soft)",
          border: "var(--info-border)",
        },
        brand: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#bae0fd",
          300: "#7cc5fb",
          400: "#36a6f6",
          500: "#0c8ae9",
          600: "#026cc7",
          700: "#0356a1",
          800: "#074984",
          900: "#0c3e6e",
          950: "#082849",
        },
        slate: {
          850: "#151e2e",
          925: "#0b111e",
          950: "#070c15",
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow': '0 0 25px -5px rgba(12, 138, 233, 0.3)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.3)',
        'glow-amber': '0 0 25px -5px rgba(245, 158, 11, 0.3)',
        'card': '0 1px 2px 0 rgba(16, 24, 40, 0.04), 0 1px 1px 0 rgba(16, 24, 40, 0.02)',
        'card-hover': '0 4px 10px -2px rgba(16, 24, 40, 0.08), 0 2px 4px -2px rgba(16, 24, 40, 0.04)',
        'popover': '0 12px 32px -8px rgba(16, 24, 40, 0.18), 0 4px 12px -4px rgba(16, 24, 40, 0.08)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      }
    },
  },
  plugins: [],
};
export default config;

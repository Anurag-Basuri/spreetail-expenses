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
        canvas: "#F7F6F3",
        surface: "#FFFFFF",
        border: "#E8E6E1",
        ink: {
          900: "#18181B",
          600: "#52525B",
          400: "#A1A1AA",
        },
        brand: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
        },
        positive: {
          bg: "#F0FDF4",
          text: "#15803D",
          border: "#BBF7D0",
        },
        negative: {
          bg: "#FFF1F2",
          text: "#BE123C",
          border: "#FECDD3",
        },
        warning: {
          bg: "#FFFBEB",
          text: "#B45309",
          border: "#FDE68A",
        },
        info: {
          bg: "#F0F9FF",
          text: "#0369A1",
          border: "#BAE6FD",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.75rem",
        lg: "1rem",
        xl: "1.25rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
};
export default config;

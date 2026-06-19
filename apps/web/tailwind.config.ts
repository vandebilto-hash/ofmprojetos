import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"]
      },
      colors: {
        ink: "#172033",
        line: "#d9e1ec",
        canvas: "#f5f7fb",
        brand: {
          50: "#eef7ff",
          100: "#d8ecff",
          200: "#b3d9ff",
          500: "#1c7ed6",
          600: "#156bb8",
          700: "#0d5595"
        },
        success: {
          DEFAULT: "#0f8f5f",
          50: "#edfbf3",
          100: "#d1f5e3"
        },
        warning: {
          DEFAULT: "#b7791f",
          50: "#fffbeb",
          100: "#fef3c7"
        },
        danger: {
          DEFAULT: "#d64545",
          50: "#fff5f5",
          100: "#fed7d7"
        }
      },
      boxShadow: {
        soft: "0 1px 2px rgba(23, 32, 51, 0.06), 0 10px 30px rgba(23, 32, 51, 0.06)",
        card: "0 0 0 1px rgba(23, 32, 51, 0.04), 0 2px 8px rgba(23, 32, 51, 0.08)",
        dropdown: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.06)"
      },
      transitionDuration: {
        fast: "150ms",
        base: "200ms",
        slow: "300ms"
      },
      keyframes: {
        fadeIn: { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        slideIn: { from: { opacity: "0", transform: "translateX(-8px)" }, to: { opacity: "1", transform: "translateX(0)" } }
      },
      animation: {
        fadeIn: "fadeIn 200ms ease-out",
        slideIn: "slideIn 200ms ease-out"
      }
    }
  },
  plugins: []
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        line: "#d9e1ec",
        canvas: "#f5f7fb",
        brand: {
          50: "#eef7ff",
          100: "#d8ecff",
          500: "#1c7ed6",
          600: "#156bb8",
          700: "#0d5595"
        },
        success: "#0f8f5f",
        warning: "#b7791f",
        danger: "#d64545"
      },
      boxShadow: {
        soft: "0 1px 2px rgba(23, 32, 51, 0.06), 0 10px 30px rgba(23, 32, 51, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;

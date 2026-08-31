import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        hub: {
          green: "#0f7a3b",
          gold: "#f2c94c",
          red: "#c7352f",
          ink: "#17211c",
          mist: "#f6f7f2"
        }
      },
      boxShadow: {
        soft: "0 18px 55px rgba(23, 33, 28, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;

import type { Config } from "tailwindcss";
import { nextui } from "@nextui-org/react";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [nextui({
    themes: {
      light: {
        colors: {
          primary: {
            DEFAULT: "#dc2626",
            100: "#fee2e2",
            900: "#991b1b",
          },
          content1: "#FFFFFF",
          content2: "#f3f4f6",
        },
      },
      dark: {
        colors: {
          primary: {
            DEFAULT: "#dc2626",
            100: "#450a0a",
            900: "#fee2e2",
          },
          content1: "#18181b",
          content2: "#27272a",
        },
      },
    },
  })],
};

export default config;

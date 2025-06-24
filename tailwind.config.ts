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
            DEFAULT: "#3b82f6", // Bleu moderne
            100: "#dbeafe",     // Bleu très clair
            900: "#1e3a8a",     // Bleu très sombre
          },
          content1: "#FFFFFF",
          content2: "#f3f4f6",
        },
      },
      dark: {
        colors: {
          primary: {
            DEFAULT: "#3b82f6", // Même bleu moderne
            100: "#1e3a8a",     // Bleu très sombre (inversé)
            900: "#dbeafe",     // Bleu très clair (inversé)
          },
          content1: "#18181b",
          content2: "#27272a",
        },
      },
    },
  })],
};

export default config;

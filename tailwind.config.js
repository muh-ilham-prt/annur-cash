/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Mirrored by NEUTRALS in src/theme/tenant.ts — change both together.
      colors: {
        cream: "#fbf7ee",
        ink: "#18413B",
        muted: "#64748b",
        line: "#d8f3e3",
        danger: "#dc2626",
        surface: "#fbf7ee",
        forest: {
          50: "#effaf4",
          100: "#d8f3e3",
          200: "#b3e6cc",
          300: "#80d1ad",
          400: "#4ab788",
          500: "#269b6c",
          600: "#187d57",
          700: "#136447",
          800: "#12503a",
          900: "#0f4231",
          950: "#07271d",
        },
        gold: {
          200: "#f8e4a8",
          300: "#f3d27a",
          400: "#ecb94a",
          500: "#e0a026",
          600: "#c27f17",
        },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
const colorWithOpacity = (variableName) => {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgb(var(${variableName}) / ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
};

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        white: colorWithOpacity('--color-white'),
        black: colorWithOpacity('--color-black'),
        zinc: {
          50: colorWithOpacity('--color-zinc-50'),
          100: colorWithOpacity('--color-zinc-100'),
          200: colorWithOpacity('--color-zinc-200'),
          300: colorWithOpacity('--color-zinc-300'),
          400: colorWithOpacity('--color-zinc-400'),
          500: colorWithOpacity('--color-zinc-500'),
          600: colorWithOpacity('--color-zinc-600'),
          700: colorWithOpacity('--color-zinc-700'),
          800: colorWithOpacity('--color-zinc-800'),
          900: colorWithOpacity('--color-zinc-900'),
          950: colorWithOpacity('--color-zinc-950'),
        },
        darkBg: colorWithOpacity('--color-darkBg'),
        darkSurface: colorWithOpacity('--color-darkSurface'),
        darkBorder: colorWithOpacity('--color-darkBorder'),
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

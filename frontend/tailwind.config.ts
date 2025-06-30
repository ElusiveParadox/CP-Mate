// module.exports = {
//     darkMode: 'class',
//     content: [
//       './app/**/*.{js,ts,jsx,tsx}',
//       './pages/**/*.{js,ts,jsx,tsx}',
//       './components/**/*.{js,ts,jsx,tsx}',
//       './section/**/*.{js,ts,jsx,tsx}',
//     ],
//     theme: {
//       extend: {},
//     },
//     plugins: [],
//   };
  


import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class', // Enable class-based theming
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './section/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;

const teal = {
  50: '#eff6f1', 100: '#dbece0', 200: '#bbd8c7', 300: '#95c4aa', 400: '#65a88c',
  500: '#348169', 600: '#145d50', 700: '#104c42', 800: '#103f37', 900: '#13372f', 950: '#0b251f',
};

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: { extend: {
    fontFamily: { sans: ['Segoe UI', 'system-ui', 'sans-serif'] },
    colors: {
      indigo: teal, primary: teal,
      slate: { 50: '#f7f8f3', 100: '#edf0e9', 200: '#d3dbd2', 300: '#b1beb3', 400: '#62786c', 500: '#53675d', 600: '#42574e', 700: '#30483e', 800: '#233c32', 900: '#142b29' },
    },
    borderRadius: { xl: '.5rem', '2xl': '.75rem', '3xl': '1rem' },
    fontSize: { xs: ['.8125rem', '1.2rem'] },
  } },
  plugins: [],
};

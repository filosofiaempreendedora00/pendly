import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');
const tailwindConfig = require('./tailwind.config.cjs');

export default {
  plugins: [
    tailwindcss(tailwindConfig),
    autoprefixer(),
  ],
};

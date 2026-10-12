import type { Config } from 'tailwindcss'

// Design tokens (colors, fonts, radii, shadows) are filled in from DESIGN.md in phase 2.
export default {
  content: ['./src/renderer/**/*.{html,tsx,ts}', './src/features/**/renderer/**/*.{tsx,ts}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: { extend: {} },
  plugins: []
} satisfies Config

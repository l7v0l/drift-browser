import type { Config } from 'tailwindcss'

// Colors map to CSS variables (src/renderer/styles/index.css) so themes swap without rebuilding.
// Values are provisional (logo palette) until DESIGN.md is applied.
export default {
  content: ['./src/renderer/**/*.{html,tsx,ts}', './src/features/**/renderer/**/*.{tsx,ts}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        'surface-3': 'var(--surface-3)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        line: 'var(--line)',
        accent: 'var(--accent)',
        'accent-ink': 'var(--accent-ink)'
      }
    }
  },
  plugins: []
} satisfies Config

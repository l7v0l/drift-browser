import type { Config } from 'tailwindcss'

// Design tokens come from DESIGN.md. Colors map to CSS variables (src/renderer/styles/index.css)
// so light / dark themes swap without rebuilding.
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
        'accent-ink': 'var(--accent-ink)',
        coral: 'var(--coral)',
        amber: 'var(--amber)',
        ring: 'var(--ring)',
        scrim: 'var(--scrim)'
      },
      fontFamily: {
        display: ['Readex Pro', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
        label: ['DM Sans', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        // Ultra-rounded cards and panels (28px). Controls use rounded-full.
        card: '28px'
      },
      boxShadow: {
        rest: 'var(--shadow-rest)',
        hover: 'var(--shadow-hover)',
        modal: 'var(--shadow-modal)'
      }
    }
  },
  plugins: []
} satisfies Config

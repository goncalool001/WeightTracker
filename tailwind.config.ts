import type { Config } from 'tailwindcss';

/**
 * Colours are CSS variables (see src/index.css) so the same class names
 * resolve to the right palette in the light and dark themes.
 *
 * Style: "editorial greeting" — tonal panels on a white ground, one teal on
 * the data, ink for everything else, the h1 set in a serif.
 */
export default {
  darkMode: 'class',
  content: { relative: true, files: ['./index.html', './src/**/*.{ts,tsx}'] },
  theme: {
    extend: {
      colors: {
        ground: 'var(--ground)',
        surface: 'var(--surface)',
        raised: 'var(--raised)',
        active: 'var(--active)',
        'nav-active': 'var(--nav-active)',
        'cell-off': 'var(--cell-off)',
        border: 'var(--border)',
        rule: 'var(--rule)',
        control: 'var(--control)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        primary: 'var(--primary)',
        'on-primary': 'var(--on-primary)',
        positive: 'var(--positive)',
        negative: 'var(--negative)',
        'pill-pos': 'var(--pill-positive-bg)',
        'pill-pos-ink': 'var(--pill-positive-ink)',
        'pill-neg': 'var(--pill-negative-bg)',
        'pill-neg-ink': 'var(--pill-negative-ink)',
        'pill-warn': 'var(--pill-warning-bg)',
        'pill-warn-ink': 'var(--pill-warning-ink)',
      },
      fontFamily: {
        sans: ['"Instrument Sans"', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      borderRadius: {
        card: '22px',
        inner: '14px',
      },
      maxWidth: {
        column: '1100px',
      },
      keyframes: {
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'sheet-in': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'rise-in': 'rise-in 0.18s ease-out',
        'sheet-in': 'sheet-in 0.2s ease-out',
        // Centred dialogs only fade: their transform is the centring itself.
        'fade-in': 'fade-in 0.15s ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;

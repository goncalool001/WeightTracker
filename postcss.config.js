import { fileURLToPath } from 'node:url';

// Resolve the Tailwind config from this folder, so the build works whatever
// directory it is started from.
export default {
  plugins: {
    tailwindcss: { config: fileURLToPath(new URL('./tailwind.config.ts', import.meta.url)) },
    autoprefixer: {},
  },
};

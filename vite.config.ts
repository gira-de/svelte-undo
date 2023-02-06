import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [dts({ outputDir: 'dist/types' })],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SvelteUndo',
      fileName: (format) => `svelte-undo.${format}.js`,
    },
    rollupOptions: {
      external: ['immer'],
      output: {
        globals: {
          immer: 'Immer',
        },
      },
    },
  },
});

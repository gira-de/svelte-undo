import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte(), dts({ outDir: 'dist/types' })],
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

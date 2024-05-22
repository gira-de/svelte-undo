import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';

export default defineConfig({
  plugins: [sveltekit(), svelteTesting()],
  test: {
    include: ['src/**/*.test.ts'],
    globals: true,
    environment: 'jsdom',
    setupFiles: ['vitest-setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'text'],
      include: ['src/**'],
    },
  },
});

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    globals: true,
    coverage: {
      provider: 'istanbul',
      reporter: ['lcov', 'text'],
    },
  },
});

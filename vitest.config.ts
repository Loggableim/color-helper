import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/utils/**/*.ts', 'src/components/ColorBlindness.tsx'],
      reporter: ['text', 'html'],
    },
  },
});

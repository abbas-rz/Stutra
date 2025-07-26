import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        'docs/',
        '*.old.*'
      ],
      thresholds: {
        global: {
          statements: 80,
          branches: 70,
          functions: 80,
          lines: 80
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});

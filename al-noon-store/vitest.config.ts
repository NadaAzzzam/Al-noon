import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Filter Zone.js/Angular uncaught exceptions with undefined message that can
    // occur during test teardown - they don't indicate real test failures
    onUnhandledError(error: unknown): boolean | void {
      const e = error as { type?: string; message?: unknown };
      if (e?.type === 'Uncaught Exception' && e?.message === undefined) {
        return false; // Don't fail the test run for this
      }
    },
    coverage: {
      include: ['src/app/**/*.ts'],
      exclude: [
      '**/*.spec.ts',
      '**/*.d.ts',
      '**/api.schema.ts',
      '**/api.types.ts',
      '**/environments/**',
      '**/main.ts',
      '**/main.server.ts',
      '**/server.ts',
      '**/app.config.ts',
      '**/app.routes*.ts',
      '**/app.ts',
      '**/polyfills*.ts',
      '**/*.component.html',
    ],
    // Minimum thresholds (target 80%+ over time)
    thresholds: {
      statements: 50,
      branches: 40,
      functions: 50,
      lines: 50,
    },
    },
  },
});

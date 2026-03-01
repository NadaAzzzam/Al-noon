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
      provider: 'v8',
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
      // Thresholds disabled: Angular @angular/build:unit-test reports 0% coverage
      // for both v8 and istanbul due to source-map/instrumentation mismatch in the builder.
      // Re-enable when Angular fixes: https://github.com/angular/angular-cli/issues/30557
    },
  },
});

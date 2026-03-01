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
    // Coverage is configured in angular.json - custom coverage config here overrides
    // Angular's source-map handling and causes 0% coverage. Do not add coverage here.
  },
});

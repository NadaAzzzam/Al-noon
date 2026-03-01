# Code Coverage Fix

## Current Issue

Tests pass (317 tests) but coverage reports 0% due to a known Angular + Vitest integration bug: [angular/angular-cli#30557](https://github.com/angular/angular-cli/issues/30557). The `@angular/build:unit-test` builder has a source-map/instrumentation mismatch, so executed code is not attributed to source files.

## Fix Steps

### 1. Upgrade Angular to 21.2.0+

Angular 21.2.0 includes "adjust sourcemap sources when Vitest wrapper is bypassed" which may resolve the coverage issue.

**Stop all running processes** (dev server, tests, etc.) so `node_modules` is not locked, then:

```bash
cd al-noon-store
rm -rf node_modules package-lock.json   # Windows: rmdir /s /q node_modules && del package-lock.json
ng update @angular/core @angular/cli @angular/build
npm install
```

### 2. Verify Coverage

```bash
npm run test:ci
```

If coverage shows non-zero values, the fix worked.

### 3. Re-enable Thresholds

In `vitest.config.ts`, uncomment the thresholds under `coverage`:

```ts
thresholds: { statements: 80, branches: 70, functions: 80, lines: 80 },
```

### 4. Add Tests If Needed

If coverage is under 80%, add unit tests for uncovered files. Focus on services, pipes, and components.

## Current Workaround

Coverage thresholds are **disabled** in `vitest.config.ts` so CI and pre-push pass. Tests still run; only the coverage gate is skipped until the tooling fix is in place.

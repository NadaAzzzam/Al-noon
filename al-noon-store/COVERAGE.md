# Code Coverage

## Configuration

Coverage is enabled in `angular.json` under the `ci` test configuration. **Do not add coverage config to `vitest.config.ts`** – custom coverage settings there override Angular's source-map handling and cause 0% coverage ([angular/angular-cli#30557](https://github.com/angular/angular-cli/issues/30557)).

## Running with Coverage

```bash
npm run test:ci
```

## Thresholds

Thresholds are set in `angular.json` under `test.configurations.ci.coverageThresholds`. Current minimums are calibrated to the project's baseline. Increase them as you add tests:

- statements: 50%
- branches: 45%
- functions: 50%
- lines: 55%

## Improving Coverage

To reach 80%+ coverage, add unit tests for uncovered files. Focus on services, pipes, and components. Run `npm run test:ci` and review the coverage report in `coverage/` for details.

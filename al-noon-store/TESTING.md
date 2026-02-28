# Testing Guide - Al-Noon Store

This project uses **Vitest** for unit tests and **Cypress** for E2E tests.

## Unit Testing (Vitest)

### Run Tests

```bash
# Watch mode (re-runs on file changes)
npm test

# Single run (for CI)
npm run test:ci

# With coverage
ng test --coverage
```

### Test Structure

- **Utils**: `form-validators.spec.ts`, `product-availability.spec.ts`, `localized.spec.ts`, `product-normalizer.spec.ts`, `error-utils.spec.ts`
- **Services**: `cart.service.spec.ts`, `toast.service.spec.ts`
- **Pages**: `checkout.component.spec.ts`
- **Guards**: `auth.guard.spec.ts`
- **Interceptors**: `auth-profile.interceptor.spec.ts`
- **Pipes**: `price.pipe.spec.ts`, `localized.pipe.spec.ts`
- **Components**: `star-rating.component.spec.ts`, `product-card.component.spec.ts`

### Configuration

- `angular.json`: Test builder `@angular/build:unit-test`
- `tsconfig.spec.json`: Vitest globals, spec file includes

## E2E Testing (Cypress)

### Prerequisites

1. Install Cypress (if not already installed):
   ```bash
   npm install
   ```

2. Start the app in one terminal:
   ```bash
   npm start
   ```

### Run E2E Tests

```bash
# Headless mode (for CI)
npm run e2e

# Interactive mode (opens Cypress UI)
npm run e2e:open
```

### E2E Test Suites

- **home.cy.ts**: Home page loading
- **catalog.cy.ts**: Product catalog
- **navigation.cy.ts**: Route navigation
- **auth.cy.ts**: Login and register forms
- **cart.cy.ts**: Cart page
- **checkout.cy.ts**: Checkout page, discount code input and apply
- **contact.cy.ts**: Contact form submission

### API Mocking

E2E tests use `cy.intercept()` to mock API responses. This allows tests to run without a backend. Update `cypress/fixtures/` for custom mock data.

## CI Integration

```yaml
# Example GitHub Actions
- run: npm run test:ci
- run: npm run e2e
  env:
    CYPRESS_BASE_URL: http://localhost:4200
```

Ensure the app is built and served before running E2E tests in CI.

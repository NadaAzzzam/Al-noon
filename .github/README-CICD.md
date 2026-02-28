# CI/CD & Docker

## Quick Start

### Local Docker
```bash
cd al-noon-store
docker compose up --build
```
App available at http://localhost:4000

### Run unit tests in Docker
```bash
cd al-noon-store
docker build -f Dockerfile.test -t al-noon-store-test . && docker run --rm al-noon-store-test
```

## CI Pipeline (ci.yml)

Runs on push/PR to `main` and `develop`:

| Job | Description |
|-----|-------------|
| **Unit Tests** | Vitest with coverage |
| **Build** | Angular production build |
| **Docker Build & Test** | Build image, run container, smoke test (HTTP 200) |
| **Docker Unit Tests** | Run unit tests inside Docker (validates Dockerfile.test) |
| **E2E Tests** | Cypress against SSR app (port 4000), `continue-on-error` until API mocked |

## CD Pipeline (cd.yml)

On push to `main` (or tags `v*`), pushes Docker image to GitHub Container Registry:
- `ghcr.io/<owner>/al-noon-store:main`
- `ghcr.io/<owner>/al-noon-store:sha-<short-sha>`

## Environment

- **E2E**: May need backend API. Set `continue-on-error: false` in ci.yml when ready.
- **Production API**: Override `apiUrl`/`apiOrigin` via env at runtime in the container.

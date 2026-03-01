# API Configuration – Al-Noon Landing Page

How to point the landing page at the Al-Noon backend API.

---

## Quick Setup (Local Development)

1. **Start the backend** (from `Al-noon-dashboard`):
   ```bash
   cd server && npm run dev
   ```
   Backend runs at `http://localhost:4000` (set `PORT=4000` in `server/.env`).

2. **Start the landing page**:
   ```bash
   ng serve
   ```
   Landing page runs at `http://localhost:4200` and uses `http://localhost:4000/api` by default.

3. **CORS**: The backend allows `http://localhost:4200`. If you use a different port, add it to `server/src/app.ts` `allowedOrigins` or set `CLIENT_URL` in the backend `.env`.

---

## Configuring API URL

### Development (`ng serve`)

Edit **`src/environments/environment.ts`**:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:4000/api',      // API base (no trailing slash)
  apiOrigin: 'http://localhost:4000',         // For image paths (e.g. /uploads/...)
};
```

### Production (`ng build`)

Edit **`src/environments/environment.prod.ts`** before building:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-api-host.com/api',
  apiOrigin: 'https://your-api-host.com',
};
```

Replace `your-api-host.com` with your deployed backend URL (e.g. `api.noon-store.com` or `your-app.onrender.com`).

---

## File Replacement (Production Build)

`ng build` (production) automatically uses `environment.prod.ts` instead of `environment.ts` via `fileReplacements` in `angular.json`.

---

## Backend Requirements

The landing page expects the backend to expose:

- `GET /api/store/home` – Home data (store, hero, collections, etc.)
- `GET /api/products` – Product list with filters
- `GET /api/products/:id` – Product detail (ObjectId only; FE resolves slug→id via `?slug=` before calling)
- `POST /api/checkout` – Create order (guest or authenticated)
- `GET /api/shipping-methods` – Shipping options
- `GET /api/payment-methods` – Payment options
- `GET /api/cities` – Cities (for delivery fee)
- `GET /api/settings` – Store settings, content pages
- And others – see OpenAPI spec at `http://localhost:4000/api-docs`

**cURL examples:** `docs/PRODUCTS-CURL-EXAMPLES.md`, `docs/CHECKOUT-CURL-EXAMPLES.md`

---

## Frontend Responsibilities (API Contract Sync)

When the backend API changes, the frontend must stay in sync.

### 1. Regenerate API types

```bash
# With backend running on port 4000 (fetches spec, saves spec.json, generates api.schema.ts)
npm run sync:api

# Or use existing spec.json (works offline; run sync:api first when BE is running)
npm run generate:api-types:local
```

### 2. Pre-build hook

Every `ng build` runs `prebuild`, which attempts to regenerate types. If the backend is unreachable and no `spec.json` exists, the build continues (no fail).

### 3. After regenerating

1. Run `ng build` – TypeScript errors show affected services/components.
2. Update `api.types.ts` if hand-written types no longer match the schema.
3. Update normalizers (e.g. `product-normalizer.ts`) if response shapes changed.
4. Update [API-AUDIT.md](./API-AUDIT.md) if you add or remove storefront APIs.

### 4. Finding affected pages

After regeneration, build errors point to:

- `src/app/core/services/*.ts` – API calls
- `src/app/pages/**/*.ts` – Page components
- `src/app/core/utils/product-normalizer.ts` – Product mapping

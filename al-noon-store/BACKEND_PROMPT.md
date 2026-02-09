# Backend (BE) prompt: handle missing parts for the store frontend (FE)

Use this prompt when working on the **Al-noon-dashboard** backend so it fully supports the **al-noon-store** Angular frontend. Implement any missing or inconsistent behavior described below.

---

## 1. Guest checkout (critical – currently missing)

The FE supports **guest checkout**: users can place an order **without being logged in** by providing guest contact details.

- **Current BE:** All order routes are behind `authenticate`; `createOrder` requires `req.auth` and uses `user: req.auth.userId`. The FE sends `guestName`, `guestEmail`, and optional `guestPhone` in the request body when the user is not logged in.
- **Required BE behavior:**
  - **POST /api/orders** must support **two flows**:
    1. **Authenticated:** Same as today: require `authenticate`, use `req.auth.userId` as `user`.
    2. **Guest:** When the request is **not** authenticated (no cookie/token or invalid/expired), accept the same body **plus** `guestName`, `guestEmail`, and optional `guestPhone`. Create the order without a linked user (or with a dedicated “guest” user / null user reference, depending on your schema).
  - **Request body (align with FE):** Accept and validate:
    - `items` (array of `{ product, quantity, price }`)
    - `paymentMethod` (optional: `COD` | `INSTAPAY`)
    - `shippingAddress` (optional string)
    - `deliveryFee` (optional number ≥ 0)
    - **Guest-only:** `guestName` (string, required when unauthenticated), `guestEmail` (string, required when unauthenticated), `guestPhone` (optional string).
  - **Validation:** If unauthenticated, require `guestName` and `guestEmail` (and optionally validate email format). If authenticated, ignore or reject guest fields to avoid confusion.
  - **Storage:** Persist guest contact info on the order (e.g. `guestName`, `guestEmail`, `guestPhone` on the Order model or in a nested object) so admins and notifications can use it. Keep existing behavior for orders linked to `user`.
- **Optional:** Support **GET /api/orders/:id** for guests (e.g. for “view your order” links in emails). For example: allow unauthenticated access when query params include the guest email used at checkout (e.g. `?email=...`) and the order is a guest order with that email; return 403/404 otherwise.

---

## 2. API response shapes (FE expectations)

The FE normalizes responses but expects the following. Keep these consistent.

- **Success:** `{ success: true, data?: T, message?: string, pagination?: { total, page, limit, totalPages } }`.
- **Error:** `{ success: false, message: string, code?: string, data: null, details?: unknown }`. Use translated `message` via locale (e.g. `x-language` / `Accept-Language`).
- **List endpoints:** Prefer either:
  - `{ success: true, data: <array>, pagination }` (e.g. products, orders list), or
  - `{ success: true, data: { <entityPlural>: <array> }, pagination }` (e.g. `data: { orders: [] }`).  
  The FE handles both; stay consistent per endpoint.
- **Single-entity endpoints:** Prefer `{ success: true, data: { <entity>: <object> } }` (e.g. `data: { order: {...} }`, `data: { product: {...} }`) so the FE can read `data.order` / `data.product`. The FE also accepts `data` being the entity directly in some cases.
- **Products list:** FE accepts `data` as an array of products **or** `data.products`; pagination at top level: `pagination: { total, page, limit, totalPages }`.
- **Orders list:** FE accepts `data` as an array **or** `data.orders`; `pagination` at top level.
- **Categories:** FE accepts `data` as an array **or** `data.categories`; no pagination.
- **Cities:** FE accepts `data` as an array **or** `data.cities`; no pagination.
- **Auth:** FE expects `data: { token, user: { id, name, email, role } }`. Cookie-based auth is fine; FE sends `withCredentials: true`.

---

## 3. Locale and headers

- FE sends **`x-language`** and **`Accept-Language`** with values `en` or `ar` on every API request (from store).
- BE should use this for:
  - Translating error messages and success messages (e.g. `sendError` / `sendResponse` with i18n keys).
  - Any locale-specific content in responses.

---

## 4. Storefront-specific endpoints (already used by FE)

Ensure these exist and match FE usage:

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/store | Store config (name, logo, hero, homeCollections, newArrivalsLimit, feedbacks, etc.) |
| GET | /api/store/page/:slug | Content page by slug (e.g. privacy, return-policy, shipping-policy, about, contact) |
| POST | /api/store/contact | Contact form: body `{ name, email, phone?, comment }` |
| POST | /api/newsletter/subscribe | Newsletter: body `{ email }`; return 2xx or **409** for “already subscribed” (FE treats 409 as already subscribed) |
| GET | /api/products | List products; query: page, limit, status, category, newArrival, availability (inStock \| outOfStock), sort, minPrice, maxPrice, color, search |
| GET | /api/products/:id | Single product |
| GET | /api/products/:id/related | Related products (array) |
| GET | /api/categories | List categories; FE filters by status === 'PUBLISHED' (return status so FE can filter, or only return published) |
| GET | /api/cities | List cities |
| GET | /api/cities/:id | Single city (e.g. for checkout delivery fee) |
| POST | /api/auth/sign-up | Body `{ name, email, password }`; response `data: { token, user }` |
| POST | /api/auth/sign-in | Body `{ email, password }`; response `data: { token, user }` |
| GET | /api/auth/profile | Current user (authenticated); response e.g. `data: { user }` |
| POST | /api/auth/sign-out | Sign out (authenticated) |
| GET | /api/orders | List orders (authenticated; for guests no list unless you add a special link) |
| GET | /api/orders/:id | Single order (authenticated, or guest by id + email if you add it) |
| POST | /api/orders | Create order (authenticated **or** guest with guestName, guestEmail, guestPhone) |

---

## 5. Products list (catalog) query params

FE sends these; BE should support them as follows:

- **status:** `ACTIVE` | `INACTIVE`. Storefront uses `ACTIVE` only.
- **availability:** `inStock` (stock > 0) | `outOfStock` (stock === 0). Do **not** use value `inactive` for availability.
- **sort:** `newest` | `priceAsc` | `priceDesc` | `nameAsc` | `nameDesc` | `bestSelling` | `highestSelling` | `lowSelling`.
- **category:** Category id (e.g. MongoDB ObjectId string).
- **newArrival:** `true` (string) for home page new arrivals.
- **search:** String; search in name and description (e.g. en/ar).
- **minPrice / maxPrice:** Numbers; filter by effective price (discountPrice if present, else price).
- **color:** String; case-insensitive match on product colors.
- **page, limit:** Pagination; response must include `pagination: { total, page, limit, totalPages }`.

---

## 6. Store response (GET /api/store)

FE expects the store object to include (among others):

- **quickLinks:** Array of `{ label: { en, ar }, url }` (FE maps `label` → `title`).
- **feedbacks:** Array of `{ _id, product: { name: { en, ar } }, customerName, message, rating, image? }` (FE maps `_id` → `id`, `message` → `comment`).
- **hero:** `{ images[], videos[], title, subtitle, ctaLabel, ctaUrl }` (all localized where applicable).
- **homeCollections:** Array of `{ title, image, url, order }`.
- **newArrivalsLimit,** **feedbackSectionEnabled,** **feedbackDisplayLimit,** **ourCollectionSectionImages,** **ourCollectionSectionVideos,** etc.

No change needed if you already return these; just ensure **quickLinks** use `label` (or document that FE accepts `title` too) and **feedbacks** use `message` (FE uses it as comment).

---

## 7. Newsletter (POST /api/newsletter/subscribe)

- On success: return **2xx** and optionally `{ success: true, message?: string }`.
- When the email is **already subscribed:** return **409 Conflict** and a body the FE can detect (e.g. `code: 'CONFLICT'` or `alreadySubscribed: true`). FE uses this to show “Already subscribed” instead of a generic error.

---

## 8. CORS and credentials

- FE calls the API with **credentials** (`withCredentials: true`). BE must allow the store origin (e.g. `http://localhost:4200`) in CORS and use `credentials: true` (or equivalent) so cookies (e.g. auth cookie) are sent and received.

---

## 9. Error codes (optional but helpful)

FE can show better messages if BE uses consistent error codes, e.g.:

- `errors.auth.unauthorized` (401)
- `errors.auth.user_exists` (409 for sign-up)
- `errors.order.not_found` (404)
- `errors.contact.email_required` / `errors.contact.comment_required`
- `errors.newsletter.not_available` / already subscribed
- `errors.common.db_unavailable` (503)

Use the same codes in `sendError(..., { code: '...' })` and translate `message` with the locale from the request.

---

## 10. Summary checklist for BE

- [ ] **Guest checkout:** POST /api/orders without auth when body includes guestName, guestEmail (and optionally guestPhone); persist guest info on the order.
- [ ] **Orders list response:** Either `data: orders[]` with root-level `pagination`, or `data: { orders, pagination }`; FE supports both.
- [ ] **Products list response:** Either `data: product[]` with root-level `pagination`, or `data: { products, pagination }`; FE supports both.
- [ ] **Newsletter:** 409 for already subscribed; success body with optional message.
- [ ] **Locale:** Honor `x-language` / `Accept-Language` (en | ar) for messages.
- [ ] **Categories:** Include `status` in each category so FE can filter by PUBLISHED, or only return published categories.
- [ ] **CORS:** Allow store origin with credentials.
- [ ] **Product ids:** FE accepts either `id` or `_id` on products/orders (FE normalizes to `id`).

Use this document to implement or adjust the backend so the store frontend works end-to-end without missing or inconsistent behavior.

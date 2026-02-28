# API Audit – Storefront vs Schema

Generated from `api.schema.ts` (OpenAPI spec). Storefront calls are relative (e.g. `products`) and prefixed with `environment.apiUrl` (e.g. `http://localhost:4000/api`).

---

## Storefront APIs Used

| API | Method | Service | Usage |
|-----|--------|---------|-------|
| `/api/store/home` | GET | StoreService | Home page (hero, new arrivals, collections, etc.) |
| `/api/store/page/{slug}` | GET | StoreService | CMS pages (privacy, shipping, etc.) |
| `/api/store/contact` | POST | ContactService | Contact form |
| `/api/newsletter/subscribe` | POST | NewsletterService | Footer newsletter |
| `/api/auth/sign-in` | POST | AuthService | Login |
| `/api/auth/sign-up` | POST | AuthService | Register |
| `/api/auth/profile` | GET | AuthService | Current user |
| `/api/auth/sign-out` | POST | AuthService | Logout |
| `/api/products` | GET | ProductsService | Catalog (search, filters, pagination) |
| `/api/products/{id}` | GET | ProductsService | Product detail |
| `/api/products/{id}/related` | GET | ProductsService | Related products |
| `/api/products/filters/sort` | GET | ProductsService | Sort dropdown options |
| `/api/categories` | GET | CategoriesService | Category list |
| `/api/checkout` | POST | OrdersService | Place order |
| `/api/orders` | GET | OrdersService | Order history (logged-in) |
| `/api/orders/{id}` | GET | OrdersService | Order detail (logged-in) |
| **`/api/orders/guest/{id}`** | **GET** | **OrdersService** | **Guest order lookup (public)** |
| `/api/shipping-methods` | GET | ShippingService | Checkout shipping options |
| `/api/payment-methods` | GET | PaymentMethodsService | Checkout payment options |
| `/api/cities` | GET | CitiesService | City dropdown + delivery fees |
| `/api/cities/{id}` | GET | CitiesService | Single city (if used) |
| `/api/settings` | GET | StoreService | App settings |
| `/api/ai/settings` | GET | AiChatService | Chatbot config |
| `/api/ai/chat` | POST | AiChatService | Chatbot messages |

---

## New API: Guest Order Lookup

### `GET /api/orders/guest/{id}?email=xxx`

- **Purpose**: Allow guests to view order confirmation after refresh or when `sessionStorage` is cleared.
- **Security**: Requires `email` query param; backend should verify it matches the order.

### Frontend Flow

1. **Checkout success (guest)**  
   - Navigate to `/order-confirmation?id={orderId}&email={email}` with `state: { order }`
2. **Order confirmation component**  
   - 1) Use `history.state.order` if present  
   - 2) Else use `sessionStorage.getItem('al_noon_last_order')`  
   - 3) Else if `?id=` and `?email=` in URL → call `getGuestOrder(id, email)` → show order or error

### Backend Requirements

- Accept `GET /api/orders/guest/:id?email=xxx`
- Validate `email` matches order (or equivalent security check)
- Return order with same structure as `GET /api/orders/:id`
- Public (no auth required)

---

## APIs in Schema but Not Used by Storefront

| API | Notes |
|-----|-------|
| `/api/health` | Health check (dev/ops) |
| `/api/subscribers` | Admin |
| `/api/products/{id}/status`, `/stock` | Admin |
| `/api/products/images`, `/videos` | Admin |
| `/api/categories/{id}` | Not used |
| `POST /api/orders` | Frontend uses `/api/checkout` instead |
| `/api/orders/{id}/status`, `/cancel`, `/payment-proof`, `/payments/confirm` | Admin |
| `/api/users`, `/api/roles`, etc. | Admin |
| `/api/contact`, `/api/feedback` | Alternate/legacy |
| `/api/inventory/*`, `/api/dashboard/*`, `/api/reports` | Admin |
| `/api/settings/*` (logo, images, etc.) | Admin |

---

## Status

| Item | Status |
|------|--------|
| Guest order API in schema | ✅ Present |
| `OrdersService.getGuestOrder(id, email)` | ✅ Implemented |
| Checkout passes `?id=` & `?email=` | ✅ Yes |
| Order-confirmation fallback chain | ✅ state → sessionStorage → getGuestOrder |
| Error state when getGuestOrder fails | ✅ `loadError` signal |

---

## Regenerating Schema

```bash
# From backend running at localhost:4000
npm run generate:api-types

# From local spec file
npm run generate:api-types:local
```

# Frontend Recommendations – Al-Noon Landing Page

What the landing page should add to integrate with the backend and improve UX.

---

## ✅ Existing Features (Already Implemented)

| Feature | Location | Status |
|---------|----------|--------|
| Cart (localStorage) | `cart.service.ts` | Done |
| Product search + filters | `catalog.component` | Done |
| Checkout form | `checkout.component` | Done |
| Shipping method selection | `shipping.service` + checkout | Done |
| Payment method selection | `payment-methods.service` + checkout | Done |
| Billing address (optional separate) | Checkout | Done |
| Guest checkout | Checkout + order-confirmation | Done |
| Order confirmation (sessionStorage fallback) | `order-confirmation.component` | Done |
| Empty cart / no shipping / no payment blocking | Checkout | Done |
| Product discount display (`discountPrice`) | Product detail, catalog | Done |
| i18n (EN/AR, RTL) | ngx-translate | Done |
| AI chatbot | `chatbot.component` | Done |

---

## 🔧 Recommended Additions

### 1. **Checkout 400 error handling (Stock / validation)**

**Priority:** High

**What:** When `POST /api/checkout` returns `400` (e.g., "Product X is out of stock"), show the backend message to the user.

**Current:** The checkout uses `err?.message` which often gets the generic Angular error string. Backend messages are typically in `err.error?.message`.

**Add:**
- Extract message from `err?.error?.message ?? err?.message ?? 'errors.placeOrderFailed'`
- Optionally: on stock/validation 400, offer a link to "View cart" so the user can remove out-of-stock items

**Files:** `checkout.component.ts` (error handler in `submit()`)

---

### 2. **Discount code UI (when backend supports it)**

**Priority:** Low (wait for backend)

**What:** Unhide the discount code section in checkout and send `discountCode` in the checkout body.

**Current:** UI is commented/hidden at `checkout.component.html:308` with:
```html
<!-- Discount code (hidden until BE supports discountCode in checkout API) -->
```

**Add when backend ready:**
- Input field + "Apply" button
- Add `discountCode` to `CreateOrderBody` in API types and to the checkout request
- Display applied discount in summary
- i18n keys already exist: `checkout.discountCode`, `checkout.apply`

---

### 3. **Guest order lookup** ✅ Implemented

**What:** Use `GET /api/orders/guest/:id?email=xxx` to restore order confirmation after tab close.

**Implementation:**
- Checkout navigates to `/order-confirmation?id=xxx&email=yyy` for guests (URL has lookup keys)
- Order-confirmation: 1) router state 2) sessionStorage 3) query params → `getGuestOrder(id, email)`
- Shows loading state while fetching; fallback "Order not found" on error

---

### 4. **429 rate limit handling**

**Priority:** Low

**What:** Display a user-friendly message when checkout is rate-limited (429).

**Current:** `api.interceptor.ts` retries 429 once after a delay; if it still fails, the error bubbles up.

**Add:**
- In checkout error handler, detect `err?.status === 429` and show a specific message (e.g., "Too many requests. Please wait a moment and try again.")
- Add i18n key: `errors.rateLimited`

---

### 5. **Cart sync after out-of-stock error**

**Priority:** Medium (UX)

**What:** When checkout fails with "out of stock", suggest updating the cart.

**Add:**
- On 400 with message containing "out of stock" (or similar), optionally show a secondary action: "Update cart" that navigates to `/cart`
- Consider: after such an error, optionally call a "validate cart" endpoint (if backend adds one) or refresh product stock and highlight affected items

---

### 6. **README / Checkout requirement fix**

**Current:** README says "checkout requires login" but guest checkout is supported.

**Add:** Update README to: "Checkout: guest or logged-in. City selector, delivery fee, shipping address, COD or InstaPay."

---

## Summary

| Priority | Task | Effort |
|----------|------|--------|
| **High** | Extract backend error message from `err.error?.message` in checkout | Small |
| **Medium** | "Update cart" link when checkout fails with stock error | Small |
| **Low** | Unhide discount code UI when backend supports it | Small |
| ~~**Low**~~ | ~~Guest order lookup when backend adds endpoint~~ | ✅ Done |
| **Low** | 429 rate limit message | Small |
| **Trivial** | README checkout description | Trivial |

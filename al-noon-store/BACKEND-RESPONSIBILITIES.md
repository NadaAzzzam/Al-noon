# Backend Responsibilities – Al-Noon Store

The frontend handles validation, UX, and orchestration. The backend must enforce business rules and data integrity.

---

## ✅ Already Handled by Frontend

| Scenario | Frontend Handling |
|----------|-------------------|
| Empty cart at checkout | Shows empty state, blocks submit |
| No shipping methods | Blocks submit, shows message |
| No payment methods | Blocks submit, shows message |
| Guest order confirmation refresh | Persists order in `sessionStorage` |
| Billing address validation | Validates when "different billing" selected |
| Search trim | Trims search before API call |
| Product search | Sends `search` param to products API |
| Duplicate order on double click | Submit button disabled while `submitting` |
| Add more than stock (cart) | CartService validates with `maxStock`; checkout re-validates via BE |
| Invalid email / weak password format | Form validators before submit |

---

## 🔧 Backend Must Handle

### 1. **Stock validation at checkout**
- **What**: When `POST /api/checkout` is called, validate that each cart item (product + variant) is still in stock.
- **Why**: Cart can be stale; user may have added items hours ago.
- **Expected**: Return `400` with a clear message (e.g. `"Product X is out of stock"`) if any item exceeds available stock. Do not create the order.

### 2. **Discount codes (future)**
- **What**: Add `discountCode` (or similar) to the checkout request body and apply it server-side.
- **Why**: Discount logic (validity, amount, expiry) must be enforced on the backend.
- **Current**: ✅ Backend accepts `discountCode` in checkout body; frontend sends it when user applies a code.

### 3. **Guest order lookup (optional)**
- **What**: Public endpoint to fetch a guest order by ID, e.g. `GET /api/orders/guest/:id?email=xxx`.
- **Why**: Allows guests to view order confirmation after refresh without storing full order in `sessionStorage`.
- **Current**: Frontend uses `sessionStorage` as a fallback; this works but is lost when the tab is closed.

### 4. **Shipping & payment method validation**
- **What**: Reject checkout if `shippingMethod` or `paymentMethod` is invalid or disabled.
- **Why**: Frontend blocks when no methods exist, but backend should still validate IDs and status.

### 5. **Price consistency**
- **What**: Recompute item prices and delivery fee on the backend; do not trust client values.
- **Why**: Prevents tampering with prices in the request.

### 6. **Rate limiting**
- **What**: Rate limit checkout and other sensitive endpoints.
- **Why**: Reduces abuse and spam orders.

### 7. **Auth & session**
- **Register with existing email**: Return clear error (e.g. 409) so frontend can show message.
- **Login with wrong password**: Return 401 with message.
- **Session timeout**: Token expiry; return 401 when expired.
- **Refresh while logged in**: Validate token from storage; refresh profile if valid.

### 8. **Discount / coupon validation**
- **Invalid coupon**: Return 400 with message (frontend already handles).
- **Expired coupon**: Validate expiry server-side; return 400.
- **Coupon cannot exceed cart total**: Cap discount server-side.

### 9. **Order rules**
- **User cannot cancel shipped order**: Reject cancel if status = shipped.
- **Payment failure**: Handle gateway errors; return appropriate status/message.

### 10. **Security**
- **SQL injection in search**: Sanitize/parameterize all queries.
- **XSS in review/input**: Sanitize stored content; CSP headers.
- **Access admin route as normal user**: Role-based auth; reject unauthorized.
- **Modify price in request**: Ignore client prices; recompute server-side.

---

## 📋 ADVANCED SCENARIOS – Ownership Matrix

### 🛒 Cart Edge Cases

| Scenario | Owner | Notes |
|----------|-------|-------|
| Add product → change price in backend → cart updates/locks price | **BE** | BE recomputes at checkout; FE displays cart with stored prices until checkout |
| Add item → logout → login → cart restored correctly | **FE** | Guest cart in localStorage; logged-in cart merge is optional (BE or FE sync) |
| Add item in two tabs → cart sync behavior | **FE** | localStorage shared; optionally use `storage` event for cross-tab sync |
| Remove item in one tab → other tab reflects change | **FE** | Same as above; `storage` event listener |
| Cart expiration after X minutes | **FE or BE** | FE: clear localStorage after TTL; BE: if cart is server-side |
| Currency change → cart total recalculates | **FE** | LocaleService; display only; prices from API |
| Free shipping threshold logic (exact boundary) | **BE** | Backend computes eligibility; FE displays |

### 💳 Payment & Financial (Critical)

| Scenario | Owner | Notes |
|----------|-------|-------|
| Double-click "Pay Now" → only one order created | **FE** ✅ | Button disabled while `submitting` |
| Refresh during payment callback | **BE + FE** | BE: idempotency key; FE: session/state recovery |
| Payment success but order API fails | **BE** | Backend must handle gateway vs order consistency |
| Order created but payment fails | **BE** | Backend reconciliation/refund logic |
| Timeout from payment gateway | **BE** | Gateway integration; retry or user messaging |
| Retry payment flow | **BE + FE** | BE: retry endpoint; FE: retry button |
| Partial payment (if supported) | **BE** | Business logic |
| Cash on delivery vs card logic | **BE** | Different validation and flow per method |
| VAT/tax calculation per country | **BE** | Tax rules server-side |
| Rounding issues (0.1 + 0.2) | **BE** | Use decimal/fixed-point; never float for money |

### 📦 Inventory & Stock

| Scenario | Owner | Notes |
|----------|-------|-------|
| Two users buy last item simultaneously | **BE** | Optimistic locking, DB constraints |
| Stock reaches 0 while product page open | **BE** | Revalidate at add-to-cart and checkout |
| Pre-order product behavior | **BE** | Business logic |
| Backorder allowed vs not allowed | **BE** | Per-product config |
| Product becomes disabled while in cart | **BE** | Reject checkout; FE shows "Update cart" on 400 |
| Flash sale inventory handling | **BE** | Reserved inventory, time windows |

### 🏷 Discount & Promotion

| Scenario | Owner | Notes |
|----------|-------|-------|
| Multiple coupons applied | **BE** | Policy: one or many; enforce server-side |
| Coupon + automatic promotion conflict | **BE** | Stacking rules |
| Buy 2 get 1 free logic | **BE** | Promotion engine |
| Category-specific discount | **BE** | Rules engine |
| User-specific discount | **BE** | Auth + discount logic |
| First-order-only coupon | **BE** | Order history check |
| Minimum cart amount boundary (exact value) | **BE** | E.g. cart = 99.99, min = 100 → reject |
| Coupon max usage reached | **BE** | Usage tracking |

### 🌍 Internationalization (Multi-Country)

| Scenario | Owner | Notes |
|----------|-------|-------|
| Currency conversion | **BE** | Exchange rates, display |
| RTL layout | **FE** | Angular i18n, dir attribute |
| Different tax rules per country | **BE** | Tax service |
| Shipping restriction per country | **BE** | Validation |
| Phone validation per country | **FE + BE** | FE: format hint; BE: enforce |
| Address format validation | **FE + BE** | Country-specific rules |

### 🔐 Security & Abuse

| Scenario | Owner | Notes |
|----------|-------|-------|
| Modify price in DevTools request | **BE** | Ignore client prices; recompute |
| Change quantity to negative in request | **BE** | Validate quantity > 0 |
| Access another user's order via URL | **BE** | AuthZ: order ownership |
| Bypass checkout steps via direct URL | **FE + BE** | FE: route guard; BE: validate full flow |
| Add admin-only field via request body | **BE** | Reject unknown/forbidden fields |
| JWT tampering | **BE** | Signature validation |
| CSRF attempt | **BE** | CSRF tokens, SameSite cookies |
| XSS in user input | **BE** | Sanitize stored content |

### ⚡ Performance & Stress

| Scenario | Owner | Notes |
|----------|-------|-------|
| 1000 concurrent users | **BE** | Load balancing, DB pooling |
| Add 500 products in cart | **FE + BE** | FE: UI limits; BE: request size limits |
| Checkout under slow network | **FE** | Loading states, timeout handling |
| Image-heavy product page | **FE** | Lazy load, placeholder |
| API returns 5000 products | **BE** | Pagination, indexing |
| Memory leak on repeated navigation | **FE** | Unsubscribe, destroy refs |

### 🔵 Edge Cases (Often Forgotten)

| Scenario | Owner | Notes |
|----------|-------|-------|
| User deletes account → orders remain? | **BE** | Policy: anonymize vs delete |
| Email change → verification required? | **BE** | Email verification flow |
| Browser back button during checkout | **FE** | Preserve form state or warn |
| Refresh during checkout step 2 | **FE** | Form restore or redirect |
| Timezone difference in order date | **BE** | Store UTC; display in user TZ |
| Scheduled delivery date validation | **BE** | Date rules |
| Retry API after failure | **FE** | Retry button or auto-retry |
| Error toast stacking | **FE** | Toast service queue |
| Accessibility (tab, ARIA) | **FE** | A11y best practices |

### 🔵 Admin Panel (If Exists)

| Scenario | Owner | Notes |
|----------|-------|-------|
| Add/Edit/Delete product | **BE** | CRUD, authZ |
| Disable product | **BE** | Exclude from catalog |
| Bulk upload | **BE** | Validation, rate limits |
| Order status change | **BE** | Workflow |
| Refund logic | **BE** | Payment gateway + ledger |
| Role-based permissions | **BE** | RBAC |
| Sales report accuracy | **BE** | Aggregation |

---

## Summary

| Priority | Backend Task | Status |
|----------|--------------|--------|
| **High** | Stock validation at checkout | ✅ Implemented |
| **High** | Recompute prices server-side | ✅ Implemented |
| **High** | Reject negative quantity in request | Recommended |
| **Medium** | Validate shipping/payment method IDs | ✅ Implemented |
| **Medium** | Idempotency for checkout (refresh during payment) | Recommended |
| **Low** | Discount code API | ✅ Implemented |
| **Low** | Guest order lookup endpoint | ✅ Implemented |
| **Low** | Rate limiting | Recommended |

**Guest order lookup**: `GET /api/orders/guest/:id?email=xxx` – public; requires matching email.

---

## Frontend Integration

See [FRONTEND-RECOMMENDATIONS.md](./FRONTEND-RECOMMENDATIONS.md) for what the landing page should add to work well with these backend behaviors.

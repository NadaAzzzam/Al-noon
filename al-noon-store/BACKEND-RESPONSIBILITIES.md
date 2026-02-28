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

## Summary

| Priority | Backend Task | Status |
|----------|--------------|--------|
| **High** | Stock validation at checkout | ✅ Implemented |
| **High** | Recompute prices server-side | ✅ Implemented |
| **Medium** | Validate shipping/payment method IDs | ✅ Implemented |
| **Low** | Discount code API | ✅ Implemented |
| **Low** | Guest order lookup endpoint | ✅ Implemented |

**Guest order lookup**: `GET /api/orders/guest/:id?email=xxx` – public; requires matching email.

---

## Frontend Integration

See [FRONTEND-RECOMMENDATIONS.md](./FRONTEND-RECOMMENDATIONS.md) for what the landing page should add to work well with these backend behaviors.

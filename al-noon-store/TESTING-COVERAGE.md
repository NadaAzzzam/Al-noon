# Testing Coverage – Al-Noon Store

Maps the requested scenarios to existing tests and gaps. **BE** = Backend responsibility.

---

## 1. E2E Scenarios

### 1.1 User Registration & Login

| Scenario | Covered | Location | Notes |
|----------|---------|----------|-------|
| Register with valid email & password | Partial | auth.cy.ts (form) | E2E submits login; register form displayed |
| Email verification | **BE** | - | Backend sends verification flow |
| User logs in successfully | Yes | auth.cy.ts | Intercepts sign-in, submits |
| User redirected after login | **BE + routing** | auth.cy.ts | Depends on API success |
| Register with existing email | Partial | register.component.spec.ts (unit) | Add unit test for API error |
| Invalid email format | Yes | form-validators.spec.ts | emailError, emailErrorKey |
| Weak password | Yes | form-validators.spec.ts | passwordError min length |
| Login with wrong password | Partial | login.component.spec.ts (unit) | Add unit test for API error |
| Session timeout | **BE** | - | Token expiry, 401 handling |
| Refresh page while logged in | **BE** | - | Token in storage, profile reload |

### 1.2 Product Browsing

| Scenario | Covered | Location | Notes |
|----------|---------|----------|-------|
| View product list | Yes | catalog.cy.ts | Loads products, displays or empty state |
| Filter by category | Partial | catalog.cy.ts | Can add filter UI test |
| Sort by price (asc/desc) | Partial | catalog.component (unit) | Sort options from API |
| Search by product name | Partial | catalog (API) | Search param sent to API |
| Pagination | Partial | Catalog component | Pagination logic |
| Search returns empty result | Partial | catalog.cy.ts | Empty state path |
| Filter + search combined | **BE** | - | API combines params |
| Slow API response | E2E optional | - | `cy.intercept` delay |
| API fails (error state) | Partial | - | Add catalog error E2E |

### 1.3 Product Details Page

| Scenario | Covered | Location | Notes |
|----------|---------|----------|-------|
| Correct product info shown | Partial | product-detail.component.spec.ts | Basic create |
| Price correct | Partial | product-availability, price pipe | Unit tests |
| Stock status accurate | Yes | product-availability.spec.ts | Variant stock logic |
| Images load correctly | E2E | product-detail.cy.ts (to add) | |
| Related products displayed | Partial | product-detail (unit) | |
| Out-of-stock product | Yes | product-availability.spec.ts | isVariantAvailable, soldOut |
| Invalid product ID in URL | Partial | product-detail | API 404, component null |
| Price = 0 | Partial | price.pipe.spec.ts | Add 0 test |
| Image fails to load | **BE + img error** | - | Broken URL, alt text |

### 1.4 Add to Cart

| Scenario | Covered | Location | Notes |
|----------|---------|----------|-------|
| Add single product | Yes | cart.service.spec.ts | add() |
| Increase quantity | Yes | cart.service.spec.ts | setQuantity, merge |
| Decrease quantity | Yes | cart.service.spec.ts | setQuantity, remove at 0 |
| Remove product | Yes | cart.service.spec.ts, cart.component.spec.ts | |
| Cart persists after refresh | Yes | cart.service.spec.ts | localStorage mock |
| Add more than available stock | Yes | cart.service.spec.ts | respect maxStock |
| Add same product twice | Yes | cart.service.spec.ts | merge quantity |
| Add when not logged in (guest) | Yes | Checkout supports guest | No login required |

### 1.5 Checkout Process

| Scenario | Covered | Location | Notes |
|----------|---------|----------|-------|
| Add address | Yes | checkout.cy.ts | Form exists |
| Select shipping method | Yes | checkout (unit/E2E) | |
| Apply coupon | Yes | checkout.cy.ts, checkout.component.spec.ts | |
| Select payment method | Yes | checkout | |
| Confirm order | Yes | checkout.cy.ts | Full flow to order-confirmation |
| Order confirmation page | Yes | checkout.cy.ts | URL includes order-confirmation |
| Invalid coupon | Yes | checkout.cy.ts, checkout.component.spec.ts | 400 discount error |
| Expired coupon | **BE** | - | Backend validates expiry |
| Payment failure | **BE** | - | Backend payment gateway |
| Network error during payment | Partial | checkout (unit) | extractErrorMessage, generic error |
| Back button during checkout | E2E optional | - | No blocker |
| **Double-click prevention** | Yes | checkout.component.html | `[disabled]="submitting()"` |

### 1.6 Order History

| Scenario | Covered | Location | Notes |
|----------|---------|----------|-------|
| View past orders | Partial | orders.component.spec.ts, orders.cy.ts (to add) | Auth required |
| View order details | Partial | order-detail.component.spec.ts | |
| Cancel order | **BE** | - | If allowed, API |
| Reorder functionality | **BE** | - | Feature-dependent |

### 1.7 User Profile

| Scenario | Covered | Location | Notes |
|----------|---------|----------|-------|
| Update personal info | **BE** | - | Profile API |
| Change password | **BE** | - | Auth API |
| Logout | Partial | auth | Token clear |
| Session invalidation after logout | **BE** | - | Token revocation |

---

## 2. Unit Testing Scenarios (Angular)

### 2.1 Service Layer

| Service | Scenario | Covered | Location |
|---------|----------|---------|----------|
| ProductsService | Fetch products | **BE + HttpClient** | No unit (uses Http) |
| ProductsService | Handle API error | **BE** | Error from API |
| ProductsService | Map response | product-normalizer.spec.ts | Normalization |
| CartService | addToCart | Yes | cart.service.spec.ts |
| CartService | removeFromCart | Yes | cart.service.spec.ts |
| CartService | updateQuantity | Yes | cart.service.spec.ts |
| CartService | calculateTotal | Yes | cart.service.spec.ts (subtotal) |
| CartService | Total price calculation | Yes | |
| CartService | Quantity edge cases (0, negative) | Partial | setQuantity&lt;1 removes |
| CartService | LocalStorage sync | Yes | localStorage mock |

### 2.2 Component Logic

| Component | Scenario | Covered | Location |
|-----------|----------|---------|----------|
| ProductCardComponent | Displays product data | Yes | product-card.component.spec.ts |
| ProductCardComponent | Link to product detail | Yes | |
| CartComponent | Displays cart items | Yes | cart.component.spec.ts |
| CartComponent | Empty state | E2E cart.cy.ts | |
| CartComponent | Total updates on change | Yes | cart service subtotal |

### 2.3 Utility Functions

| Utility | Scenario | Covered | Location |
|---------|----------|---------|----------|
| Price formatting | Basic | Yes | price.pipe.spec.ts |
| Price formatting | 0, negative, float | Partial | Add tests |
| Form validators | Email, password, required | Yes | form-validators.spec.ts |
| Discount calculation | product-availability | Yes | product-availability.spec.ts |
| getLocalized | Yes | localized.spec.ts | |

### 2.4 Guards & Auth

| Scenario | Covered | Location |
|----------|---------|----------|
| AuthGuard allows logged-in user | Yes | auth.guard.spec.ts |
| AuthGuard blocks guest | Yes | auth.guard.spec.ts |
| Token expiration handling | **BE** | 401 response |

### 2.5 State (Signals)

| Scenario | Covered | Location |
|----------|---------|----------|
| Cart signals (items, subtotal) | Yes | cart.service.spec.ts |
| Component computed values | Yes | Various component specs |

---

## 3. Critical Business Rules

| Rule | Frontend | Backend | Notes |
|------|----------|---------|------|
| Price must not change during checkout | Display only | **Must recompute** | BACKEND-RESPONSIBILITIES |
| Inventory reduces only after payment success | Display only | **Must enforce** | Stock at checkout |
| Coupon cannot exceed cart total | Display | **Must validate** | |
| User cannot cancel shipped order | **BE** | **BE** | |
| Guest cart merges after login | Not implemented | **BE or FE** | Optional |
| Prevent duplicate order on double click | Yes | - | Button disabled when submitting |

---

## 4. Performance & Security (BE-Heavy)

| Scenario | Owner | Notes |
|----------|-------|-------|
| 100 items in cart | FE + BE | UI, API limits |
| Large product list (1000+) | **BE** | Pagination, indexing |
| Slow 3G simulation | E2E | `cy.intercept` delay |
| API latency handling | FE | Loading states |
| SQL injection in search | **BE** | Input sanitization |
| XSS in review input | **BE** | Sanitize/sanitizer |
| Access admin route as normal user | **BE** | Role-based auth |
| Inspect request and modify price | **BE** | Recompute server-side |

---

## 5. Summary: Frontend vs Backend

**Frontend tests added:**
- Unit: Login wrong-password error, Register existing-email error, signUp call; Price pipe (0, negative, float); Cart setQuantity 0/negative removes; Checkout submitting=true (double-click prevention)
- E2E: product-detail.cy, order-confirmation.cy, page.cy, orders.cy, order-detail.cy
- E2E enhanced: auth (wrong password, weak password validation), catalog (empty search, API error), cart (display items, persist after refresh)

**Backend must handle:**
- Stock validation, price recompute, discount validation (validity, expiry, amount)
- Auth: session timeout, token revocation, existing email, wrong password response
- Payment failure, rate limiting
- SQL injection, XSS, admin route protection
- Cancel shipped order, guest order lookup

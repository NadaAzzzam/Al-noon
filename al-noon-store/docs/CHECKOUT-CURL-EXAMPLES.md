# Checkout API – cURL Examples (Discount Scenarios)

Base URL: `http://localhost:4000/api` (or set `API_URL`)

**Replace `PRODUCT_ID_1`** with a valid product ID from your database.

---

## 1. Checkout WITHOUT discount

```bash
curl -X POST "http://localhost:4000/api/checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"product": "PRODUCT_ID_1", "quantity": 2, "price": 99.99}],
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "phone": "01000000000",
    "shippingAddress": {
      "address": "123 Test Street",
      "city": "Cairo",
      "governorate": "Cairo",
      "country": "Egypt"
    },
    "shippingMethod": "std",
    "paymentMethod": "COD",
    "deliveryFee": 50
  }'
```

---

## 2. Checkout WITH valid discount code

```bash
curl -X POST "http://localhost:4000/api/checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"product": "PRODUCT_ID_1", "quantity": 2, "price": 99.99}],
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "phone": "01000000000",
    "shippingAddress": {
      "address": "123 Test Street",
      "city": "Cairo",
      "governorate": "Cairo",
      "country": "Egypt"
    },
    "shippingMethod": "std",
    "paymentMethod": "COD",
    "deliveryFee": 50,
    "discountCode": "SAVE10"
  }'
```

Expected: `200` with order including discounted total.

---

## 3. Checkout with INVALID discount code

```bash
curl -X POST "http://localhost:4000/api/checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"product": "PRODUCT_ID_1", "quantity": 1, "price": 99.99}],
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "phone": "01000000000",
    "shippingAddress": {
      "address": "123 Test Street",
      "city": "Cairo",
      "governorate": "Cairo",
      "country": "Egypt"
    },
    "shippingMethod": "std",
    "paymentMethod": "COD",
    "deliveryFee": 50,
    "discountCode": "INVALID_XYZ"
  }'
```

Expected: `400` with a message like `"Invalid discount code"` or similar.

---

## 4. Verbose output (see status and headers)

```bash
curl -v -X POST "http://localhost:4000/api/checkout" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

---

## Scripts

- **Bash**: `./scripts/test-checkout-discount.sh` (Linux/macOS/Git Bash)
- **PowerShell**: `.\scripts\test-checkout-discount.ps1` (Windows)

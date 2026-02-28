#!/bin/bash
# Test checkout POST with discount scenarios
# Usage: ./scripts/test-checkout-discount.sh
# Prerequisites: Backend running at http://localhost:4000

BASE_URL="${API_URL:-http://localhost:4000/api}"

# Minimal checkout body (adjust product IDs to match your DB)
CHECKOUT_BODY='{
  "items": [
    { "product": "PRODUCT_ID_1", "quantity": 2, "price": 99.99 }
  ],
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

echo "=== 1. Checkout WITHOUT discount ==="
curl -s -X POST "${BASE_URL}/checkout" \
  -H "Content-Type: application/json" \
  -d "${CHECKOUT_BODY}" \
  -w "\nHTTP Status: %{http_code}\n" | head -80

echo ""
echo "=== 2. Checkout WITH valid discount code ==="
CHECKOUT_WITH_DISCOUNT=$(echo "$CHECKOUT_BODY" | jq '. + {"discountCode": "SAVE10"}' 2>/dev/null || echo "$CHECKOUT_BODY" | sed 's/"country": "Egypt"/"country": "Egypt", "discountCode": "SAVE10"/')
curl -s -X POST "${BASE_URL}/checkout" \
  -H "Content-Type: application/json" \
  -d "${CHECKOUT_WITH_DISCOUNT:-$CHECKOUT_BODY}" \
  -w "\nHTTP Status: %{http_code}\n" | head -80

echo ""
echo "=== 3. Checkout with INVALID discount code (expect 400) ==="
CHECKOUT_INVALID_DISCOUNT='{"items":[{"product":"PRODUCT_ID_1","quantity":1,"price":99.99}],"email":"test@example.com","firstName":"Test","lastName":"User","phone":"01000000000","shippingAddress":{"address":"123 Test St","city":"Cairo","governorate":"Cairo","country":"Egypt"},"shippingMethod":"std","paymentMethod":"COD","deliveryFee":50,"discountCode":"INVALID_CODE_XYZ"}'
curl -s -X POST "${BASE_URL}/checkout" \
  -H "Content-Type: application/json" \
  -d "$CHECKOUT_INVALID_DISCOUNT" \
  -w "\nHTTP Status: %{http_code}\n" | head -80

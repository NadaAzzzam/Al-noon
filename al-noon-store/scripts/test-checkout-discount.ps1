# Test checkout POST with discount scenarios
# Usage: .\scripts\test-checkout-discount.ps1
# Prerequisites: Backend running at http://localhost:4000

$BaseUrl = if ($env:API_URL) { $env:API_URL } else { "http://localhost:4000/api" }

$baseBody = @{
  items          = @(@{ product = "PRODUCT_ID_1"; quantity = 2; price = 99.99 })
  email          = "test@example.com"
  firstName      = "Test"
  lastName       = "User"
  phone          = "01000000000"
  shippingAddress = @{
    address     = "123 Test Street"
    city        = "Cairo"
    governorate = "Cairo"
    country     = "Egypt"
  }
  shippingMethod = "std"
  paymentMethod  = "COD"
  deliveryFee    = 50
}

Write-Host "=== 1. Checkout WITHOUT discount ==="
$body1 = $baseBody | ConvertTo-Json -Depth 5
$r1 = Invoke-RestMethod -Uri "$BaseUrl/checkout" -Method Post -Body $body1 -ContentType "application/json"
$r1 | ConvertTo-Json -Depth 5

Write-Host "`n=== 2. Checkout WITH valid discount code ==="
$baseBody["discountCode"] = "SAVE10"
$body2Json = $baseBody | ConvertTo-Json -Depth 5
try {
  $r2 = Invoke-RestMethod -Uri "$BaseUrl/checkout" -Method Post -Body $body2Json -ContentType "application/json"
  $r2 | ConvertTo-Json -Depth 5
} catch { Write-Host "Error: $($_.Exception.Message)" }

Write-Host "`n=== 3. Checkout with INVALID discount code (expect 400) ==="
$baseBody["discountCode"] = "INVALID_CODE_XYZ"
$body3Json = $baseBody | ConvertTo-Json -Depth 5
try {
  Invoke-RestMethod -Uri "$BaseUrl/checkout" -Method Post -Body $body3Json -ContentType "application/json"
} catch {
  Write-Host "Expected 400: $($_.Exception.Message)"
  if ($_.Exception.Response) { Write-Host "Status: $($_.Exception.Response.StatusCode)" }
}

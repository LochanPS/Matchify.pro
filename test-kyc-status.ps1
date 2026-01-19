# Test KYC Status Endpoint

$BASE_URL = "http://localhost:5000"

Write-Host "Testing KYC Status Endpoint" -ForegroundColor Cyan
Write-Host ""

# Login as organizer
Write-Host "1. Logging in as organizer..." -ForegroundColor Yellow
$organizerLogin = @{
    email = "organizer@gmail.com"
    password = "organizer123"
} | ConvertTo-Json

try {
    $organizerResponse = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method POST -Body $organizerLogin -ContentType "application/json"
    $organizerToken = $organizerResponse.token
    Write-Host "✅ Organizer logged in" -ForegroundColor Green
    Write-Host "Token: $($organizerToken.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Organizer login failed: $_" -ForegroundColor Red
    exit
}

# Check KYC status
Write-Host "2. Checking KYC status..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $organizerToken"
    }
    $kycStatus = Invoke-RestMethod -Uri "$BASE_URL/api/kyc/status" -Method GET -Headers $headers
    Write-Host "✅ KYC Status Retrieved" -ForegroundColor Green
    Write-Host "Status: $($kycStatus.status)" -ForegroundColor Cyan
    Write-Host "Full Response:" -ForegroundColor Gray
    Write-Host ($kycStatus | ConvertTo-Json -Depth 3) -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ KYC status check failed" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
}

Write-Host "Test Complete!" -ForegroundColor Green

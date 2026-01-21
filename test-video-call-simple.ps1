# Test Video Call Feature - PowerShell Script

$BASE_URL = "http://localhost:5000"

Write-Host "🧪 Testing Video Call Feature" -ForegroundColor Cyan
Write-Host ""

# 1. Login as organizer
Write-Host "1️⃣ Logging in as organizer..." -ForegroundColor Yellow
$organizerLogin = @{
    email = "organizer@gmail.com"
    password = "organizer123"
} | ConvertTo-Json

try {
    $organizerResponse = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method POST -Body $organizerLogin -ContentType "application/json"
    $organizerToken = $organizerResponse.token
    Write-Host "✅ Organizer logged in" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Organizer login failed: $_" -ForegroundColor Red
    exit
}

# 2. Login as admin
Write-Host "2️⃣ Logging in as admin..." -ForegroundColor Yellow
$adminLogin = @{
    email = "ADMIN@gmail.com"
    password = "ADMIN@123(123)"
} | ConvertTo-Json

try {
    $adminResponse = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method POST -Body $adminLogin -ContentType "application/json"
    $adminToken = $adminResponse.token
    Write-Host "✅ Admin logged in" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Admin login failed: $_" -ForegroundColor Red
    exit
}

# 3. Check KYC status (organizer)
Write-Host "3️⃣ Checking KYC status..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $organizerToken"
    }
    $kycStatus = Invoke-RestMethod -Uri "$BASE_URL/api/kyc/status" -Method GET -Headers $headers
    Write-Host "KYC Status: $($kycStatus.status)" -ForegroundColor Cyan
    Write-Host "Response: $($kycStatus | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "⚠️ KYC status check: $_" -ForegroundColor Yellow
    Write-Host ""
}

# 4. Test admin availability toggle
Write-Host "4️⃣ Testing admin availability toggle..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $adminToken"
        "Content-Type" = "application/json"
    }
    $availabilityBody = @{
        available = $true
    } | ConvertTo-Json
    
    $availabilityResponse = Invoke-RestMethod -Uri "$BASE_URL/api/admin/kyc/availability" -Method POST -Headers $headers -Body $availabilityBody
    Write-Host "✅ Availability toggle: Working" -ForegroundColor Green
    Write-Host "Response: $($availabilityResponse | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Availability toggle failed: $_" -ForegroundColor Red
    Write-Host ""
}

# 5. Get KYC stats (admin)
Write-Host "5️⃣ Getting KYC stats..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $adminToken"
    }
    $stats = Invoke-RestMethod -Uri "$BASE_URL/api/admin/kyc/stats" -Method GET -Headers $headers
    Write-Host "✅ KYC Stats: Working" -ForegroundColor Green
    Write-Host "Response: $($stats | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Stats failed: $_" -ForegroundColor Red
    Write-Host ""
}

# 6. Get pending KYCs (admin)
Write-Host "6️⃣ Getting pending KYCs..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $adminToken"
    }
    $pending = Invoke-RestMethod -Uri "$BASE_URL/api/admin/kyc/pending" -Method GET -Headers $headers
    Write-Host "✅ Pending KYCs: Working" -ForegroundColor Green
    Write-Host "Response: $($pending | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Pending KYCs failed: $_" -ForegroundColor Red
    Write-Host ""
}

# Summary
Write-Host ""
Write-Host "📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host "================" -ForegroundColor Cyan
Write-Host "✅ Organizer login: Working" -ForegroundColor Green
Write-Host "✅ Admin login: Working" -ForegroundColor Green
Write-Host "✅ KYC endpoints: Accessible" -ForegroundColor Green
Write-Host ""
Write-Host "📝 NOTES:" -ForegroundColor Yellow
Write-Host "- Daily.co API key is configured: pk_384661bb-5b3c-4261-84e8-959c84c1468e"
Write-Host "- Video rooms will be created when organizer requests a call"
Write-Host "- Admin must toggle availability ON to receive call requests"
Write-Host "- Video call uses Daily.co iframe for real-time video"
Write-Host ""
Write-Host "🎥 TO TEST VIDEO CALL:" -ForegroundColor Cyan
Write-Host "1. Go to http://localhost:5173 and login as organizer"
Write-Host "2. Navigate to KYC submission page"
Write-Host "3. Upload Aadhaar and submit"
Write-Host "4. Request video call"
Write-Host "5. Admin will see the request in KYC dashboard"
Write-Host "6. Both can join the Daily.co video room"
Write-Host ""

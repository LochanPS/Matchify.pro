# Test Tournament Payments API directly
Write-Host "🔐 Testing Tournament Payments API..." -ForegroundColor Cyan

# Step 1: Login as admin
Write-Host "`n1️⃣ Logging in as admin..." -ForegroundColor Yellow
$loginBody = @{
    email = "ADMIN@gmail.com"
    password = "ADMIN@123(123)"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token
Write-Host "✅ Logged in successfully" -ForegroundColor Green

# Step 2: Get tournament payments
Write-Host "`n2️⃣ Fetching tournament payments..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
}

$paymentsResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/tournament-payments" -Method Get -Headers $headers
Write-Host "✅ Response received:" -ForegroundColor Green
Write-Host "   Success: $($paymentsResponse.success)" -ForegroundColor White
Write-Host "   Count: $($paymentsResponse.data.Count)" -ForegroundColor White

if ($paymentsResponse.data.Count -gt 0) {
    Write-Host "`n📋 Tournament Payments:" -ForegroundColor Cyan
    foreach ($payment in $paymentsResponse.data) {
        Write-Host "   Tournament: $($payment.tournament.name)" -ForegroundColor Yellow
        Write-Host "      Total: Rs.$($payment.totalCollected)" -ForegroundColor White
        Write-Host "      Registrations: $($payment.totalRegistrations)" -ForegroundColor White
        Write-Host "      Platform Fee: Rs.$($payment.platformFeeAmount)" -ForegroundColor White
        Write-Host "      Organizer Share: Rs.$($payment.organizerShare)" -ForegroundColor White
        Write-Host "      First 50 percent: Rs.$($payment.payout50Percent1) - $($payment.payout50Status1)" -ForegroundColor White
        Write-Host "      Second 50 percent: Rs.$($payment.payout50Percent2) - $($payment.payout50Status2)" -ForegroundColor White
        Write-Host ""
    }
}

# Step 3: Get payment stats
Write-Host "`n3️⃣ Fetching payment stats..." -ForegroundColor Yellow
$statsResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/tournament-payments/stats/overview" -Method Get -Headers $headers
Write-Host "✅ Stats received:" -ForegroundColor Green
Write-Host "   Total Collected: Rs.$($statsResponse.data.totalCollected)" -ForegroundColor White
Write-Host "   Platform Fees: Rs.$($statsResponse.data.totalPlatformFees)" -ForegroundColor White
Write-Host "   Pending First 50 percent: $($statsResponse.data.pending50Payouts1)" -ForegroundColor White
Write-Host "   Pending Second 50 percent: $($statsResponse.data.pending50Payouts2)" -ForegroundColor White

# Step 4: Get pending payouts
Write-Host "`n4️⃣ Fetching pending payouts..." -ForegroundColor Yellow
$payoutsResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/tournament-payments/pending/payouts?type=all" -Method Get -Headers $headers
Write-Host "✅ Response received:" -ForegroundColor Green
Write-Host "   Success: $($payoutsResponse.success)" -ForegroundColor White
Write-Host "   Count: $($payoutsResponse.data.Count)" -ForegroundColor White

if ($payoutsResponse.data.Count -gt 0) {
    Write-Host "`n📋 Pending Payouts:" -ForegroundColor Cyan
    foreach ($payout in $payoutsResponse.data) {
        Write-Host "   Tournament: $($payout.tournament.name)" -ForegroundColor Yellow
        Write-Host "      Organizer: $($payout.tournament.organizer.name)" -ForegroundColor White
        Write-Host "      Total: Rs.$($payout.totalCollected)" -ForegroundColor White
        Write-Host "      First 50 percent: Rs.$($payout.payout50Percent1) - $($payout.payout50Status1)" -ForegroundColor White
        Write-Host "      Second 50 percent: Rs.$($payout.payout50Percent2) - $($payout.payout50Status2)" -ForegroundColor White
        if ($payout.tournament.paymentQRUrl) {
            Write-Host "      QR Code: Available" -ForegroundColor Green
        } else {
            Write-Host "      QR Code: Missing" -ForegroundColor Red
        }
        Write-Host ""
    }
}

Write-Host "`n✅ All API tests completed successfully!" -ForegroundColor Green

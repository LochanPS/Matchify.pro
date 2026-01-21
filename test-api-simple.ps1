# Test Tournament Payments API
Write-Host "Testing Tournament Payments API..." -ForegroundColor Cyan

# Login
Write-Host "Logging in as admin..." -ForegroundColor Yellow
$loginBody = @{
    email = "ADMIN@gmail.com"
    password = "ADMIN@123(123)"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token
Write-Host "Logged in successfully" -ForegroundColor Green

$headers = @{
    "Authorization" = "Bearer $token"
}

# Get tournament payments
Write-Host "Fetching tournament payments..." -ForegroundColor Yellow
$paymentsResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/tournament-payments" -Method Get -Headers $headers
Write-Host "Success: $($paymentsResponse.success)" -ForegroundColor Green
Write-Host "Count: $($paymentsResponse.data.Count)" -ForegroundColor Green

if ($paymentsResponse.data.Count -gt 0) {
    Write-Host "Tournament Payments:" -ForegroundColor Cyan
    foreach ($payment in $paymentsResponse.data) {
        Write-Host "  Tournament: $($payment.tournament.name)" -ForegroundColor Yellow
        Write-Host "    Total: Rs.$($payment.totalCollected)" -ForegroundColor White
        Write-Host "    Registrations: $($payment.totalRegistrations)" -ForegroundColor White
    }
}

# Get stats
Write-Host "Fetching stats..." -ForegroundColor Yellow
$statsResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/tournament-payments/stats/overview" -Method Get -Headers $headers
Write-Host "Total Collected: Rs.$($statsResponse.data.totalCollected)" -ForegroundColor Green
Write-Host "Platform Fees: Rs.$($statsResponse.data.totalPlatformFees)" -ForegroundColor Green
Write-Host "Pending First 50: $($statsResponse.data.pending50Payouts1)" -ForegroundColor Green
Write-Host "Pending Second 50: $($statsResponse.data.pending50Payouts2)" -ForegroundColor Green

# Get pending payouts
Write-Host "Fetching pending payouts..." -ForegroundColor Yellow
$payoutsResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/tournament-payments/pending/payouts?type=all" -Method Get -Headers $headers
Write-Host "Success: $($payoutsResponse.success)" -ForegroundColor Green
Write-Host "Count: $($payoutsResponse.data.Count)" -ForegroundColor Green

if ($payoutsResponse.data.Count -gt 0) {
    Write-Host "Pending Payouts:" -ForegroundColor Cyan
    foreach ($payout in $payoutsResponse.data) {
        Write-Host "  Tournament: $($payout.tournament.name)" -ForegroundColor Yellow
        Write-Host "    Organizer: $($payout.tournament.organizer.name)" -ForegroundColor White
        Write-Host "    Total: Rs.$($payout.totalCollected)" -ForegroundColor White
        if ($payout.tournament.paymentQRUrl) {
            Write-Host "    QR Code: Available" -ForegroundColor Green
        } else {
            Write-Host "    QR Code: Missing" -ForegroundColor Red
        }
    }
}

Write-Host "All tests completed!" -ForegroundColor Green

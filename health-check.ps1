# Matchify Health Check Script
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "         MATCHIFY HEALTH CHECK SYSTEM                          " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$backendUrl = "http://localhost:5000"
$frontendUrl = "http://localhost:5173"
$passed = 0
$total = 0

# Function to check endpoint
function Test-Endpoint {
    param($name, $url)
    $script:total++
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $name : OK" -ForegroundColor Green
            $script:passed++
            return $true
        }
    } catch {
        Write-Host "❌ $name : FAILED" -ForegroundColor Red
        return $false
    }
}

# Backend Checks
Write-Host "🔍 Checking Backend Server..." -ForegroundColor Yellow
$healthUrl = $backendUrl + "/health"
$apiUrl = $backendUrl + "/api"
$tournamentsUrl = $backendUrl + "/api/tournaments?limit=1"

Test-Endpoint "Health Check" $healthUrl
Test-Endpoint "API Root" $apiUrl
Test-Endpoint "Tournaments API" $tournamentsUrl

# Frontend Check
Write-Host ""
Write-Host "🔍 Checking Frontend Server..." -ForegroundColor Yellow
Test-Endpoint "Frontend" $frontendUrl

# Summary
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "                  HEALTH CHECK SUMMARY                          " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$summaryColor = if ($passed -eq $total) { "Green" } else { "Yellow" }
Write-Host "Total: $passed/$total checks passed" -ForegroundColor $summaryColor

if ($passed -eq $total) {
    Write-Host ""
    Write-Host "🎉 All systems operational! Ready to use." -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "⚠️  Some systems are not responding. Check the errors above." -ForegroundColor Yellow
    Write-Host ""
}

# URLs
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "                    ACCESS URLS                                 " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Frontend:  " -NoNewline
Write-Host $frontendUrl -ForegroundColor Blue
Write-Host "Backend:   " -NoNewline
Write-Host $backendUrl -ForegroundColor Blue
Write-Host "API Docs:  " -NoNewline
Write-Host ($backendUrl + "/api") -ForegroundColor Blue
Write-Host "Health:    " -NoNewline
Write-Host ($backendUrl + "/health") -ForegroundColor Blue
Write-Host ""

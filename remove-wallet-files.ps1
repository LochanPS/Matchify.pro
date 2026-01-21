# PowerShell script to remove all wallet and credits files
# Run this from the matchify folder

Write-Host "🗑️  REMOVING WALLET & CREDITS FILES" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Frontend files to remove
$frontendFiles = @(
    "frontend\src\pages\WalletPage.jsx",
    "frontend\src\pages\Wallet.jsx",
    "frontend\src\pages\Credits.jsx",
    "frontend\src\components\wallet\TopupModal.jsx",
    "frontend\src\components\wallet\TransactionHistory.jsx",
    "frontend\src\components\wallet\TransactionTable.jsx",
    "frontend\src\api\wallet.js"
)

# Backend files to remove
$backendFiles = @(
    "backend\src\routes\wallet.routes.js",
    "backend\src\controllers\wallet.controller.js",
    "backend\src\routes\credits.routes.js",
    "backend\src\controllers\credits.controller.js",
    "backend\test-wallet.js"
)

# Remove frontend files
Write-Host "📁 Removing Frontend Files..." -ForegroundColor Yellow
foreach ($file in $frontendFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "   ✅ Deleted: $file" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Not found: $file" -ForegroundColor Gray
    }
}

# Remove wallet components folder if empty
if (Test-Path "frontend\src\components\wallet") {
    $walletFiles = Get-ChildItem "frontend\src\components\wallet" -File
    if ($walletFiles.Count -eq 0) {
        Remove-Item "frontend\src\components\wallet" -Force -Recurse
        Write-Host "   ✅ Deleted: frontend\src\components\wallet (folder)" -ForegroundColor Green
    }
}

Write-Host ""

# Remove backend files
Write-Host "📁 Removing Backend Files..." -ForegroundColor Yellow
foreach ($file in $backendFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "   ✅ Deleted: $file" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Not found: $file" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "✅ FILE REMOVAL COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Update backend\src\server.js - Remove wallet/credits routes"
Write-Host "2. Update backend\prisma\schema.prisma - Remove wallet models"
Write-Host "3. Run: cd backend && npx prisma migrate dev --name remove_wallet"
Write-Host "4. Run: npx prisma generate"
Write-Host "5. Restart both servers"
Write-Host ""
Write-Host "📖 See WALLET_REMOVAL_COMPLETE.md for detailed instructions" -ForegroundColor Yellow

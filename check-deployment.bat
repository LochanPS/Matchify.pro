@echo off
echo ========================================
echo Checking Vercel Backend Deployment
echo ========================================
echo.

:loop
echo [%time%] Testing auth/login endpoint...
curl -X POST https://matchify-probackend.vercel.app/auth/login -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\",\"password\":\"test\"}" 2>nul
echo.
echo.
echo Waiting 10 seconds before next check...
timeout /t 10 /nobreak >nul
goto loop

@echo off
echo ========================================
echo   RESTARTING BACKEND SERVER
echo ========================================
echo.
echo Stopping any running Node.js processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo.
echo Starting backend server...
cd backend
start cmd /k "npm start"
echo.
echo ========================================
echo   Backend server is starting!
echo   Check the new window for logs
echo ========================================
echo.
pause

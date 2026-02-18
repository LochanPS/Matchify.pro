@echo off
echo ========================================
echo Starting BACKEND Server
echo ========================================
cd backend
echo Installing dependencies...
call npm install
echo.
echo Starting server on http://localhost:5000
echo.
call npm start
pause

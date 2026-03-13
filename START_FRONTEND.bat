@echo off
echo ========================================
echo Starting FRONTEND Server
echo ========================================
cd frontend
echo Installing dependencies...
call npm install
echo.
echo Starting dev server on http://localhost:5173
echo.
call npm run dev
pause

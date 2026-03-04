@echo off
echo ========================================
echo MATCHIFY.PRO - Starting Both Servers
echo ========================================
echo.
echo Starting Backend in new window...
start "BACKEND - Port 5000" cmd /k "cd backend && npm install && npm start"
echo.
echo Waiting 5 seconds for backend to initialize...
timeout /t 5 /nobreak
echo.
echo Starting Frontend in new window...
start "FRONTEND - Port 5173" cmd /k "cd frontend && npm install && npm run dev"
echo.
echo ========================================
echo Both servers are starting!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Login with:
echo Email:    ADMIN@gmail.com
echo Password: ADMIN@123(123)
echo.
echo Press any key to close this window...
pause > nul

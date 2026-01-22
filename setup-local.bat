@echo off
echo ========================================
echo   MATCHIFY.PRO - LOCAL SETUP
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found! Please install Node.js v18 or higher
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js installed
echo.

echo ========================================
echo   STEP 1: BACKEND SETUP
echo ========================================
echo.

cd backend

echo Installing backend dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] Backend npm install failed!
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed
echo.

echo Generating Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo [ERROR] Prisma generate failed!
    pause
    exit /b 1
)
echo [OK] Prisma Client generated
echo.

echo Pushing database schema...
call npx prisma db push
if errorlevel 1 (
    echo [ERROR] Database push failed! Check your DATABASE_URL in .env
    pause
    exit /b 1
)
echo [OK] Database schema pushed
echo.

echo Creating admin user and payment settings...
call node deploy.js
echo [OK] Admin user and payment settings created
echo.

echo Running health check...
call node health-check.js
echo.

echo ========================================
echo   STEP 2: FRONTEND SETUP
echo ========================================
echo.

cd ..\frontend

echo Installing frontend dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] Frontend npm install failed!
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed
echo.

cd ..

echo ========================================
echo   SETUP COMPLETE!
echo ========================================
echo.
echo To start development:
echo.
echo Terminal 1 (Backend):
echo   cd backend
echo   npm run dev
echo.
echo Terminal 2 (Frontend):
echo   cd frontend
echo   npm run dev
echo.
echo Then open: http://localhost:5173
echo.
echo Admin Login:
echo   Email: ADMIN@gmail.com
echo   Password: ADMIN@123(123)
echo.
echo Happy coding!
echo.
pause

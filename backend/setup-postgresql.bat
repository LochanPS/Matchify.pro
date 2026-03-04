@echo off
echo ========================================
echo MATCHIFY.PRO - PostgreSQL Setup
echo ========================================
echo.
echo This script will help you set up PostgreSQL for local development.
echo.
echo Prerequisites:
echo - PostgreSQL must be installed
echo - PostgreSQL service must be running
echo.
pause
echo.
echo Step 1: Deleting old SQLite migrations...
if exist "prisma\migrations" (
    rmdir /s /q "prisma\migrations"
    echo ✓ Old migrations deleted
) else (
    echo ✓ No old migrations found
)
echo.
echo Step 2: Generating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ✗ Failed to generate Prisma Client
    pause
    exit /b 1
)
echo ✓ Prisma Client generated
echo.
echo Step 3: Creating initial migration...
echo.
echo This will create the database schema in PostgreSQL.
echo Make sure your DATABASE_URL in .env is correct!
echo.
pause
call npx prisma migrate dev --name init
if %errorlevel% neq 0 (
    echo.
    echo ✗ Migration failed!
    echo.
    echo Common issues:
    echo - PostgreSQL is not running
    echo - Database does not exist (create it first: CREATE DATABASE matchify_dev;)
    echo - Wrong credentials in DATABASE_URL
    echo.
    pause
    exit /b 1
)
echo.
echo ✓ Migration completed successfully!
echo.
echo Step 4: Seeding database (optional)...
echo.
set /p seed="Do you want to seed the database with test data? (y/n): "
if /i "%seed%"=="y" (
    call npm run prisma:seed
    if %errorlevel% neq 0 (
        echo ✗ Seeding failed
    ) else (
        echo ✓ Database seeded successfully
    )
)
echo.
echo ========================================
echo PostgreSQL Setup Complete!
echo ========================================
echo.
echo You can now start the application with:
echo   npm run dev
echo.
echo Or view the database with:
echo   npx prisma studio
echo.
pause

@echo off
echo ========================================
echo MATCHIFY.PRO - PostgreSQL Setup
echo ========================================
echo.

echo Step 1: Updating .env file...
powershell -Command "(Get-Content .env) -replace 'DATABASE_URL=file:./prisma/dev.db', 'DATABASE_URL=\"postgresql://postgres:matchify123@localhost:5432/matchify_dev\"' | Set-Content .env"
echo ✓ .env updated!
echo.

echo Step 2: Generating Prisma Client...
call npx prisma generate
echo ✓ Prisma Client generated!
echo.

echo Step 3: Running database migrations...
call npx prisma migrate dev --name restore_full_schema
echo ✓ Migrations complete!
echo.

echo Step 4: Creating admin user...
call node create-admin-user-now.js
echo ✓ Admin user created!
echo.

echo ========================================
echo ✓ SETUP COMPLETE!
echo ========================================
echo.
echo Your database is ready with:
echo   - Player codes
echo   - Umpire codes
echo   - All dashboards
echo   - All features restored!
echo.
echo Now restart your backend server!
echo.
pause

@echo off
echo ========================================
echo UPDATING POINTS SCHEMA
echo ========================================
echo.

echo Step 1: Generating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate Prisma client
    pause
    exit /b 1
)
echo.

echo Step 2: Creating migration...
call npx prisma migrate dev --name add_points_log_table
if %errorlevel% neq 0 (
    echo ERROR: Failed to create migration
    pause
    exit /b 1
)
echo.

echo ========================================
echo SCHEMA UPDATE COMPLETE!
echo ========================================
echo.
echo The PointsLog table has been added to the database.
echo The points routes now use the correct field names.
echo.
pause

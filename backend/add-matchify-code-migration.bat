@echo off
echo ========================================
echo ADDING MATCHIFY CODE COLUMN MIGRATION
echo ========================================
echo.

cd backend

echo Step 1: Creating migration for matchifyCode column...
npx prisma migrate dev --name add_matchify_code_column

echo.
echo Step 2: Deploying migration to production...
npx prisma migrate deploy

echo.
echo ========================================
echo MIGRATION COMPLETE!
echo ========================================
echo.
echo The matchifyCode column has been added to the User table.
echo You can now test login at: https://matchify-ebbzod065-destroyerforevers-projects.vercel.app
echo.
pause

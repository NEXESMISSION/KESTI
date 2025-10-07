@echo off
echo.
echo =======================================
echo Kesti POS - Quick Fix Setup
echo =======================================
echo.
echo This script will fix the "Invalid API key" error
echo and other common issues with the application.
echo.
echo Steps to be performed:
echo 1. Set up environment variables
echo 2. Clear Next.js cache
echo 3. Restart the development server
echo.
pause
echo.

echo Step 1: Setting up environment variables...
call setup-env.bat

echo.
echo Step 2: Clearing Next.js cache...
if exist .next rmdir /s /q .next
echo Cache cleared successfully!

echo.
echo Step 3: Starting development server...
echo.
echo Your browser will open to the navigation page.
echo From there, go to "Direct Business Creation" to
echo create business accounts without issues.
echo.
echo Press Ctrl+C to stop the server when needed.
echo.
pause
start http://localhost:3000/navigation
npm run dev

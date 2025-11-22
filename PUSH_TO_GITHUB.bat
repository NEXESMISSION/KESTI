@echo off
echo ====================================
echo KESTI - Push to GitHub
echo ====================================
echo.

REM Configure git (replace with your info)
echo Configuring git...
git config --global user.name "NEXESMISSION"
git config --global user.email "your-email@example.com"

echo.
echo Adding all files...
git add .

echo.
echo Committing changes...
git commit -m "v2.0: Auto-clear history feature + major improvements"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ====================================
echo Done! Check: https://github.com/NEXESMISSION/KESTI
echo ====================================
pause

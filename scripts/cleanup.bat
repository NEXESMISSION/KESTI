@echo off
echo.
echo ======================================
echo Kesti POS - Project Cleanup Utility
echo ======================================
echo.
echo This script will remove temporary fix files
echo that are no longer needed after implementing 
echo the consolidated environment variable solution.
echo.
echo Files to be removed:
echo - ENV_RELOAD.bat
echo - QUICK_FIX.bat
echo - EMERGENCY_SOLUTION.md
echo - DIRECT_API_SOLUTION.md
echo - IMMEDIATE_FIX.md
echo - backup-code.bat
echo - FIX_SERVICE_KEY.md
echo - TROUBLESHOOT_401.md
echo - pages\api\create-business-emergency.ts
echo - pages\api\create-business-robust.ts
echo - pages\api\create-business-simple.ts
echo - pages\api\test-service-key.ts
echo - pages\test-key.tsx
echo.
echo IMPORTANT: This script will NOT remove
echo the consolidated files:
echo - pages\api\create-business-consolidated.ts
echo - pages\create-business-consolidated.tsx
echo - ENVIRONMENT_SOLUTION.md
echo.
echo Press Ctrl+C to cancel or any key to continue...
pause > nul
echo.

echo Removing temporary fix files...
del /q ENV_RELOAD.bat 2>nul
del /q QUICK_FIX.bat 2>nul
del /q EMERGENCY_SOLUTION.md 2>nul
del /q DIRECT_API_SOLUTION.md 2>nul
del /q IMMEDIATE_FIX.md 2>nul
del /q backup-code.bat 2>nul
del /q FIX_SERVICE_KEY.md 2>nul
del /q TROUBLESHOOT_401.md 2>nul
del /q "pages\api\create-business-emergency.ts" 2>nul
del /q "pages\api\create-business-robust.ts" 2>nul
del /q "pages\api\create-business-simple.ts" 2>nul
del /q "pages\api\test-service-key.ts" 2>nul
del /q "pages\test-key.tsx" 2>nul
echo.

echo ===================================
echo Cleanup complete!
echo ===================================
echo.
echo All temporary fix files have been removed.
echo The consolidated solution files have been preserved.
echo.
echo Next steps:
echo 1. Use pages\create-business-consolidated.tsx for business creation
echo 2. Review ENVIRONMENT_SOLUTION.md for proper environment setup
echo.
pause

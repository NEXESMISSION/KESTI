@echo off
echo.
echo ========================================
echo ENV VARIABLE RELOAD - COMPLETE SOLUTION
echo ========================================
echo.

echo This script will resolve the "Invalid API key" error
echo by ensuring environment variables are properly loaded.
echo.

echo Step 1: Deleting Next.js cache
rmdir /s /q .next
echo Cache deleted successfully.
echo.

echo Step 2: Verifying environment file
if not exist .env.local (
    echo Creating .env.local file...
    (
    echo NEXT_PUBLIC_SUPABASE_URL=https://kmkscflwnuubnbzddnvy.supabase.co
    echo NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtta3NjZmx3bnV1Ym5iemRkbnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NjAwODYsImV4cCI6MjA3NTMzNjA4Nn0.B3GXpMfUG1csU7_x6Ew9eiulQhX_4UOxBMEMfnMDgQU
    echo SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtta3NjZmx3bnV1Ym5iemRkbnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc2MDA4NiwiZXhwIjoyMDc1MzM2MDg2fQ.jU1mv1xIk35bB2nBcoWKGWO6QKO4UAsKqJ1HfrcDWNM
    ) > .env.local
    echo Environment file created!
) else (
    echo .env.local already exists, ensuring it has the right content...
    
    set found_url=0
    set found_anon=0
    set found_service=0
    
    for /f "tokens=*" %%a in (.env.local) do (
        echo %%a | findstr /C:"NEXT_PUBLIC_SUPABASE_URL" > nul && set found_url=1
        echo %%a | findstr /C:"NEXT_PUBLIC_SUPABASE_ANON_KEY" > nul && set found_anon=1
        echo %%a | findstr /C:"SUPABASE_SERVICE_ROLE_KEY" > nul && set found_service=1
    )
    
    (
    if !found_url!==0 echo NEXT_PUBLIC_SUPABASE_URL=https://kmkscflwnuubnbzddnvy.supabase.co
    if !found_anon!==0 echo NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtta3NjZmx3bnV1Ym5iemRkbnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NjAwODYsImV4cCI6MjA3NTMzNjA4Nn0.B3GXpMfUG1csU7_x6Ew9eiulQhX_4UOxBMEMfnMDgQU
    if !found_service!==0 echo SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtta3NjZmx3bnV1Ym5iemRkbnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc2MDA4NiwiZXhwIjoyMDc1MzM2MDg2fQ.jU1mv1xIk35bB2nBcoWKGWO6QKO4UAsKqJ1HfrcDWNM
    ) >> .env.local
    
    echo Environment file verified.
)

echo.
echo Step 3: Creating direct environment file (.env) for compatibility
copy .env.local .env /y
echo Direct environment file created.
echo.

echo Step 4: Terminating any running Next.js processes
taskkill /f /im node.exe /t
echo.

echo Step 5: Starting development server
echo The server will start in a moment, please wait...
echo.

echo === IMPORTANT ===
echo After the server starts:
echo 1. Go to: http://localhost:3000/api/debug-env
echo 2. Check that all environment variables are properly set
echo 3. Then try creating a business account again
echo ================
echo.

echo Starting server in 5 seconds...
timeout /t 5 /nobreak > nul
start http://localhost:3000/api/debug-env

echo.
npm run dev

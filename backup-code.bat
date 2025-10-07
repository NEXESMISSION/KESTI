@echo off
setlocal enabledelayedexpansion

:: --- CONFIGURATION ---
:: Define the text-based file extensions for the code you want to back up.
set "CODE_EXTENSIONS=.html .css .js .json .xml .txt .md .gitignore .py .java .cs .cpp .c .h .hpp .php .sql .sh .bat .ps1 .yml .env"

:: --- INITIALIZATION ---

:: This is crucial: It forces the script to operate ONLY in the directory where the .bat file is located.
pushd "%~dp0"

echo.
echo --- Starting Project Code Backup ---
echo.
echo Backup will run ONLY in the current folder: %CD%
echo.

rem Get the full path of this script file to ensure it doesn't back itself up.
set "SCRIPT_FILE_PATH=%~f0"


:: --- SCRIPT BODY ---

rem 1. Define the backup directory name and create it.
set "BACKUP_DIR_NAME=backups"
set "BACKUP_DIR_PATH=.\%BACKUP_DIR_NAME%"
if not exist "%BACKUP_DIR_PATH%" (
    echo Creating backup directory...
    mkdir "%BACKUP_DIR_PATH%"
)

rem 2. Generate a unique, timestamped filename for the backup.
echo Generating timestamp...
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "TIMESTAMP=!dt:~0,4!-!dt:~4,2!-!dt:~6,2!_!dt:~8,2!-!dt:~10,2!-!dt:~12,2!"
set "BACKUP_FILE=%BACKUP_DIR_PATH%\project_backup_!TIMESTAMP!.txt"

echo Creating backup file: !BACKUP_FILE!
echo.

rem 3. Create the final backup file and write a header to it.
(
    echo =======================================================
    echo      PROJECT CODE BACKUP - !TIMESTAMP!
    echo =======================================================
    echo(
) > "%BACKUP_FILE%"

echo Processing files. This may take a moment...
echo.

rem ====================================================================================
rem --- NEW & ROBUST FILE GATHERING LOGIC ---
rem This command does three things:
rem 1. 'dir /s /b /a-d': Gets a list of every single file in all subdirectories.
rem 2. '^| findstr /v /i ...': Pipes that list to FINDSTR, which acts as a filter.
rem 3. '/v' tells findstr to REMOVE any lines that contain the search strings.
rem 4. The 'for /f' loop then ONLY receives files that have passed the filter.
rem ====================================================================================

for /f "delims=" %%F in (
    'dir /s /b /a-d ^| findstr /v /i /c:"\\node_modules\\" /c:"\\%BACKUP_DIR_NAME%\\"'
) do (
    set "fullFilePath=%%F"
    set "fileExt=%%~xF"
    
    set "shouldCopy=false"

    rem --- FINAL CHECKS on the pre-filtered list ---

    rem CHECK 1: Is it the script file itself?
    if /i "!fullFilePath!"=="!SCRIPT_FILE_PATH!" (
        rem Do nothing, let shouldCopy remain false
    ) else (
        rem CHECK 2: Is the file extension in our approved list?
        if defined fileExt (
            echo " !CODE_EXTENSIONS! " | findstr /i /c:" !fileExt! " >nul
            if !errorlevel! equ 0 (
                set "shouldCopy=true"
            )
        )
    )

    rem --- If the file has passed ALL checks, then copy its content ---
    if "!shouldCopy!"=="true" (
        echo Processing: !fullFilePath!
        (
            echo(
            echo ----------------------------------------
            echo FILE: !fullFilePath!
            echo ----------------------------------------
            echo(
        ) >> "%BACKUP_FILE%"
        
        type "!fullFilePath!" >> "%BACKUP_FILE%" 2>nul
        
        (
            echo(
            echo(
        ) >> "%BACKUP_FILE%"
    )
)

:: --- COMPLETION ---
echo.
echo =================================
echo  Backup completed successfully!
echo =================================
echo.
echo Your code has been saved to:
echo %BACKUP_FILE%
echo.

popd
pause
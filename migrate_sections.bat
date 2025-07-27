@echo off
echo =================================
echo    Section Migration Script
echo =================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.7+ and try again
    pause
    exit /b 1
)

REM Check if required packages are installed
echo Checking dependencies...
python -c "import requests, csv, json, pathlib" >nul 2>&1
if errorlevel 1 (
    echo Installing required packages...
    pip install requests python-dotenv
)

REM Change to script directory
cd /d "%~dp0"

REM Check for .env.local first, then .env files
if exist ".env.local" (
    echo Found .env.local file in current directory
) else if exist ".env" (
    echo Found .env file in current directory
) else if exist "..\..\..\..\.env.local" (
    echo Found .env.local file in parent directory
    copy "..\..\..\..\.env.local" ".env.local" >nul
) else if exist "..\..\..\..\.env" (
    echo Found .env file in parent directory
    copy "..\..\..\..\.env" ".env" >nul
) else if exist "..\.env.local" (
    echo Found .env.local file in parent directory
    copy "..\.env.local" ".env.local" >nul
) else if exist "..\.env" (
    echo Found .env file in parent directory
    copy "..\.env" ".env" >nul
) else (
    echo WARNING: Neither .env.local nor .env file found
    echo Please create .env.local file with VITE_FIREBASE_DATABASE_URL
    echo.
    echo Example:
    echo VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/
    echo.
    echo Current directory: %CD%
    pause
)

REM Run the migration script
echo.
echo Starting migration...
echo.
python scripts\migrate_sections_enhanced.py

echo.
echo Migration script completed.
pause

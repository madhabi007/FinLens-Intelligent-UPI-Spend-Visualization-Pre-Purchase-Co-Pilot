@echo off
title Push FinLens to GitHub
cd /d "%~dp0"

echo ===================================================
echo   FinLens - Automatic GitHub Deployment Script
echo ===================================================
echo.

set "GIT_CMD=.\mingit\cmd\git.exe"

if not exist "%GIT_CMD%" (
    where git >nul 2>nul
    if %errorlevel% neq 0 (
        echo [!] Git not found.
        pause
        exit /b
    )
    set "GIT_CMD=git"
)

echo [*] Checking local repository...
"%GIT_CMD%" init
"%GIT_CMD%" config user.name "Madhabi Chowdhury"
"%GIT_CMD%" config user.email "madhabichowdhury215@gmail.com"
"%GIT_CMD%" add .
"%GIT_CMD%" commit -m "feat: complete FinLens UPI Spend Intelligence & Scanner platform" 2>nul
"%GIT_CMD%" branch -M main

echo [*] Setting remote repository origin...
"%GIT_CMD%" remote remove origin 2>nul
"%GIT_CMD%" remote add origin https://github.com/madhabi007/FinLens-Intelligent-UPI-Spend-Visualization-Pre-Purchase-Co-Pilot.git

echo.
echo [*] Pushing to GitHub (Sign in via your browser if prompted)...
"%GIT_CMD%" push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [*] If remote had existing commits, attempting rebase push...
    "%GIT_CMD%" pull origin main --rebase
    "%GIT_CMD%" push -u origin main
)

echo.
echo ===================================================
echo   Finished! Refresh your GitHub page:
echo   https://github.com/madhabi007/FinLens-Intelligent-UPI-Spend-Visualization-Pre-Purchase-Co-Pilot
echo ===================================================
echo.
pause

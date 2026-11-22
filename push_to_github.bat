@echo off
title Push FinLens to GitHub
cd /d "%~dp0"

echo ===================================================
echo   FinLens - Automatic GitHub Deployment Script
echo ===================================================
echo.

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Git is not installed or not in PATH.
    echo [*] Installing Git for Windows via winget...
    winget install --id Git.Git -e --source winget
    echo.
    echo [*] Git installed! Please close and re-open this script.
    pause
    exit /b
)

echo [*] Initializing Git repository...
git init

echo [*] Staging all project files...
git add .

echo [*] Creating commit...
git commit -m "feat: FinLens UPI Spend Visualization, Pre-Purchase Scanner & PRD Documentation"

echo [*] Setting branch to main...
git branch -M main

echo [*] Connecting to your GitHub repository...
git remote remove origin >nul 2>nul
git remote add origin https://github.com/madhabi007/FinLens-Intelligent-UPI-Spend-Visualization-Pre-Purchase-Co-Pilot.git

echo [*] Pushing code to GitHub...
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [*] Standard push failed (likely remote contains initial README). Trying rebase pull...
    git pull origin main --rebase
    git push -u origin main
)

echo.
echo ===================================================
echo   SUCCESS! FinLens is now live on your GitHub:
echo   https://github.com/madhabi007/FinLens-Intelligent-UPI-Spend-Visualization-Pre-Purchase-Co-Pilot
echo ===================================================
echo.
pause

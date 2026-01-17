@echo off
REM RAG System Windows Deployment Helper
REM This script helps with Windows deployment tasks

echo 🚀 RAG System Windows Deployment Helper
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Check if npm is available
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not available
    pause
    exit /b 1
)

echo ✅ Node.js and npm are available
echo.

echo What would you like to do?
echo 1) Setup production environment
echo 2) Verify deployment
echo 3) Test system locally
echo 4) Build frontend for production
echo 5) Exit
echo.

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo.
    echo 🔧 Setting up production environment...
    node scripts/setup-production-env.js
) else if "%choice%"=="2" (
    echo.
    echo 🧪 Verifying deployment...
    node scripts/verify-deployment.js
) else if "%choice%"=="3" (
    echo.
    echo 🧪 Testing system locally...
    node scripts/test-system.js
) else if "%choice%"=="4" (
    echo.
    echo 🎨 Building frontend for production...
    cd frontend
    npm install
    npm run build
    echo ✅ Frontend built successfully
    echo 📁 Build files are in frontend/build/
    cd ..
) else if "%choice%"=="5" (
    echo Goodbye!
    exit /b 0
) else (
    echo ❌ Invalid choice
    pause
    exit /b 1
)

echo.
echo ✅ Task completed!
pause
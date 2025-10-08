@echo off
echo 🚀 Starting TrendFeed Backend...
echo ================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

REM Navigate to backend directory
cd backend

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️  .env file not found. Please create it manually.
    echo Copy .env.example to .env and configure your API keys.
    pause
)

REM Setup database
echo 🗄️  Setting up database...
npm run setup

REM Start the server
echo 🌐 Starting API server on port 3001...
echo 📊 Starting data ingestion worker...
echo.
echo ✅ Backend is running!
echo 🔗 API: http://localhost:3001
echo 📋 Health check: http://localhost:3001/api/health
echo.
echo Press Ctrl+C to stop

REM Start both server and worker
start "TrendFeed API Server" cmd /k "npm start"
start "TrendFeed Data Worker" cmd /k "npm run worker"

echo.
echo Both services started in separate windows.
echo Close this window when you're done.
pause

@echo off
echo 🚀 Starting Conversational Agent Framework for Onboarding...

REM Check if MongoDB is running
echo 📋 Checking MongoDB connection...
mongosh --eval "db.runCommand('ping')" >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  MongoDB is not running. Please start MongoDB first:
    echo    - Run: mongod
    echo    - Or start MongoDB service
    echo.
    echo Press any key to continue anyway (application will try to connect)...
    pause >nul
)

REM Start the application
echo 🎯 Starting the application...
echo    - Backend: http://localhost:5000
echo    - Frontend: http://localhost:3000
echo.
echo Press Ctrl+C to stop the application
echo.

npm run dev

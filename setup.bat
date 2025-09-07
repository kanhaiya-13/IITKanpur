@echo off
echo 🚀 Setting up Conversational Agent Framework for Onboarding...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ and try again.
    pause
    exit /b 1
)

echo ✅ Node.js detected
node --version

REM Install dependencies
echo 📦 Installing dependencies...
call npm run install:all

REM Create backend .env file if it doesn't exist
if not exist "backend\.env" (
    echo 📝 Creating backend .env file...
    (
        echo # Database
        echo MONGODB_URI=mongodb://localhost:27017/conversational-agent
        echo.
        echo # JWT
        echo JWT_SECRET=your-super-secret-jwt-key-for-hackathon
        echo JWT_EXPIRE=7d
        echo.
        echo # Server
        echo PORT=5000
        echo NODE_ENV=development
        echo FRONTEND_URL=http://localhost:3000
        echo.
        echo # Rate Limiting
        echo RATE_LIMIT_WINDOW_MS=900000
        echo RATE_LIMIT_MAX_REQUESTS=100
        echo.
        echo # AI/NLP Configuration
        echo NLP_CONFIDENCE_THRESHOLD=0.7
        echo MAX_CONVERSATION_HISTORY=50
    ) > backend\.env
    echo ✅ Backend .env file created
) else (
    echo ✅ Backend .env file already exists
)

REM Create logs directory
if not exist "backend\logs" mkdir backend\logs
echo ✅ Logs directory created

REM Seed database
echo 🌱 Seeding database with initial data...
call npm run seed

echo.
echo 🎉 Setup completed successfully!
echo.
echo 📋 Next steps:
echo 1. Start MongoDB (if not already running):
echo    - Start MongoDB service: mongod
echo    - Or start MongoDB as a service on Windows
echo    - Default connection: mongodb://localhost:27017
echo.
echo 2. Start the application:
echo    npm run dev
echo.
echo 3. Access the application:
echo    - Frontend: http://localhost:3000
echo    - Backend API: http://localhost:5000
echo.
echo 4. Test accounts:
echo    - Admin: admin@example.com / admin123
echo    - User: user@example.com / user123
echo.
echo 🔧 For production build:
echo    npm run build
echo.
echo Happy coding! 🚀
pause

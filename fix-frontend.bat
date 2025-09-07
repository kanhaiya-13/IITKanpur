@echo off
echo 🔧 Fixing frontend dependencies...

cd frontend

echo 📦 Installing frontend dependencies...
call npm install

echo ✅ Frontend dependencies installed!
echo.
echo Now try running the application again:
echo npm run dev
echo.
pause

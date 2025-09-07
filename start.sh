#!/bin/bash

echo "🚀 Starting Conversational Agent Framework for Onboarding..."

# Check if MongoDB is running
echo "📋 Checking MongoDB connection..."
if ! mongosh --eval "db.runCommand('ping')" >/dev/null 2>&1; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first:"
    echo "   - Run: mongod"
    echo "   - Or start MongoDB service"
    echo ""
    echo "Press Enter to continue anyway (application will try to connect)..."
    read
fi

# Start the application
echo "🎯 Starting the application..."
echo "   - Backend: http://localhost:5000"
echo "   - Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the application"
echo ""

npm run dev

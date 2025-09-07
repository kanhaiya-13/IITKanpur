#!/bin/bash

# Conversational Agent Framework Setup Script
echo "🚀 Setting up Conversational Agent Framework for Onboarding..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check MongoDB availability
echo "📋 Make sure MongoDB is running on your system"
echo "   - Start MongoDB: mongod"
echo "   - Default connection: mongodb://localhost:27017"

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Create backend .env file if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend .env file..."
    cat > backend/.env << EOF
# Database
MONGODB_URI=mongodb://localhost:27017/conversational-agent

# JWT
JWT_SECRET=your-super-secret-jwt-key-for-hackathon
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# AI/NLP Configuration
NLP_CONFIDENCE_THRESHOLD=0.7
MAX_CONVERSATION_HISTORY=50
EOF
    echo "✅ Backend .env file created"
else
    echo "✅ Backend .env file already exists"
fi

# Create logs directory
mkdir -p backend/logs
echo "✅ Logs directory created"

# Seed database
echo "🌱 Seeding database with initial data..."
npm run seed

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Start MongoDB (if not already running):"
echo "   - Start MongoDB: mongod"
echo "   - Default connection: mongodb://localhost:27017"
echo ""
echo "2. Start the application:"
echo "   npm run dev"
echo ""
echo "3. Access the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:5000"
echo ""
echo "4. Test accounts:"
echo "   - Admin: admin@example.com / admin123"
echo "   - User: user@example.com / user123"
echo ""
echo "🔧 For production build:"
echo "   npm run build"
echo ""
echo "Happy coding! 🚀"

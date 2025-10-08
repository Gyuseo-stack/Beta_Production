#!/bin/bash

echo "🚀 Starting TrendFeed Backend..."
echo "================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Navigate to backend directory
cd backend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from example..."
    cp .env.example .env 2>/dev/null || echo "Please create .env file manually"
fi

# Setup database
echo "🗄️  Setting up database..."
npm run setup

# Start the server
echo "🌐 Starting API server on port 3001..."
echo "📊 Starting data ingestion worker..."
echo ""
echo "✅ Backend is running!"
echo "🔗 API: http://localhost:3001"
echo "📋 Health check: http://localhost:3001/api/health"
echo ""
echo "Press Ctrl+C to stop"

# Start both server and worker in background
npm start &
SERVER_PID=$!

npm run worker &
WORKER_PID=$!

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    kill $SERVER_PID 2>/dev/null
    kill $WORKER_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT

# Wait for processes
wait

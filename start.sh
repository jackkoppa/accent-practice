#!/bin/bash

# AI Accent Coach - Start Script
# Runs both backend and frontend servers

set -e

echo "🎙️  Starting AI Accent Coach..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if setup has been run
if [ ! -d "backend/venv" ]; then
    echo -e "${YELLOW}⚠️  Setup not complete. Running setup first...${NC}"
    echo ""
    ./setup.sh
fi

# Check for .env file
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  No backend/.env file found. Creating from template...${NC}"
    cp backend/env.example backend/.env
    echo "   Please add your API keys to backend/.env"
    echo ""
fi

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "Shutting down..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# Start backend
echo -e "${BLUE}Starting backend server...${NC}"
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Give backend a moment to start
sleep 2

# Start frontend
echo -e "${BLUE}Starting frontend server...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo -e "${GREEN}✅ Both servers running!${NC}"
echo ""
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8000"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""

# Wait for both processes
wait

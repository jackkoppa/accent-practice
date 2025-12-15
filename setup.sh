#!/bin/bash

# AI Accent Coach - Setup Script
# Run this once to set up both backend and frontend

set -e  # Exit on any error

echo "🎙️  AI Accent Coach - Setup"
echo "============================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for Python
echo -e "${BLUE}Checking Python...${NC}"
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "✓ Found $PYTHON_VERSION"
else
    echo "❌ Python 3 not found. Please install Python 3.9+ first."
    echo "   Download from: https://www.python.org/downloads/"
    exit 1
fi

# Check for Node.js
echo -e "${BLUE}Checking Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Found Node.js $NODE_VERSION"
else
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

# Check for ffmpeg (needed for audio conversion)
echo -e "${BLUE}Checking ffmpeg...${NC}"
if command -v ffmpeg &> /dev/null; then
    echo "✓ Found ffmpeg"
else
    echo -e "${YELLOW}⚠️  ffmpeg not found. Audio processing requires ffmpeg.${NC}"
    echo ""
    echo "   Install ffmpeg:"
    echo "   • macOS:   brew install ffmpeg"
    echo "   • Ubuntu:  sudo apt install ffmpeg"
    echo "   • Windows: Download from https://ffmpeg.org/download.html"
    echo ""
    read -p "   Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""

# Backend setup
echo -e "${BLUE}Setting up Backend...${NC}"
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "  Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate and install dependencies
echo "  Installing Python dependencies..."
source venv/bin/activate
pip install -r requirements.txt --quiet

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "  Creating .env file (you'll need to add your API keys)..."
    cp env.example .env
fi

cd ..

echo -e "${GREEN}✓ Backend ready${NC}"
echo ""

# Frontend setup
echo -e "${BLUE}Setting up Frontend...${NC}"
cd frontend
echo "  Installing npm dependencies..."
npm install --silent
cd ..
echo -e "${GREEN}✓ Frontend ready${NC}"

echo ""
echo "============================"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Add your API keys to backend/.env"
echo "  2. Run: ./start.sh"
echo ""

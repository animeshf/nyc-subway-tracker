#!/bin/bash

# MTA Subway Tracker - Start Script

# Note: .env file is optional - MTA no longer requires API keys
if [ ! -f .env ]; then
    echo "ℹ️  Note: No .env file found (this is fine - API keys are optional)"
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
echo "🔧 Setting up dependencies..."
source venv/bin/activate
pip install -q -r requirements.txt

# Start the Flask server
echo ""
echo "🚇 Starting NYC Subway Tracker..."
echo "📍 Server will be available at: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python app.py


#!/bin/bash
echo "================================"
echo "   DETECTIFY BACKEND SETUP"
echo "================================"

echo ""
echo "[1/3] Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "[2/3] Training ML model..."
python ml/train.py

echo ""
echo "[3/3] Starting server..."
echo "Server running at http://localhost:8000"
echo "API docs at http://localhost:8000/docs"
echo "Press Ctrl+C to stop"
echo ""
uvicorn main:app --reload --host 0.0.0.0 --port 8000
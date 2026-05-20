@echo off
echo Installing dependencies...
pip install -r requirements.txt

echo.
echo Training ML model...
python ml/train.py

echo.
echo Starting server...
uvicorn main:app --reload --host 0.0.0.0 --port 8000
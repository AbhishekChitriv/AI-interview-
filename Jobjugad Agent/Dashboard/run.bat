@echo off
cd /d "%~dp0"
if not exist ".venv" (
    echo Creating virtual environment...
    python -m venv .venv
)
call .venv\Scripts\activate.bat
pip install -q -r requirements.txt
echo.
echo Starting Candidate Dashboard on http://127.0.0.1:8000
python app.py

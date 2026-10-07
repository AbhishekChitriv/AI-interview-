@echo off
cd /d "%~dp0"
pip install -r requirements.txt
start "" http://127.0.0.1:8010
python app.py

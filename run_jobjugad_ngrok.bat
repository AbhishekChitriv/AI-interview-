@echo off
title JobJugad + ngrok Tunnel
set "APP_DIR=%~dp0New AI Jobjugad (2)\New AI Jobjugad\My Jobjugad\Jobjugad Agent (1)\Jobjugad Agent\jobjugad"

echo ========================================================
echo   Starting JobJugad Unified Platform + ngrok Tunnel
echo ========================================================
echo.

:: Start JobJugad backend in a separate window
start "JobJugad Backend Server (Port 8000)" cmd /k "cd /d ""%APP_DIR%"" && python jobjugad.py"

:: Wait a brief moment for the backend to bind port 8000
timeout /t 3 /nobreak >nul

:: Start ngrok tunnel
echo.
echo Starting ngrok tunnel on port 8000...
echo Web inspect dashboard available at http://127.0.0.1:4040
echo.
ngrok http 8000

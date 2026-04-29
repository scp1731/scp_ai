@echo off
title AI Chat - DeepSeek
cd /d "%~dp0"

echo ================================
echo   AI Chat Starting...
echo ================================
echo.

echo [1/2] Starting server (port 3001)...
start "AI Chat Server" cmd /k "cd /d server && node src/index.js"

timeout /t 3 /nobreak >nul

echo [2/2] Starting client (port 5173)...
start "AI Chat Client" cmd /k "cd /d client && npx vite"

echo.
echo ================================
echo   Done!
echo   Client: http://localhost:5173
echo   Server: http://localhost:3001
echo ================================
echo.
echo You can close this window.
echo.

pause

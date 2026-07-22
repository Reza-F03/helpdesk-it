@echo off
echo ========================================
echo   Restarting Helpdesk Server
echo ========================================
echo.

echo [1/3] Stopping existing Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo [2/3] Clearing terminal...
cls

echo ========================================
echo   Starting Helpdesk Server
echo ========================================
echo.
echo Server will start in 2 seconds...
echo Press Ctrl+C to stop the server
echo.
timeout /t 2 >nul

echo [3/3] Starting server...
echo.
node server.js

@echo off
title Stock AI Terminal - Mobile Anywhere Tunnel
color 0b
echo ========================================================
echo     Starting Mobile Tunnel for Remote Access...
echo ========================================================
echo.
echo Starting local Node server...
start /b node server.js
timeout /t 3 >nul
echo.
echo Starting Mobile Tunnel via localtunnel...
npx -y localtunnel --port 3000
pause

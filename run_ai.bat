@echo off
title Stock AI Terminal - Local Launcher
color 0a
echo ========================================================
echo        Starting AI Stock Market Intelligence Terminal...
echo ========================================================
echo.
echo Opening Local Web Dashboard at http://localhost:3000 ...
start http://localhost:3000
echo.
node server.js
pause

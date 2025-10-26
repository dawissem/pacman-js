@echo off
echo ========================================
echo Starting Pac-Man Multiplayer Server
echo ========================================
echo.

echo Installing dependencies...
call npm install

echo.
echo Starting server on http://localhost:3000
echo.
call npm start

@echo off
cd /d "%~dp0"
where node >nul 2>&1 || (echo Node.js 20 or newer is required. Install it from https://nodejs.org and run this again. & pause & exit /b 1)
call npm install || (echo npm install failed. & pause & exit /b 1)
call npm run build || (echo Build failed. & pause & exit /b 1)
echo.
echo Setup finished. Double-click start.bat to open the app.
pause

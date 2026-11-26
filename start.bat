@echo off
cd /d "%~dp0"
if not exist dist\cli.js (echo Run setup.bat first. & pause & exit /b 1)
node gui\server.cjs
pause

@echo off
REM Double-click to dry-run the frontend with sample data (no backend needed).
REM Opens http://localhost:5173 once the dev server is up. Close this window to stop.
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Get it from https://nodejs.org ^(version 20 or newer^).
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies, this takes a minute the first time...
  call npm install || (pause & exit /b 1)
)

echo.
echo  Demo accounts ^(any password works^):
echo    nsantos  - Nurse
echo    acruz    - Admin
echo  Forgot password: use nsantos@isu.edu.ph - the code is shown on screen.
echo.
start "" http://localhost:5173
call npm run demo

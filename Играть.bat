@echo off
setlocal
cd /d "%~dp0"
if exist "%~dp0.runtime\node-v26.13.0-win-x64\node.exe" set "PATH=%~dp0.runtime\node-v26.13.0-win-x64;%PATH%"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js not found. Install Node.js 22 LTS and try again.
  pause
  exit /b 1
)
if not exist "%~dp0node_modules\vite" (
  call npm.cmd ci
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
start "Shepotok server" cmd /k "npm.cmd run dev -- --port 5173 --strictPort"
timeout /t 3 /nobreak >nul
start "" "http://localhost:5173/"

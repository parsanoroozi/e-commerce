@echo off
setlocal

cd /d "%~dp0"

if not exist ".run" mkdir ".run"

where docker >nul 2>nul
if not errorlevel 1 (
  echo Starting PostgreSQL and MailHog with Docker Compose...
  docker compose up -d
  echo.
) else (
  echo Docker was not found. Make sure PostgreSQL is already running on localhost:5432.
  echo.
)

echo Opening backend and frontend in separate terminals...
start "ShopVerse Backend" cmd /k ""%~dp0run-backend.cmd""
timeout /t 8 /nobreak >nul
start "ShopVerse Frontend" cmd /k ""%~dp0run-frontend.cmd""

echo.
echo ShopVerse local development is starting.
echo Backend:  http://localhost:8080
echo Frontend: http://127.0.0.1:5173
echo MailHog:  http://localhost:8025
echo.
echo Close the opened terminal windows to stop the backend and frontend.

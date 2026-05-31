@echo off
setlocal

cd /d "%~dp0frontend\e-commerce-frontend"

if "%VITE_BACKEND_PROXY_TARGET%"=="" set "VITE_BACKEND_PROXY_TARGET=http://localhost:8080"
if "%VITE_ALLOWED_HOSTS%"=="" set "VITE_ALLOWED_HOSTS=localhost,127.0.0.1"

if not exist "node_modules" (
  echo Installing frontend dependencies...
  call npm install
  if errorlevel 1 exit /b 1
)

echo Starting ShopVerse frontend on http://127.0.0.1:5173
echo Backend proxy target: %VITE_BACKEND_PROXY_TARGET%
echo.

call npm run dev -- --host 127.0.0.1 --port 5173

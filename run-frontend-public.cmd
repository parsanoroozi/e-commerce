@echo off
cd /d "%~dp0frontend\e-commerce-frontend"
"C:\Program Files\nodejs\npx.cmd" vite --host 0.0.0.0 --port 5174 > "%~dp0.run\frontend-live.log" 2>&1

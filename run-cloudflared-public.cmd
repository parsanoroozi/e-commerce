@echo off
cd /d "%~dp0"
".tools\cloudflared.exe" tunnel --url http://localhost:5174 > ".run\cloudflared.log" 2>&1

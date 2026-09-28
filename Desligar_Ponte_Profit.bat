@echo off
title Encerrar Ponte Profit
cd /d "%~dp0"
echo ===========================================
echo   Encerrando Ponte Profit Pro...
echo ===========================================
echo.

taskkill /F /FI "IMAGENAME eq pythonw.exe" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Profit Bridge*" >nul 2>&1

if exist profit_status.json del profit_status.json

echo 🔴 Ponte Profit desligada com sucesso!
echo.
timeout /t 2 >nul

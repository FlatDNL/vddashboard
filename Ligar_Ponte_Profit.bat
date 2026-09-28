@echo off
title Ponte Profit Bridge
cd /d "%~dp0"
echo ===========================================
echo   Iniciando Ponte Profit Pro (Modo Silencioso)
echo ===========================================
echo.

set PYTHON_EXE=C:\Users\daniel.reis\AppData\Local\Programs\Python\Python313\pythonw.exe

if exist "%PYTHON_EXE%" (
    start "" "%PYTHON_EXE%" "profit_bridge.py"
) else (
    start "" pythonw "profit_bridge.py"
)

echo ✅ Ponte Profit iniciada com sucesso em segundo plano!
echo    Nenhuma janela do CMD ficara aberta na sua tela.
echo.
timeout /t 2 >nul

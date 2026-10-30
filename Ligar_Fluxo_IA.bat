@echo off
chcp 65001 >nul
title Fluxo IA Master - Reversao Institucional WDO
cd /d "%~dp0"

set PYTHON_EXE=C:\Users\Daniel\AppData\Local\Programs\Python\Python312\python.exe

if exist "%PYTHON_EXE%" (
    "%PYTHON_EXE%" "master_fluxo_ia.py" real
) else (
    python "master_fluxo_ia.py" real
)

pause

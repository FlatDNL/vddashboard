@echo off
chcp 65001 >nul
title Atualizar GitHub - VDDashboard
cd /d "%~dp0"
echo ===========================================
echo   Enviando alteracoes para o GitHub...
echo ===========================================
echo.
git add .
git commit -m "feat(dashbloom): atualizacao de layout, preco justo e fluxo IA realtime" 2>nul
git push origin main
echo.
echo ===========================================
echo   Processo concluido!
echo ===========================================
pause
@echo off
title ROTALOG - Inicializador Completo
color 0F
echo ========================================================
echo       ROTALOG - INICIALIZADOR DO SISTEMA COMPLETO
echo ========================================================
echo.
echo Abrindo Backend e Painel Web...
start "ROTALOG API Backend" "%~dp0iniciar_backend.bat"
start "ROTALOG Painel Web" "%~dp0iniciar_web.bat"
echo.
echo Para abrir o aplicativo no celular, execute tambem o arquivo:
echo iniciar_mobile.bat
echo.
echo Acesse o Painel Web no navegador: http://localhost:3000
echo.
timeout /t 5

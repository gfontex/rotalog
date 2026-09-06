@echo off
title ROTALOG - Painel Web (Next.js)
color 0B
echo ========================================================
echo       ROTALOG - INICIANDO PAINEL GERENCIAL WEB
echo ========================================================
echo.
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "%~dp0web"
echo Abrindo em http://localhost:3000...
echo Para encerrar, feche esta janela ou aperte Ctrl+C.
echo.
npm run dev
pause

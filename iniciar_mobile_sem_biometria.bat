@echo off
title ROTALOG - App Mobile SEM Biometria (Operacional Direto)
color 0A
echo ========================================================
echo   ROTALOG - APP MOBILE SEM BIOMETRIA (OPERACIONAL)
echo ========================================================
echo.
echo Versao: Acesso Direto, Agil, Sem Camera e Sem Biometria.
echo.
echo 1. Baixe o aplicativo gratuito "Expo Go" na Google Play ou App Store.
echo 2. Escaneie o QR Code abaixo com a camera do celular.
echo.
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "%~dp0mobile"
npx expo start --port 8082
pause

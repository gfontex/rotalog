@echo off
title ROTALOG - App Mobile (Expo)
color 0E
echo ========================================================
echo         ROTALOG - INICIANDO APP MOBILE (EXPO)
echo ========================================================
echo.
echo 1. Baixe o aplicativo gratuito "Expo Go" na Google Play ou App Store.
echo 2. Escaneie o QR Code que vai aparecer abaixo com a camera do seu celular.
echo.
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "%~dp0mobile"
npx expo start --port 8082
pause

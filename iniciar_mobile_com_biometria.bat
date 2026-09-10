@echo off
title ROTALOG - App Mobile COM Biometria Facial (Expo)
color 0B
echo ========================================================
echo   ROTALOG - APP MOBILE COM BIOMETRIA FACIAL (EXPO)
echo ========================================================
echo.
echo Versao com: Reconhecimento Facial, Camera Frontal e IA Face ID.
echo.
echo 1. Baixe o aplicativo gratuito "Expo Go" no celular.
echo 2. Escaneie o QR Code abaixo com a camera do seu celular.
echo.
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "%~dp0mobile-com-biometria"
npx expo start --port 8083
pause

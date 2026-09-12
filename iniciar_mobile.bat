@echo off
title ROTALOG - App Mobile (React Native Expo Go)

echo ============================================================
echo   INICIANDO ROTALOG MOBILE (Expo Go + Offline-First)
echo ============================================================
echo.

cd /d "%~dp0mobile"

if not exist node_modules (
    echo [INFO] Instalando dependencias do mobile...
    call npm install
)

echo.
echo [INFO] Iniciando Metro Bundler / Expo Go...
echo * Escaneie o QR Code no aplicativo Expo Go no celular
echo * Ou pressione 'w' no terminal para abrir a versao Web de teste
echo.

call npx expo start

pause

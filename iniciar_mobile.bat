@echo off
title ROTALOG - App Mobile (React Native Expo)

echo ============================================================
echo   ROTALOG MOBILE - SELETOR DE MODO DE EXECUCAO
echo ============================================================
echo.
echo  [1] MODO TUNNEL (RECOMENDADO para Celular - Sem erro de conexao)
echo      Funciona em qualquer Wi-Fi, 4G/5G, sem bloqueio de roteador.
echo.
echo  [2] MODO WEB (Abrir o App Mobile direto no Navegador do PC)
echo      Excelente para apresentar em sala se nao quiser usar o celular.
echo.
echo  [3] MODO LAN (Padrao de rede local)
echo      Requer que celular e PC estejam exatamente na mesma rede Wi-Fi.
echo.
echo ============================================================
set /p MODO="Escolha o modo [1, 2 ou 3] e pressione ENTER (Padrao: 1): "

if "%MODO%"=="" set MODO=1

cd /d "%~dp0mobile"

if "%MODO%"=="1" (
    echo.
    echo [INFO] Iniciando Expo com TUNNEL (Garante conexao no celular)...
    call npx expo start --tunnel -c
) else if "%MODO%"=="2" (
    echo.
    echo [INFO] Abrindo o App Mobile direto no navegador (Modo Web)...
    call npx expo start --web
) else (
    echo.
    echo [INFO] Iniciando Expo no modo LAN local...
    call npx expo start -c
)

pause

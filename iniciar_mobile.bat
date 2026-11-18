@echo off
setlocal enabledelayedexpansion
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
echo      Requer que celular e PC estejam na mesma rede Wi-Fi.
echo.
echo ============================================================
set MODO=1
set /p MODO="Escolha o modo [1, 2 ou 3] e pressione ENTER (Padrao: 1): "

cd /d "%~dp0mobile"

if not exist node_modules (
    echo [INFO] Instalando dependencias do app mobile...
    call npm install
)

if "%MODO%"=="2" goto EXEC_WEB
if "%MODO%"=="3" goto EXEC_LAN

:EXEC_TUNNEL
echo.
echo [INFO] Iniciando Expo com TUNNEL (Modo seguro para celular)...
echo [DICA] Aguarde alguns segundos enquanto o tunel e o QR Code sao gerados...
call npx.cmd expo start --tunnel -c
goto FIM

:EXEC_WEB
echo.
echo [INFO] Abrindo o App Mobile no Navegador do PC (Modo Web)...
call npx.cmd expo start --web
goto FIM

:EXEC_LAN
echo.
echo [INFO] Iniciando Expo no modo LAN local...
call npx.cmd expo start -c
goto FIM

:FIM
echo.
echo [INFO] Processo finalizado.
pause

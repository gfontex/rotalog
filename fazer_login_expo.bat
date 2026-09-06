@echo off
title ROTALOG - Conectar Conta Expo CLI
color 0B
echo ========================================================
echo         ROTALOG - LOGIN NO EXPO CLI (OPCIONAL)
echo ========================================================
echo.
echo Digite o usuario/email e senha da mesma conta que voce usa
echo no aplicativo Expo Go do seu celular.
echo.
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "%~dp0mobile"
npx expo login
echo.
echo Login concluido! Agora voce ja pode abrir o iniciar_mobile.bat
pause

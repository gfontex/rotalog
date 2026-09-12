@echo off
title ROTALOG - Painel Web Administrativo (Next.js 14)

echo ============================================================
echo   INICIANDO ROTALOG WEB DASHBOARD (Next.js 14 + Tailwind)
echo ============================================================
echo.

cd /d "%~dp0web"

if not exist node_modules (
    echo [INFO] Instalando dependencias do painel web...
    call npm install
)

echo.
echo [INFO] Subindo painel do gestor de frotas na porta 3000...
echo * Dashboard: http://localhost:3000
echo.

call npm run dev

pause

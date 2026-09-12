@echo off
title ROTALOG - Backend API (NestJS + Prisma)

echo ============================================================
echo   INICIANDO ROTALOG BACKEND (NestJS + Prisma)
echo ============================================================
echo.

cd /d "%~dp0backend"

if not exist node_modules (
    echo [INFO] Instalando dependencias do backend...
    call npm install
)

echo [INFO] Gerando Prisma Client...
call npx prisma generate

echo.
echo [INFO] Iniciando servidor NestJS na porta 3001...
echo * Backend API: http://localhost:3001
echo.

call npm run start:dev

pause

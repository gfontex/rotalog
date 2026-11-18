@echo off
title ROTALOG - Backend API (NestJS + Prisma)

echo ============================================================
echo   INICIANDO ROTALOG BACKEND (NestJS + Prisma)
echo ============================================================
echo.

cd /d "%~dp0backend"

if not exist .env (
    if exist .env.example (
        echo [INFO] Criando arquivo .env a partir de .env.example...
        copy /Y .env.example .env > nul
    )
)

set NEED_INSTALL=0
if not exist "node_modules\.bin\nest.cmd" set NEED_INSTALL=1
if not exist "node_modules\.bin\prisma.cmd" set NEED_INSTALL=1

if "%NEED_INSTALL%"=="1" (
    echo [INFO] Instalando dependencias do backend...
    call npm install --include=dev
)

if not exist "node_modules\.prisma\client\index.js" (
    echo [INFO] Gerando Prisma Client local...
    call .\node_modules\.bin\prisma.cmd generate
)

echo.
echo [INFO] Iniciando servidor NestJS na porta 3001...
echo * Backend API: http://localhost:3001
echo.

call npm run start:dev

pause

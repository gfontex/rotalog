@echo off
title ROTALOG - API Backend (NestJS)
color 0A
echo ========================================================
echo          ROTALOG - INICIANDO API BACKEND
echo ========================================================
echo.
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "%~dp0backend"
echo Servidor rodando em http://localhost:3001...
echo.
npm run start:dev
pause

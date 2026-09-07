@echo off
title ROTALOG - Visualizador do Banco de Dados (Prisma Studio)
color 0B
echo ========================================================
echo        ROTALOG - PAINEL VISUAL DO BANCO (POSTGRESQL)
echo ========================================================
echo.
echo Abrindo o painel visual do banco em http://localhost:5555...
echo Voce podera visualizar, editar e gerenciar:
echo  - Funcionarios e senhas
echo  - Biometrias faciais (vetores 192-d)
echo  - Veiculos da frota MK Seguranca
echo  - Relatorios e registros de ponto
echo.
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "%~dp0backend"
npx prisma studio --port 5555 --browser none
pause

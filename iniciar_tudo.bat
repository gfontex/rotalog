@echo off
title ROTALOG - Inicializador Completo do Sistema

echo ======================================================================
echo    ROTALOG - SISTEMA INTEGRADO DE GESTAO DE FROTAS E PONTO CLT
echo ======================================================================
echo.

echo [1/3] Iniciando Backend API na porta 3001...
start "ROTALOG Backend API" /D "%~dp0" cmd /k "call iniciar_backend.bat"

ping 127.0.0.1 -n 4 > nul

echo [2/3] Iniciando Painel Web Dashboard na porta 3000...
start "ROTALOG Web Dashboard" /D "%~dp0" cmd /k "call iniciar_web.bat"

ping 127.0.0.1 -n 3 > nul

echo [3/3] Iniciando App Mobile Expo Go...
start "ROTALOG App Mobile" /D "%~dp0" cmd /k "call iniciar_mobile.bat"

echo.
echo ======================================================================
echo  TODOS OS SERVICOS FORAM DISPARADOS!
echo ======================================================================
echo.
echo  * Painel Web:         http://localhost:3000
echo  * Backend API:        http://localhost:3001
echo  * App Mobile (Expo):  http://localhost:8081 (ou QR Code no Expo Go)
echo.
echo  Credenciais de Acesso (Empresa: Teste Apresentacao / Senha: 123456):
echo   - Admin (Representante Legal): CPF 111.111.111-11
echo   - Gestor de Frota:             CPF 222.222.222-22
echo   - Motorista Operacional:       CPF 333.333.333-33
echo.
echo  (Os 3 servicos estao rodando em suas respectivas janelas abertas)
echo ======================================================================
pause

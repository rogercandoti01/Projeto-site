@echo off
title Payin - Gestao Financeira Inteligente
cls
echo ========================================================
echo        INICIANDO O PAYIN - GESTAO FINANCEIRA
echo ========================================================
echo.
echo Abrindo o servidor local e seu navegador...
echo.

:: Abrir navegador padrao em http://localhost:8080
start "" "http://localhost:8080"

:: Iniciar servidor PowerShell com bypass de politica
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"

pause

@echo off
setlocal
chcp 65001 >nul
title AutoOS - Instalador e Preparador do Sistema
cd /d "%~dp0"

echo ===============================================================================
echo            AUTOOS - PREPARANDO INSTALACAO NO SEU COMPUTADOR
echo ===============================================================================
echo.
echo Iniciando o assistente de instalacao e configuracao...
echo Por favor, aguarde a janela do assistente carregar...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -NoExit -Command "$dir = '%~dp0'; Set-Location -LiteralPath $dir; & (Join-Path $dir 'instalar.ps1')"

if errorlevel 1 (
    echo.
    echo [AVISO] Se a instalacao nao concluiu, verifique as mensagens na janela.
    pause
)

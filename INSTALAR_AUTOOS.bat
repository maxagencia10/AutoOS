@echo off
setlocal
title AutoOS - Instalador e Preparador do Sistema
cd /d "%~dp0"

echo ===============================================================================
echo            AUTOOS - PREPARANDO INSTALACAO NO SEU COMPUTADOR
echo ===============================================================================
echo.
echo Iniciando o assistente de instalacao e configuracao...
echo Por favor, aguarde a janela do assistente carregar...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$dir = '%~dp0'; Set-Location -LiteralPath $dir; & (Join-Path $dir 'instalar.ps1')"

if errorlevel 1 (
    echo.
    echo [AVISO] Se a instalacao nao concluiu, verifique as mensagens na janela.
    pause
    exit /b 1
)

:: Conclusao limpa: fecha a janela sem deixar residuos visuais para o cliente
exit /b 0

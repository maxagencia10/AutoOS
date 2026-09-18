@echo off
title AutoOS - Preparador de Pen Drive (Node Portatil)
color 0A

echo ===============================================================================
echo       AUTOOS - PREPARADOR DE PEN DRIVE COM NODE.JS PORTATIL EMBUTIDO
echo ===============================================================================
echo.
echo Este script baixa o executavel oficial do Node.js (versao LTS) diretamente
echo para a pasta "runtime" dentro deste pen drive.
echo.
echo Com isso, o AutoOS podera ser instalado e executado em QUALQUER computador
echo mesmo que o cliente nao tenha internet e nao tenha o Node instalado!
echo.
pause

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

if not exist "%SCRIPT_DIR%runtime" (
    mkdir "%SCRIPT_DIR%runtime"
)

echo.
echo [1/2] Baixando node.exe oficial para runtime\node.exe...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('https://nodejs.org/dist/v20.18.0/win-x64/node.exe', '%SCRIPT_DIR%runtime\node.exe')"

if exist "%SCRIPT_DIR%runtime\node.exe" (
    echo.
    echo [2/2] Testando executavel baixado...
    "%SCRIPT_DIR%runtime\node.exe" -v
    echo.
    echo ===============================================================================
    echo  SUCESSO! O Node.js portatil foi embutido na pasta "runtime\" com sucesso!
    echo  Agora voce pode levar este pen drive para qualquer cliente sem depender de
    echo  nenhuma instalacao previa do Node.js no Windows!
    echo ===============================================================================
) else (
    echo.
    echo [AVISO] Nao foi possivel baixar o executavel diretamente via powershell.
    echo Voce tambem pode simplesmente copiar qualquer instalador "node-v20-x64.msi"
    echo para a raiz desta pasta do pen drive.
)

echo.
pause

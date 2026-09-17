@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title AutoOS - Instalador e Preparador Completo
color 0B

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo ===============================================================================
echo            AUTOOS - INSTALACAO COMPLETA E PREPARACAO DO SISTEMA
echo ===============================================================================
echo.
echo Este assistente ira verificar tudo o que e necessario para o AutoOS rodar
echo perfeitamente no seu computador.
echo.

:: 1. VERIFICAR OU INSTALAR O NODE.JS
echo [1/4] Verificando se o Node.js esta instalado...
set "NODE_OK=0"

where node >nul 2>nul
if %errorlevel% equ 0 set "NODE_OK=1"

if "%NODE_OK%"=="0" (
    if exist "%ProgramFiles%\nodejs\node.exe" (
        set "PATH=%ProgramFiles%\nodejs;%PATH%"
        set "NODE_OK=1"
    ) else if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
        set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
        set "NODE_OK=1"
    ) else if exist "%LocalAppData%\Programs\node\node.exe" (
        set "PATH=%LocalAppData%\Programs\node;%PATH%"
        set "NODE_OK=1"
    )
)

if "%NODE_OK%"=="0" (
    echo.
    echo [!] Node.js nao encontrado. Baixando instalador oficial do Node.js (v20 LTS)...
    echo Isso e necessario para rodar o sistema local da oficina.
    echo Por favor aguarde o download...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi', '%TEMP%\node_setup.msi')"
    
    if exist "%TEMP%\node_setup.msi" (
        echo.
        echo Instalando o Node.js...
        echo Se o Windows solicitar autorizacao de Administrador, clique em 'SIM'.
        start /wait msiexec /i "%TEMP%\node_setup.msi" /passive /norestart
        del /f /q "%TEMP%\node_setup.msi" >nul 2>nul
        
        if exist "%ProgramFiles%\nodejs\node.exe" (
            set "PATH=%ProgramFiles%\nodejs;%PATH%"
            set "NODE_OK=1"
        )
    )
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    if "%NODE_OK%"=="0" (
        echo.
        echo [ERRO] Nao foi possivel instalar o Node.js automaticamente.
        echo Baixe o instalador oficial gratuito em https://nodejs.org e tente novamente.
        echo.
        pause
        exit /b 1
    )
)

echo [OK] Node.js verificado com sucesso!
echo.

:: 2. INSTALAR DEPENDENCIAS DO PROJETO (node_modules)
echo [2/4] Verificando dependencias do sistema...
if not exist "node_modules\vite" (
    echo Instalando modulos do AutoOS (primeira vez leva cerca de 1 minuto)...
    echo Aguarde...
    call npm install
    if %errorlevel% neq 0 (
        echo Tentando instalacao com modo de compatibilidade...
        call npm install --force
    )
) else (
    echo [OK] Modulos ja instalados!
)
echo.

:: 3. COMPILAR A PASTA 'dist' DO AUTOOS
echo [3/4] Compilando arquivos de alta performance (pasta dist)...
call npm run build

if not exist "dist\index.html" (
    echo.
    echo [ERRO] Falha ao compilar os arquivos na pasta 'dist'.
    echo Verifique as mensagens de erro acima.
    echo.
    pause
    exit /b 1
)
echo [OK] Pasta 'dist' compilada com sucesso!
echo.

:: 4. CRIAR ATALHO NA AREA DE TRABALHO
echo [4/4] Criando atalho na Area de Trabalho...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $d = [Environment]::GetFolderPath('Desktop'); $lnk = $ws.CreateShortcut((Join-Path $d 'AutoOS Oficina.lnk')); $lnk.TargetPath = '%SystemRoot%\System32\wscript.exe'; $lnk.Arguments = '\"' + (Join-Path (Get-Location).Path 'AutoOS_Launcher.vbs') + '\"'; $lnk.WorkingDirectory = (Get-Location).Path; $lnk.Description = 'AutoOS - Gestao de Oficina Mecanica'; $ico = Join-Path (Get-Location).Path 'dist\favicon.ico'; if (Test-Path $ico) { $lnk.IconLocation = $ico }; $lnk.Save()" >nul 2>nul

echo [OK] Atalho criado na sua Area de Trabalho!
echo.
echo ===============================================================================
echo            INSTALACAO E PREPARACAO CONCLUIDA COM SUCESSO!
echo ===============================================================================
echo O AutoOS agora esta pronto para uso.
echo Iniciando o sistema da oficina agora...
echo ===============================================================================
timeout /t 3 >nul

:: Inicia o sistema
if exist "AutoOS_Launcher.vbs" (
    start "" "%SystemRoot%\System32\wscript.exe" "AutoOS_Launcher.vbs"
) else (
    start "" http://127.0.0.1:3000
    node servidor.cjs
)

exit /b 0

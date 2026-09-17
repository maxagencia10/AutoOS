@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title AutoOS - Instalador Completo para Oficina Mecanica
color 0C

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo ===============================================================================
echo            AUTOOS - GESTAO DE OFICINA MECANICA (INSTALADOR)
echo ===============================================================================
echo.
echo Este assistente instalara e configurara o AutoOS no seu computador.
echo Se forem exibidas janelas solicitando confirmacao, clique em 'SIM'.
echo.

:: 1. VERIFICAR OU INSTALAR O NODE.JS AUTOMATICAMENTE
echo [1/4] Verificando ambiente Node.js...
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
    echo Aguarde o download terminar (cerca de 30 MB)...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi', '%TEMP%\node_setup.msi')"
    
    if exist "%TEMP%\node_setup.msi" (
        echo Instalando o Node.js no sistema...
        echo Se o Windows pedir confirmacao de administrador, clique em 'SIM'.
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

echo [OK] Node.js pronto para uso!
echo.

:: 2. LIBERAR PORTA 3000
echo [2/4] Liberando porta 3000 de processos anteriores...
for /f "tokens=5" %%p in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    taskkill /F /PID %%p >nul 2>nul
)
echo [OK] Porta 3000 liberada!
echo.

:: 3. VERIFICAR ARQUIVOS DA PASTA 'dist' OU COMPILAR
echo [3/4] Verificando arquivos do AutoOS...
if not exist "dist\index.html" (
    echo.
    echo A pasta 'dist' nao foi encontrada. Preparando os arquivos...
    if not exist "node_modules\vite" (
        echo Instalando modulos do projeto (primeira vez, aguarde cerca de 1 minuto)...
        call npm install
        if !errorlevel! neq 0 (
            call npm install --force
        )
    )
    echo Compilando arquivos de alta velocidade...
    call npm run build
)

if not exist "dist\index.html" (
    echo.
    echo [ERRO] Nao foi possivel compilar a pasta 'dist'.
    echo Verifique se ha erros exibidos acima.
    echo.
    pause
    exit /b 1
)
echo [OK] Arquivos do sistema verificados com sucesso!
echo.

:: 4. CRIAR ATALHO NA AREA DE TRABALHO
echo [4/4] Criando atalho "AutoOS Oficina" na Area de Trabalho...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $d = [Environment]::GetFolderPath('Desktop'); $lnk = $ws.CreateShortcut((Join-Path $d 'AutoOS Oficina.lnk')); $lnk.TargetPath = '%SystemRoot%\System32\wscript.exe'; $lnk.Arguments = '\"' + (Join-Path (Get-Location).Path 'AutoOS_Launcher.vbs') + '\"'; $lnk.WorkingDirectory = (Get-Location).Path; $lnk.Description = 'AutoOS - Gestao de Oficina Mecanica'; $ico = Join-Path (Get-Location).Path 'dist\favicon.ico'; if (Test-Path $ico) { $lnk.IconLocation = $ico }; $lnk.Save()" >nul 2>nul

echo [OK] Atalho criado na sua Area de Trabalho!
echo.
echo ===============================================================================
echo                     INSTALACAO CONCLUIDA COM SUCESSO!
echo ===============================================================================
echo O sistema AutoOS foi instalado e configurado no seu computador.
echo Iniciando o AutoOS em 3 segundos...
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

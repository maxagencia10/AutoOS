@echo off
chcp 65001 >nul
title AutoOS - Instalador e Inicializador Automático
color 0C

echo ===============================================================================
echo                AUTOOS - GESTAO DE OFICINA MECANICA (AUTO-INSTALADOR)
echo ===============================================================================
echo.
echo Este utilitario vai preparar, instalar e iniciar o AutoOS automaticamente no
echo computador do cliente em apenas alguns segundos.
echo.

:: 1. Verificacao e Instalacao do Node.js
echo [Passo 1/4] Verificando ambiente de execucao Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [!] Node.js nao encontrado no sistema operacional.
    echo.
    echo Tentando baixar e instalar o Node.js LTS silenciosamente via winget...
    where winget >nul 2>nul
    if %errorlevel% equ 0 (
        echo Executando: winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
        winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
        echo.
        echo Se a instalacao concluiu, por favor feche esta janela e execute o arquivo novamente
        echo para que o Windows reconheca o comando node no PATH do sistema.
        echo.
        pause
        exit /b 0
    ) else (
        echo Nao foi possivel instalar automaticamente via winget.
        echo Abrindo o site oficial do Node.js para download...
        start https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi
        echo.
        echo Apos instalar o arquivo baixado, de dois cliques novamente neste instalador.
        pause
        exit /b 1
    )
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
echo [OK] Node.js detectado: %NODE_VERSION%
echo.

:: 2. Instalacao das Dependencias
echo [Passo 2/4] Verificando e instalando dependencias e modulos locais...
if not exist "node_modules\" (
    echo Instalando pacotes... Por favor aguarde cerca de 1 minuto...
    call npm install --no-audit --no-fund
    if %errorlevel% neq 0 (
        echo [ERRO] Falha ao instalar dependencias com npm install.
        pause
        exit /b 1
    )
    echo [OK] Dependencias instaladas com sucesso!
) else (
    echo [OK] Dependencias ja configuradas.
)
echo.

:: 3. Criar Atalho na Area de Trabalho do Cliente
echo [Passo 3/4] Criando atalho na Area de Trabalho...
set "SCRIPT_DIR=%~dp0"
set "TARGET_BAT=%SCRIPT_DIR%INICIAR_AUTOOS.bat"
set "VBS_SCRIPT=%TEMP%\criar_atalho_autoos.vbs"

echo Set oWS = WScript.CreateObject("WScript.Shell") > "%VBS_SCRIPT%"
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\AutoOS Oficina.lnk" >> "%VBS_SCRIPT%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%VBS_SCRIPT%"
echo oLink.TargetPath = "%TARGET_BAT%" >> "%VBS_SCRIPT%"
echo oLink.WorkingDirectory = "%SCRIPT_DIR%" >> "%VBS_SCRIPT%"
echo oLink.Description = "Sistema AutoOS para Oficina Mecanica" >> "%VBS_SCRIPT%"
echo oLink.Save >> "%VBS_SCRIPT%"

cscript //nologo "%VBS_SCRIPT%" >nul 2>nul
if exist "%VBS_SCRIPT%" del /f /q "%VBS_SCRIPT%"
echo [OK] Atalho "AutoOS Oficina" criado na Area de Trabalho do cliente!
echo.

:: 4. Inicializacao do Sistema
echo [Passo 4/4] Inicializando servidor e abrindo o AutoOS...
echo.
echo ===============================================================================
echo  Sistema pronto!
echo  Endereco: http://localhost:3000
echo  Mantenha esta janela aberta enquanto utilizar o sistema.
echo ===============================================================================
echo.

:: Dispara abertura do navegador apos 3 segundos
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

:: Inicia o servidor Vite na porta 3000
call npm run dev

pause

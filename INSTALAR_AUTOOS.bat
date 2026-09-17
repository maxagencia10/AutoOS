@echo off
chcp 65001 >nul
title AutoOS - Instalador Automático
color 0C

set "SILENT_MODE=0"
if "%~1"=="/silent" set "SILENT_MODE=1"
if "%~1"=="-s" set "SILENT_MODE=1"

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

if "%SILENT_MODE%"=="0" (
    echo ===============================================================================
    echo                AUTOOS - GESTAO DE OFICINA MECANICA (INSTALADOR)
    echo ===============================================================================
    echo.
    echo Configurando o sistema no computador... Aguarde alguns instantes.
    echo.
)

:: 1. DETECCAO DO NODE.JS (EMBUTIDO / INSTALADOR LOCAL / SISTEMA / WINGET)
set "NODE_CMD="

:: A) Verifica se ha Node.js portatil embutido na pasta
if exist "%SCRIPT_DIR%runtime\node.exe" (
    set "NODE_CMD=%SCRIPT_DIR%runtime\node.exe"
    goto :NODE_FOUND
)
if exist "%SCRIPT_DIR%node\node.exe" (
    set "NODE_CMD=%SCRIPT_DIR%node\node.exe"
    goto :NODE_FOUND
)

:: B) Verifica se ha instalador .msi colocado na pasta do pen drive para instalacao silenciosa
for %%f in ("%SCRIPT_DIR%node*.msi" "%SCRIPT_DIR%instalador\node*.msi" "%SCRIPT_DIR%instaladores\node*.msi") do (
    if exist "%%~ff" (
        if "%SILENT_MODE%"=="0" echo [1/4] Instalando pacote Node.js embutido silenciosamente...
        start /wait msiexec /i "%%~ff" /qn /norestart
        timeout /t 2 >nul
    )
)

:: C) Verifica instalacao padrao no Windows
if exist "%ProgramFiles%\nodejs\node.exe" (
    set "NODE_CMD=%ProgramFiles%\nodejs\node.exe"
    set "PATH=%ProgramFiles%\nodejs;%PATH%"
    goto :NODE_FOUND
)
if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
    set "NODE_CMD=%ProgramFiles(x86)%\nodejs\node.exe"
    set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
    goto :NODE_FOUND
)
if exist "%LocalAppData%\Programs\node\node.exe" (
    set "NODE_CMD=%LocalAppData%\Programs\node\node.exe"
    set "PATH=%LocalAppData%\Programs\node;%PATH%"
    goto :NODE_FOUND
)

:: D) Verifica via comando where node
where node >nul 2>nul
if %errorlevel% equ 0 (
    set "NODE_CMD=node"
    goto :NODE_FOUND
)

:: E) Tentativa via winget
where winget >nul 2>nul
if %errorlevel% equ 0 (
    if "%SILENT_MODE%"=="0" echo [1/4] Instalando Node.js via winget...
    winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements >nul 2>nul
    if exist "%ProgramFiles%\nodejs\node.exe" (
        set "NODE_CMD=%ProgramFiles%\nodejs\node.exe"
        set "PATH=%ProgramFiles%\nodejs;%PATH%"
        goto :NODE_FOUND
    )
)

:: Se nao encontrou de nenhuma forma
if "%NODE_CMD%"=="" (
    if "%SILENT_MODE%"=="0" (
        echo.
        echo [!] O Node.js nao foi detectado no sistema.
        echo Voce pode colocar o arquivo instalador do Node (ex: node-v20-x64.msi)
        echo dentro desta mesma pasta para instalacao 100%% automatica no pen drive.
        echo.
        pause
    )
    exit /b 1
)

:NODE_FOUND
if "%SILENT_MODE%"=="0" echo [1/4] Ambiente Node.js verificado com sucesso.

:: 2. LIBERAR PORTA 3000 DE EXECUCOES ANTERIORES
if "%SILENT_MODE%"=="0" echo [2/4] Liberando porta 3000...
for /f "tokens=5" %%p in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    taskkill /F /PID %%p >nul 2>nul
)

:: 3. VERIFICAR PACOTE DE PRODUCAO OTIMIZADO
if "%SILENT_MODE%"=="0" echo [3/4] Verificando arquivos do AutoOS...
if not exist "%SCRIPT_DIR%dist\index.html" (
    if "%SILENT_MODE%"=="0" (
        echo.
        echo [AVISO] Pasta dist nao encontrada. Compilando pacote...
    )
    call npm run build
    if not exist "%SCRIPT_DIR%dist\index.html" (
        if "%SILENT_MODE%"=="0" (
            echo Instalando dependencias do projeto...
            call npm install
            call npm run build
        )
    )
)

:: 4. CRIAR ATALHO NA AREA DE TRABALHO
if "%SILENT_MODE%"=="0" echo [4/4] Criando atalho na Area de Trabalho do cliente...
set "VBS_SHORTCUT=%TEMP%\criar_atalho_autoos.vbs"

echo Set oWS = WScript.CreateObject("WScript.Shell") > "%VBS_SHORTCUT%"
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\AutoOS Oficina.lnk" >> "%VBS_SHORTCUT%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%VBS_SHORTCUT%"
echo oLink.TargetPath = "%SystemRoot%\System32\wscript.exe" >> "%VBS_SHORTCUT%"
echo oLink.Arguments = """" ^& "%SCRIPT_DIR%AutoOS_Launcher.vbs" ^& """" >> "%VBS_SHORTCUT%"
echo oLink.WorkingDirectory = "%SCRIPT_DIR%" >> "%VBS_SHORTCUT%"
echo oLink.Description = "Sistema AutoOS para Oficina Mecanica" >> "%VBS_SHORTCUT%"
echo If CreateObject("Scripting.FileSystemObject").FileExists("%SCRIPT_DIR%dist\favicon.ico") Then >> "%VBS_SHORTCUT%"
echo     oLink.IconLocation = "%SCRIPT_DIR%dist\favicon.ico" >> "%VBS_SHORTCUT%"
echo ElseIf CreateObject("Scripting.FileSystemObject").FileExists("%SCRIPT_DIR%public\favicon.ico") Then >> "%VBS_SHORTCUT%"
echo     oLink.IconLocation = "%SCRIPT_DIR%public\favicon.ico" >> "%VBS_SHORTCUT%"
echo Else >> "%VBS_SHORTCUT%"
echo     oLink.IconLocation = "shell32.dll,41" >> "%VBS_SHORTCUT%"
echo End If >> "%VBS_SHORTCUT%"
echo oLink.Save >> "%VBS_SHORTCUT%"

cscript //nologo "%VBS_SHORTCUT%" >nul 2>nul
if exist "%VBS_SHORTCUT%" del /f /q "%VBS_SHORTCUT%"

:: 5. INICIAR O SISTEMA VIA LAUNCHER EM JANELA NATIVA (SEM TELA PRETA)
start "" "%SystemRoot%\System32\wscript.exe" "%SCRIPT_DIR%AutoOS_Launcher.vbs"

if "%SILENT_MODE%"=="0" (
    echo.
    echo ===============================================================================
    echo  [OK] INSTALACAO CONCLUIDA COM SUCESSO!
    echo  O atalho "AutoOS Oficina" foi criado na sua Area de Trabalho.
    echo  O sistema esta sendo aberto em janela propria agora.
    echo ===============================================================================
    timeout /t 3 >nul
)

exit /b 0

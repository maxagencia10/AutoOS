@echo off
chcp 65001 >nul
title AutoOS - Inicializador
color 0A

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: Se a pasta dist ainda não existir, direciona para o preparador completo
if not exist "dist\index.html" (
    echo [AVISO] O AutoOS precisa ser preparado na primeira execucao.
    call GERAR_DIST_AGORA.bat
    exit /b 0
)

:: Tenta abrir diretamente pelo Launcher nativo (janela de aplicativo sem tela preta)
if exist "%SCRIPT_DIR%AutoOS_Launcher.vbs" (
    start "" "%SystemRoot%\System32\wscript.exe" "%SCRIPT_DIR%AutoOS_Launcher.vbs"
    exit /b 0
)

:: Fallback se o launcher VBS não estiver disponível
echo ===============================================================================
echo                 AUTOOS - INICIANDO SISTEMA DA OFICINA
echo ===============================================================================
echo.
echo Liberando porta 3000...
for /f "tokens=5" %%p in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    taskkill /F /PID %%p >nul 2>nul
)

echo Abrindo navegador...
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://127.0.0.1:3000"

echo Iniciando servidor local...
node servidor.cjs
pause

@echo off
title AutoOS - Inicializador
color 0A

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: Se a pasta dist ainda nao existir, direciona para o preparador completo
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

:: Fallback se o launcher VBS nao estiver disponivel
echo ===============================================================================
echo                 AUTOOS - INICIANDO SISTEMA DA OFICINA
echo ===============================================================================
echo.
echo Liberando portas antigas...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports = @(3000,3001,3002); foreach ($p in $ports) { try { Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } } catch {} }" >nul 2>nul
taskkill /F /IM node.exe >nul 2>nul

echo Iniciando servidor local com selecao automatica de portas...
powershell -NoProfile -Command "Start-Process node -ArgumentList 'servidor.cjs' -WindowStyle Hidden"
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://127.0.0.1:3000"

echo [OK] Servidor ativo em segundo plano! Nenhuma janela precisa ficar aberta.
timeout /t 2 >nul
exit /b 0

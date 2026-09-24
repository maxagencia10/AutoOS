@echo off
setlocal enabledelayedexpansion
title AutoOS - Destravar e Iniciar Sistema
color 0A

cd /d "%~dp0"

echo ===============================================================================
echo                 AUTOOS - UTILITARIO DE DESTRAVAMENTO RAPIDO
echo ===============================================================================
echo.
echo Este script resolve automaticamente travamentos e portas presas no Windows.
echo Seus clientes, veiculos e ordens de servico continuam 100%% seguros e intactos.
echo.

echo [1/4] Finalizando processos orfaos e liberando portas (3000 a 3005)...
:: Encerra processos do node
taskkill /F /IM node.exe >nul 2>nul

:: Encerra processos segurando portas 3000 a 3005 usando PowerShell
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports = @(3000,3001,3002,3003,3004,3005); foreach ($p in $ports) { try { Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } } catch {} }" >nul 2>nul

:: Fallback adicional via netstat
for /f "tokens=5" %%p in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    taskkill /F /PID %%p >nul 2>nul
)

:: Limpa arquivos temporarios de log e controle de porta
if exist "active_port.txt" del /f /q "active_port.txt" >nul 2>nul
if exist "servidor.log" del /f /q "servidor.log" >nul 2>nul

:: Aguarda 1 segundo para a pilha de rede do Windows liberar sockets em TIME_WAIT
timeout /t 1 /nobreak >nul
echo [OK] Portas liberadas com sucesso!
echo.

echo [2/4] Verificando pacote de producao (dist)...
if not exist "dist\index.html" (
    echo Compilando versao otimizada (dist)... Por favor aguarde...
    if exist "build.cjs" (
        node build.cjs
    ) else if exist "GERAR_DIST_AGORA.bat" (
        call GERAR_DIST_AGORA.bat
    ) else (
        call npm install
        call npm run build
    )
) else (
    echo [OK] Versao otimizada pronta para uso!
)
echo.

echo [3/4] Atualizando atalho na Area de Trabalho...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $desktop = [Environment]::GetFolderPath('Desktop'); $s = $ws.CreateShortcut((Join-Path $desktop 'AutoOS Oficina.lnk')); $s.TargetPath = [System.IO.Path]::Combine($env:SystemRoot, 'System32\wscript.exe'); $s.Arguments = '\"' + (Join-Path (Get-Location).Path 'AutoOS_Launcher.vbs') + '\"'; $s.WorkingDirectory = (Get-Location).Path; $s.Description = 'AutoOS - Gestao de Oficina Mecanica'; $ico = Join-Path (Get-Location).Path 'dist\favicon.ico'; if (Test-Path -LiteralPath $ico) { $s.IconLocation = $ico }; $s.Save()" >nul 2>nul
echo [OK] Atalho atualizado!
echo.

echo [4/4] Reiniciando o servidor com protecao inteligente de portas...
if exist "AutoOS_Launcher.vbs" (
    start "" "%SystemRoot%\System32\wscript.exe" "AutoOS_Launcher.vbs" "/restart"
) else (
    powershell -NoProfile -Command "Start-Process node -ArgumentList 'servidor.cjs' -WindowStyle Hidden"
    start "" cmd /c "timeout /t 2 /nobreak >nul && start http://127.0.0.1:3000"
)

echo ===============================================================================
echo  [OK] AutoOS destravado com sucesso!
echo  O servidor agora possui protecao com selecao automatica de porta livre.
echo  A janela do sistema abrira em alguns segundos.
echo ===============================================================================
echo.
echo Fechando esta janela em 3 segundos...
timeout /t 3 >nul
exit /b 0

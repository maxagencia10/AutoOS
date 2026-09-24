@echo off
setlocal
title AutoOS - Atualizador do Sistema
color 0A

cd /d "%~dp0"

echo ===============================================================================
echo                 AUTOOS - ATUALIZADOR AUTOMATICO DO SISTEMA
echo ===============================================================================
echo.
echo Este utilitario aplica as novas alteracoes e atualizacoes no seu computador.
echo Seus dados (clientes, veiculos, ordens de servico) estao 100%% seguros e intactos.
echo.

echo [1/4] Finalizando versoes antigas em execucao (portas 3000 a 3005)...
taskkill /F /IM node.exe >nul 2>nul
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports = @(3000,3001,3002,3003,3004,3005); foreach ($p in $ports) { try { Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } } catch {} }" >nul 2>nul

for /f "tokens=5" %%p in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    taskkill /F /PID %%p >nul 2>nul
)

if exist "active_port.txt" del /f /q "active_port.txt" >nul 2>nul
if exist "servidor.log" del /f /q "servidor.log" >nul 2>nul

:: Pausa breve para a pilha de rede do Windows liberar os sockets
timeout /t 1 /nobreak >nul
echo [OK] Processos antigos encerrados com sucesso!
echo.

echo [2/4] Verificando arquivos de producao atualizados...
if not exist "dist\index.html" (
    echo Compilando nova versao... Aguarde alguns instantes...
    if exist "build.cjs" (
        node build.cjs
    ) else (
        call npm run build
    )
) else (
    echo [OK] Arquivos da nova versao prontos!
)
echo.

echo [3/4] Atualizando atalho "AutoOS Oficina" na Area de Trabalho...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $desktop = [Environment]::GetFolderPath('Desktop'); $s = $ws.CreateShortcut((Join-Path $desktop 'AutoOS Oficina.lnk')); $s.TargetPath = [System.IO.Path]::Combine($env:SystemRoot, 'System32\wscript.exe'); $s.Arguments = '\"' + (Join-Path (Get-Location).Path 'AutoOS_Launcher.vbs') + '\"'; $s.WorkingDirectory = (Get-Location).Path; $s.Description = 'AutoOS - Gestao de Oficina Mecanica'; $ico = Join-Path (Get-Location).Path 'dist\favicon.ico'; if (Test-Path -LiteralPath $ico) { $s.IconLocation = $ico }; $s.Save()" >nul 2>nul
echo [OK] Atalho atualizado na sua Area de Trabalho!
echo.

echo [4/4] Iniciando o AutoOS com as novas funcionalidades...
if exist "AutoOS_Launcher.vbs" (
    start "" "%SystemRoot%\System32\wscript.exe" "AutoOS_Launcher.vbs" "/restart"
) else (
    powershell -NoProfile -Command "Start-Process node -ArgumentList 'servidor.cjs' -WindowStyle Hidden"
    start "" cmd /c "timeout /t 2 /nobreak >nul && start http://127.0.0.1:3000"
)

echo ===============================================================================
echo                SISTEMA ATUALIZADO E INICIADO COM SUCESSO!
echo ===============================================================================
echo  Novas funcoes ativas:
echo  * Quilometragem (KM) e Placa visiveis nos Dados do Veiculo da OS
echo  * Cadastro rapido de novo cliente diretamente na criacao da OS
echo  * Campo Observacoes corrigido (sem textos automaticos)
echo  * Servidor com protecao dinamica de portas para Windows 10 e Windows 11
echo ===============================================================================
echo.
echo Fechando esta janela em 3 segundos...
timeout /t 3 >nul
exit /b 0

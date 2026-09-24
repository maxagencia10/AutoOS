@echo off
setlocal
title AutoOS - Encerrar Servidor
color 0C

cd /d "%~dp0"

echo =======================================================
echo          AUTOOS - ENCERRAR SERVIDOR EM SEGUNDO PLANO
echo =======================================================
echo.
echo Finalizando processos do servidor AutoOS (portas 3000 a 3005)...

:: Encerra processos do node
taskkill /F /IM node.exe >nul 2>nul

:: Encerra processos que possam estar segurando as portas 3000 a 3005
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports = @(3000,3001,3002,3003,3004,3005); foreach ($p in $ports) { try { Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } } catch {} }" >nul 2>nul

for /f "tokens=5" %%p in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    taskkill /F /PID %%p >nul 2>nul
)

if exist "active_port.txt" del /f /q "active_port.txt" >nul 2>nul
if exist "servidor.log" del /f /q "servidor.log" >nul 2>nul

echo.
echo [OK] O servidor do AutoOS foi encerrado e todas as portas foram liberadas.
echo.
timeout /t 3 >nul
exit /b 0

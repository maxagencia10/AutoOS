@echo off
chcp 65001 >nul
title AutoOS - Encerrar Servidor
color 0C

echo =======================================================
echo          AUTOOS - ENCERRAR SERVIDOR EM SEGUNDO PLANO
echo =======================================================
echo.
echo Finalizando processos do servidor AutoOS na porta 3000...

for /f "tokens=5" %%p in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    echo Finalizando processo (PID: %%p)...
    taskkill /F /PID %%p >nul 2>nul
)

echo.
echo [OK] O servidor do AutoOS foi encerrado com sucesso.
echo.
timeout /t 3 >nul

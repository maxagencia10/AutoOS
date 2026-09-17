@echo off
chcp 65001 >nul
title AutoOS - Destravar e Iniciar Sistema
color 0A

echo ===============================================================================
echo                 AUTOOS - UTILITARIO DE DESTRAVAMENTO RAPIDO
echo ===============================================================================
echo.
echo Este script vai:
echo 1. Encerrar processos antigos do Node.js ou portas presas (porta 3000).
echo 2. Garantir que a versao leve e otimizada (dist) esta pronta.
echo 3. Iniciar o AutoOS sem travamento em computadores antigos e novos.
echo.

echo [1/3] Finalizando processos e liberando a porta 3000...
for /f "tokens=5" %%p in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    echo Finalizando processo preso (PID: %%p)...
    taskkill /F /PID %%p >nul 2>nul
)
taskkill /F /IM node.exe >nul 2>nul
echo [OK] Porta 3000 liberada com sucesso!
echo.

echo [2/3] Verificando pacote de producao otimizado...
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
    echo [OK] Versao otimizada pronta para uso imediato!
)
echo.

echo [3/3] Iniciando o servidor em segundo plano (processo oculto)...
echo.

if exist "AutoOS_Launcher.vbs" (
    start "" "%SystemRoot%\System32\wscript.exe" "AutoOS_Launcher.vbs"
) else (
    powershell -NoProfile -Command "Start-Process node -ArgumentList 'servidor.cjs' -WindowStyle Hidden"
    start "" cmd /c "timeout /t 2 /nobreak >nul && start http://127.0.0.1:3000"
)

echo ===============================================================================
echo  [OK] AutoOS destravado e iniciado com sucesso!
echo  O servidor esta ativo em segundo plano (processo oculto).
echo  Nenhuma janela de comando precisa ficar aberta para o cliente.
echo ===============================================================================
echo.
echo Fechando esta janela em 3 segundos...
timeout /t 3 >nul
exit /b 0

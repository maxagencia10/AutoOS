@echo off
chcp 65001 >nul
title AutoOS - Gerador do Pacote de Producao (dist)
color 0B

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo ===============================================================================
echo                AUTOOS - GERADOR AUTOMATICO DA PASTA 'DIST'
echo ===============================================================================
echo.
echo Este utilitario ira compilar todos os arquivos do AutoOS para criar
echo a pasta "dist" otimizada que o sistema precisa para rodar.
echo.

:: 1. Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    if exist "%ProgramFiles%\nodejs\node.exe" (
        set "PATH=%ProgramFiles%\nodejs;%PATH%"
    ) else if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
        set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
    ) else (
        echo [ERRO] O Node.js nao foi encontrado no sistema.
        echo Instale o Node.js oficial gratuito em https://nodejs.org e tente novamente.
        echo.
        pause
        exit /b 1
    )
)

echo [1/3] Node.js detectado com sucesso!
echo.

:: 2. Instalar dependencias se a pasta node_modules nao existir
if not exist "node_modules\vite" (
    echo [2/3] Instalando dependencias do projeto (necessario na primeira vez)...
    echo Isso pode levar de 1 a 2 minutos dependendo da sua conexao. Aguarde...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [AVISO] Ocorreu uma oscilacao no npm install. Tentando novamente com force...
        call npm install --force
    )
) else (
    echo [2/3] Dependencias ja instaladas!
)

echo.
echo [3/3] Compilando arquivos otimizados para a pasta 'dist'...
call npm run build

if exist "dist\index.html" (
    echo.
    echo ===============================================================================
    echo  [SUCESSO] PASTA 'DIST' GERADA COM SUCESSO!
    echo ===============================================================================
    echo  O AutoOS agora esta 100%% pronto para rodar.
    echo  Iniciando o sistema em 3 segundos...
    echo ===============================================================================
    timeout /t 3 >nul
    if exist "%SCRIPT_DIR%AutoOS_Launcher.vbs" (
        start "" "%SystemRoot%\System32\wscript.exe" "%SCRIPT_DIR%AutoOS_Launcher.vbs"
    ) else (
        start "" http://127.0.0.1:3000
        node servidor.cjs
    )
    exit /b 0
) else (
    echo.
    echo [ERRO] Falha ao compilar a pasta 'dist'.
    echo Verifique se ha mensagens de erro acima.
    echo.
    pause
    exit /b 1
)

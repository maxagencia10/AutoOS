@echo off
chcp 65001 >nul
title AutoOS - Inicializador Automatico
color 0C

echo =======================================================
echo         AUTOOS - SISTEMA DE ORDEM DE SERVICO
echo =======================================================
echo.

:: 1. Verifica se o Node.js esta instalado
echo [1/3] Verificando instalacao do Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] O Node.js nao foi detectado no seu computador!
    echo.
    echo Por favor, baixe e instale o Node.js antes de continuar:
    echo Acesse: https://nodejs.org/ (Recomendado: versao LTS)
    echo.
    echo Pressione qualquer tecla para abrir o site de download...
    pause >nul
    start https://nodejs.org/
    exit /b 1
)

echo [OK] Node.js detectado com sucesso!
echo.

:: 2. Verifica se a pasta node_modules existe, senao instala
if not exist "node_modules\" (
    echo [2/3] Instalando dependencias do sistema pela primeira vez...
    echo Isso pode levar de 1 a 2 minutos, por favor aguarde...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERRO] Falha ao instalar dependencias com o npm install.
        pause
        exit /b 1
    )
    echo.
    echo [OK] Todas as dependencias foram instaladas com sucesso!
) else (
    echo [2/3] Dependencias ja instaladas.
)

echo.
echo [3/3] Iniciando o servidor do AutoOS...
echo.
echo =======================================================
echo O sistema estara acessivel em: http://localhost:3000
echo Mantenha esta janela aberta enquanto estiver usando o sistema.
echo Para encerrar, feche esta janela ou pressione CTRL + C.
echo =======================================================
echo.

:: Aguarda 2 segundos e abre o navegador automaticamente
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

:: Inicia a aplicacao
call npm run dev

pause

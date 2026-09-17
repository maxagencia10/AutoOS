@echo off
chcp 65001 >nul
title AutoOS - Inicializador
color 0C

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: Inicia o AutoOS em segundo plano sem manter janelas pretas abertas
start "" wscript.exe "%SCRIPT_DIR%AutoOS_Launcher.vbs"

exit /b 0

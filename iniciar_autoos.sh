#!/usr/bin/env bash

clear
echo "======================================================="
echo "        AUTOOS - SISTEMA DE ORDEM DE SERVICO"
echo "======================================================="
echo ""

# 1. Verifica se o Node.js esta instalado
echo "[1/3] Verificando instalacao do Node.js..."
if ! command -v node &> /dev/null; then
    echo ""
    echo "[ERRO] O Node.js nao foi detectado no sistema."
    echo "Instale o Node.js v18+ em: https://nodejs.org/"
    echo ""
    exit 1
fi

echo "[OK] Node.js detectado: $(node -v)"
echo ""

# 2. Instala dependências caso necessário
if [ ! -d "node_modules" ]; then
    echo "[2/3] Instalando dependencias pela primeira vez..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERRO] Falha ao instalar dependencias."
        exit 1
    fi
    echo "[OK] Dependencias instaladas!"
else
    echo "[2/3] Dependencias ja instaladas."
fi

echo ""
echo "[3/3] Iniciando o servidor AutoOS..."
echo ""
echo "======================================================="
echo "Acesse o sistema em: http://localhost:3000"
echo "Pressione CTRL + C para parar o servidor."
echo "======================================================="
echo ""

# Tenta abrir o navegador padrao
if command -v xdg-open &> /dev/null; then
    (sleep 2 && xdg-open "http://localhost:3000") &
elif command -v open &> /dev/null; then
    (sleep 2 && open "http://localhost:3000") &
fi

npm run dev

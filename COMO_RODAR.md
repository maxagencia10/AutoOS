# Instruções de Instalação e Execução - AutoOS

O **AutoOS** foi projetado para ser executado de forma imediata e simples, com inicializadores automáticos para Windows, Linux e macOS.

---

## ⚡ Como Instalar e Rodar com 1 Clique no Windows

Copie a pasta descompactada para o computador do cliente (ex: `C:\AutoOS`) ou mantenha no pen drive e dê **dois cliques** em:

👉 **`INSTALAR_AUTOOS.bat`** (Na primeira vez que for instalar no cliente)
- Verifica o Node.js (se não tiver, baixa o instalador oficial automaticamente).
- Instala todas as dependências com 1 clique (`npm install`).
- **Cria automaticamente o atalho "AutoOS Oficina" na Área de Trabalho** do cliente.
- **Inicia o servidor em segundo plano (processo invisível)** e fecha a janela de instalação automaticamente, sem poluir a tela do cliente.
- Abre o AutoOS em janela de aplicativo própria em `http://localhost:3000`.

👉 **`ATUALIZAR_AUTOOS.bat`** (Para atualizar um sistema já instalado sem perder dados)
- Encerra versões anteriores que estavam rodando em segundo plano na memória.
- Atualiza os arquivos compilados da nova versão.
- Atualiza o atalho da Área de Trabalho.
- Inicia o sistema com todas as novas funções carregadas imediatamente.
- **Mantém intactos 100% dos seus clientes, veículos e ordens de serviço!**

👉 **`INICIAR_AUTOOS.bat`** (No dia a dia)
- Inicia o sistema rapidamente em segundo plano e abre a janela do aplicativo (sem janela preta de comando).

👉 **`FINALIZAR_AUTOOS.bat`**
- Encerra o processo do servidor em segundo plano quando desejar fechar completamente.


---

## 🐧 Como Rodar no Linux ou macOS

1. Abra o terminal na pasta do sistema.
2. Dê permissão de execução (se necessário) e execute:
   ```bash
   chmod +x iniciar_autoos.sh
   ./iniciar_autoos.sh
   ```

---

## 💻 Como Rodar Manualmente via Terminal

Se preferir utilizar a linha de comando tradicional:

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar em modo de desenvolvimento
npm run dev
```
Acesse no seu navegador: **`http://localhost:3000`**

---

## 🔒 Banco de Dados e Segurança
- O sistema já vem com o motor **PGlite (PostgreSQL compilado em WebAssembly)** embutido.
- **Não** requer instalação de PostgreSQL ou servidor de banco de dados externo.
- Para salvar cópias dos seus dados, acesse a aba **"Backup e Banco"** no sistema e exporte seu arquivo `.json` ou dump `.sql`.

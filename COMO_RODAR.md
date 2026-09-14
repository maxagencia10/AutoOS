# Instruções de Instalação e Execução - AutoOS

O **AutoOS** foi projetado para ser executado de forma imediata e simples, com inicializadores automáticos para Windows, Linux e macOS.

---

## ⚡ Como Instalar e Rodar com 1 Clique no Windows

Copie a pasta descompactada para o computador do cliente (ex: `C:\AutoOS`) ou mantenha no pen drive e dê **dois cliques** em:

👉 **`INSTALAR_AUTOOS.bat`** (Na primeira vez que for instalar no cliente)
- Verifica o Node.js (se não tiver, baixa o instalador oficial automaticamente).
- Instala todas as dependências com 1 clique (`npm install`).
- **Cria automaticamente o atalho "AutoOS Oficina" na Área de Trabalho** do cliente.
- Abre o navegador automaticamente em `http://localhost:3000`.

👉 **`INICIAR_AUTOOS.bat`** (No dia a dia)
- Inicia o sistema rapidamente e abre o navegador.


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

# Como Publicar e Hospedar o AutoOS Gratuitamente

O **AutoOS** foi projetado para funcionar de forma **100% autônoma** no navegador do cliente através do **PostgreSQL WebAssembly (PGlite)** e **IndexedDB**. Isso significa que todo o banco de dados, relatórios, cadastros de clientes, veículos, orçamentos e impressão A4 rodam diretamente na web, sem necessidade de pagar por servidores caros de banco de dados.

Abaixo estão as **4 melhores formas gratuitas** para colocar o sistema no ar com seu próprio link:

---

## Opção 1: Vercel (Mais Recomendada - Instantânea e Grátis)
A Vercel oferece hospedagem global ultrarrápida com certificado SSL (HTTPS) gratuito para sempre.

### Passo a Passo:
1. Acesse [vercel.com](https://vercel.com) e crie uma conta gratuita (ou faça login com seu GitHub).
2. Se o seu projeto estiver no GitHub:
   - Clique em **"Add New..."** > **"Project"**.
   - Selecione o repositório do **AutoOS**.
   - O Vercel já detectará automaticamente as configurações através do arquivo `vercel.json` que preparamos.
   - Clique em **"Deploy"**.
3. Em menos de 1 minuto, seu sistema estará no ar em um link gratuito (ex: `autoos-oficina.vercel.app`).
4. **⚠️ OBRIGATÓRIO (Para não pedir login da Vercel para seus clientes):**
   - Acesse seu painel da Vercel em [vercel.com/dashboard](https://vercel.com/dashboard).
   - Clique no projeto do **AutoOS**.
   - No menu superior, clique em **Settings** > e no menu à esquerda clique em **Deployment Protection**.
   - Em **Vercel Authentication**, marque como **Disabled (Desativado)**.
   - Clique em **Save**.
   *(Isso garante que qualquer pessoa que receber o link pelo WhatsApp abra o sistema diretamente sem que a Vercel exija conta ou login).*
5. **Domínio próprio (opcional):** Se tiver um domínio (ex: `oficinadoze.com.br`), você pode conectá-lo gratuitamente na aba *Settings > Domains*.

---

## Opção 2: Netlify Drop (O Mais Fácil - Sem Precisar de GitHub)
Se você não quiser usar GitHub ou linha de comando, você pode publicar apenas **arrastando uma pasta** no navegador!

### Passo a Passo:
1. No seu terminal ou projeto, execute:
   ```bash
   npm run build
   ```
   *(Isso criará a pasta `dist` com todos os arquivos prontos e otimizados).*
2. Acesse [app.netlify.com/drop](https://app.netlify.com/drop) e faça login gratuito.
3. Arraste e solte a pasta **`dist`** diretamente na área indicada da página.
4. Pronto! O Netlify criará seu link na hora (ex: `autoos-mecanica.netlify.app`).

---

## Opção 3: Cloudflare Pages (Grátis com Tráfego Ilimitado)
Excelente para quem deseja estabilidade máxima com CDN global da Cloudflare.

1. Acesse [pages.cloudflare.com](https://pages.cloudflare.com).
2. Conecte sua conta do GitHub.
3. Configure:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Clique em **"Save and Deploy"**.

---

## Opção 4: GitHub Pages
1. No seu repositório no GitHub, vá em **Settings** > **Pages**.
2. Em **Source**, selecione **GitHub Actions**.
3. Use o template padrão de Vite/Static HTML para publicar automaticamente a cada commit.

---

### Resumo dos Arquivos de Configuração Já Inclusos no Projeto:
- `vercel.json`: Regras de rota SPA e build automatizado para Vercel.
- `netlify.toml`: Redirecionamento SPA e build para Netlify.
- `public/_redirects`: Suporte nativo a Single Page Apps em qualquer host estático.

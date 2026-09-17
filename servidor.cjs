// Servidor HTTP local de alta performance e ultraleve para o AutoOS
// Feito com módulos nativos do Node.js (sem dependências externas)
// Consome menos de 20MB de memória RAM, ideal para computadores antigos e novos.

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const HOST = '0.0.0.0';
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.data': 'application/octet-stream',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8'
};

// Verifica se a pasta dist existe
if (!fs.existsSync(DIST_DIR) || !fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  console.error('[AutoOS] ERRO: Pasta "dist" nao encontrada!');
  console.log('[AutoOS] Execute "npm run build" antes de iniciar este servidor.');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  // CORS e headers de seguranca
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parse da URL
  let reqUrl = req.url.split('?')[0];
  let safePath = path.normalize(decodeURIComponent(reqUrl)).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(DIST_DIR, safePath);

  // Se o caminho solicitado for diretorio ou raiz, serve index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // Se o arquivo especifico nao existe (ex: rotas SPA como /configuracoes), faz fallback para index.html
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Erro interno ao ler arquivo: ' + err.message);
      return;
    }

    // Cache longo para assets estáticos com hash, sem cache para index.html
    if (filePath.includes(path.join('dist', 'assets'))) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[AutoOS] ATENCAO: A porta ${PORT} ja esta sendo usada por outro processo!`);
    console.log('[AutoOS] Fechando processos antigos e tentando novamente...');
  } else {
    console.error('[AutoOS] Erro no servidor:', err.message);
  }
});

server.listen(PORT, HOST, () => {
  console.log('\n===================================================================');
  console.log('               AUTOOS - SERVIDOR LOCAL EM EXECUCAO                 ');
  console.log('===================================================================');
  console.log(` Status:    [OK] Ativo e pronto para uso`);
  console.log(` Endereco:  http://127.0.0.1:${PORT}`);
  console.log(` Alternativo: http://localhost:${PORT}`);
  console.log(' Memoria:   Modo otimizado (baixo consumo de CPU e RAM)');
  console.log('===================================================================\n');
  console.log('Voce ja pode usar o sistema no seu navegador.');
  console.log('Mantenha esta janela aberta enquanto a oficina estiver utilizando o AutoOS.\n');
});

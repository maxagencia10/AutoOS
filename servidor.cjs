// Servidor HTTP local de alta performance, ultra-resiliente e leve para o AutoOS
// Desenvolvido para Windows 10, Windows 11 e Linux.
// Inclui fallback inteligente de portas para contornar bloqueios e portas presas no Windows 11.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const DIST_DIR = path.join(__dirname, 'dist');
const PORT_FILE = path.join(__dirname, 'active_port.txt');
const LOG_FILE = path.join(__dirname, 'servidor.log');
const PDFS_DIR = path.join(__dirname, 'PDFs_Ordens_de_Servico');

// Assegura que a pasta exclusiva para os PDFs das Ordens de Serviço exista
try {
  if (!fs.existsSync(PDFS_DIR)) {
    fs.mkdirSync(PDFS_DIR, { recursive: true });
    console.log('[AutoOS] Pasta exclusiva criada para os PDFs das OS:', PDFS_DIR);
  }
} catch (e) {
  console.warn('[AutoOS] Aviso ao inicializar pasta de PDFs:', e.message);
}

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;
const PORTS_TO_TRY = [DEFAULT_PORT, 3001, 3002, 3003, 3004, 3005];

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

// Verifica se a pasta dist essencial existe
if (!fs.existsSync(DIST_DIR) || !fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  console.error('[AutoOS] ERRO: Pasta "dist" nao encontrada!');
  console.log('[AutoOS] Execute "npm run build" antes de iniciar este servidor.');
  process.exit(1);
}

let activeServer = null;
let currentPort = DEFAULT_PORT;
let currentHost = '0.0.0.0';

function requestHttp(url, method = 'GET', timeoutMs = 800) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method, timeout: timeoutMs }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.end();
  });
}

function handleRequest(req, res) {
  // CORS e headers de segurança para WebAssembly / PGlite
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, HEAD, OPTIONS');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = req.url.split('?')[0];

  // Endpoint de status e diagnóstico do AutoOS
  if (reqUrl === '/api/info') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      app: 'autoos',
      dir: path.resolve(__dirname),
      pid: process.pid,
      port: currentPort,
      host: currentHost,
      version: '1.1.0'
    }));
    return;
  }

  // Endpoint para encerramento gracioso do servidor
  if (reqUrl === '/api/shutdown') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, message: 'Servidor encerrando com sucesso...' }));
    setTimeout(() => {
      try {
        if (activeServer) activeServer.close();
      } catch (e) {}
      try {
        if (fs.existsSync(PORT_FILE)) fs.unlinkSync(PORT_FILE);
      } catch (e) {}
      process.exit(0);
    }, 150);
    return;
  }

  if (reqUrl === '/api/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, port: currentPort }));
    return;
  }

  // Endpoint para salvar PDF diretamente na pasta exclusiva do sistema
  if (reqUrl === '/api/salvar-pdf' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { filename, base64 } = payload;
        if (!filename || !base64) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: 'Filename ou base64 ausente' }));
          return;
        }

        if (!fs.existsSync(PDFS_DIR)) {
          fs.mkdirSync(PDFS_DIR, { recursive: true });
        }

        const safeFilename = path.basename(filename).replace(/[^a-zA-Z0-9_\-\.]/g, '_');
        const targetFile = path.join(PDFS_DIR, safeFilename);
        const buffer = Buffer.from(base64, 'base64');
        fs.writeFileSync(targetFile, buffer);

        console.log(`[AutoOS] PDF da OS gravado na pasta exclusiva: ${targetFile} (${buffer.length} bytes)`);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          ok: true,
          filename: safeFilename,
          folder: PDFS_DIR,
          fullPath: targetFile,
          size: buffer.length,
          folderName: 'PDFs_Ordens_de_Servico'
        }));
      } catch (err) {
        console.error('[AutoOS] Erro ao salvar PDF:', err);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // Endpoint para abrir a pasta de PDFs diretamente no explorador do Windows
  if (reqUrl === '/api/abrir-pasta-pdf') {
    try {
      if (!fs.existsSync(PDFS_DIR)) {
        fs.mkdirSync(PDFS_DIR, { recursive: true });
      }

      if (process.platform === 'win32') {
        exec(`explorer.exe "${PDFS_DIR}"`);
      } else if (process.platform === 'darwin') {
        exec(`open "${PDFS_DIR}"`);
      } else {
        exec(`xdg-open "${PDFS_DIR}"`);
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, folder: PDFS_DIR, message: 'Pasta aberta no explorador de arquivos' }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // Endpoint para informações da pasta de PDFs
  if (reqUrl === '/api/pasta-pdf-info') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      ok: true,
      folder: PDFS_DIR,
      exists: fs.existsSync(PDFS_DIR),
      folderName: 'PDFs_Ordens_de_Servico'
    }));
    return;
  }

  // Servir arquivos de PDFs gerados diretamente
  if (reqUrl.startsWith('/api/pdf/')) {
    const rawName = decodeURIComponent(reqUrl.replace('/api/pdf/', ''));
    const safeName = path.basename(rawName);
    const pdfPath = path.join(PDFS_DIR, safeName);
    if (fs.existsSync(pdfPath) && fs.statSync(pdfPath).isFile()) {
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${safeName}"`,
        'Cache-Control': 'no-cache'
      });
      fs.createReadStream(pdfPath).pipe(res);
      return;
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'PDF não encontrado' }));
      return;
    }
  }

  let safePath = path.normalize(decodeURIComponent(reqUrl)).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(DIST_DIR, safePath);

  // Se o caminho solicitado for diretório ou raiz, serve index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // Se o arquivo específico não existe (rotas SPA como /configuracoes), faz fallback para index.html
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

    // Cache longo para assets versionados com hash, sem cache para index.html
    if (filePath.includes(path.join('dist', 'assets'))) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

function openBrowser(port) {
  if (process.env.AUTO_OPEN === 'false') return;
  const targetUrl = `http://127.0.0.1:${port}`;
  if (process.platform === 'win32') {
    exec(`start msedge --app="${targetUrl}"`, (err) => {
      if (err) {
        exec(`start "" "${targetUrl}"`);
      }
    });
  } else if (process.platform === 'darwin') {
    exec(`open "${targetUrl}"`);
  } else {
    exec(`xdg-open "${targetUrl}"`);
  }
}

function bindServer(port, host) {
  return new Promise((resolve, reject) => {
    const srv = http.createServer(handleRequest);
    let resolved = false;

    srv.once('error', (err) => {
      if (!resolved) {
        resolved = true;
        reject(err);
      }
    });

    srv.listen(port, host, () => {
      if (!resolved) {
        resolved = true;
        resolve(srv);
      }
    });
  });
}

async function startServerWithSmartFailover() {
  const currentDir = path.resolve(__dirname).toLowerCase();

  for (let i = 0; i < PORTS_TO_TRY.length; i++) {
    const port = PORTS_TO_TRY[i];

    // 1. Antes de tentar abrir o socket, verifica se já existe uma instância do AutoOS respondendo nessa porta
    try {
      const probe = await requestHttp(`http://127.0.0.1:${port}/api/info`, 'GET', 600);
      if (probe.statusCode === 200) {
        const info = JSON.parse(probe.data);
        if (info && info.app === 'autoos') {
          const serverDir = path.resolve(info.dir || '').toLowerCase();
          if (serverDir === currentDir) {
            console.log(`[AutoOS] O servidor ja esta em execucao nesta pasta na porta ${port}.`);
            fs.writeFileSync(PORT_FILE, String(port), 'utf8');
            process.exit(0);
          } else {
            console.log(`[AutoOS] Instancia antiga detectada na porta ${port} rodando de outra pasta. Solicitando finalizacao...`);
            await requestHttp(`http://127.0.0.1:${port}/api/shutdown`, 'GET', 600).catch(() => {});
            // Aguarda 400ms para a porta ser liberada
            await new Promise((r) => setTimeout(r, 400));
          }
        }
      }
    } catch (e) {
      // Porta livre ou não responde HTTP
    }

    // 2. Tenta escutar em 0.0.0.0 (rede local) e depois em 127.0.0.1 (loopback seguro Windows 11)
    const hostsToTry = ['0.0.0.0', '127.0.0.1'];

    for (const host of hostsToTry) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const srv = await bindServer(port, host);
          activeServer = srv;
          currentPort = port;
          currentHost = host;

          // Grava a porta ativa para que o Launcher e atalhos saibam exatamente onde abrir
          try {
            fs.writeFileSync(PORT_FILE, String(port), 'utf8');
          } catch (e) {}

          console.log('\n===================================================================');
          console.log('               AUTOOS - SERVIDOR LOCAL EM EXECUCAO                 ');
          console.log('===================================================================');
          console.log(` Status:      [OK] Ativo e pronto para uso`);
          console.log(` Endereco:    http://127.0.0.1:${port}`);
          console.log(` Alternativo: http://localhost:${port}`);
          if (port !== DEFAULT_PORT) {
            console.log(` Observacao:  Porta ${DEFAULT_PORT} estava ocupada/reservada no Windows.`);
            console.log(`              O AutoOS ativou a porta alternativa ${port} automaticamente!`);
          }
          console.log(` Host:        ${host}`);
          console.log(` Processo:    PID ${process.pid}`);
          console.log(' Memoria:     Modo otimizado (baixo consumo de CPU e RAM)');
          console.log('===================================================================\n');
          console.log('Voce ja pode usar o sistema no seu computador.');
          console.log('Mantenha esta janela aberta enquanto a oficina estiver utilizando o AutoOS.\n');

          openBrowser(port);
          return;
        } catch (bindErr) {
          if (bindErr.code === 'EADDRINUSE' || bindErr.code === 'EACCES') {
            // Se for tentativa 1, aguarda 400ms para sockets em TIME_WAIT do Windows liberarem
            if (attempt === 1) {
              await new Promise((r) => setTimeout(r, 400));
            }
          }
        }
      }
    }
  }

  // Se todas as portas falharem
  console.error('[AutoOS] Nao foi possivel iniciar nas portas padrao (3000 a 3005).');
  console.error('[AutoOS] Execute CORRIGIR_TRAVAMENTO.bat para liberar os recursos do Windows.');
  process.exit(1);
}

// Tratamento de encerramento limpo para liberar portas imediatamente no Windows
function cleanup() {
  try {
    if (fs.existsSync(PORT_FILE)) fs.unlinkSync(PORT_FILE);
  } catch (e) {}
  if (activeServer) {
    activeServer.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 500);
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

startServerWithSmartFailover().catch((err) => {
  console.error('[AutoOS] Erro fatal:', err);
  process.exit(1);
});

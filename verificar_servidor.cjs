// Utilitário de Health Check para sincronização perfeita de inicialização do AutoOS
// Aguarda o servidor responder HTTP 200 antes de liberar a abertura da janela

const http = require('http');

const URL = 'http://127.0.0.1:3000/';
const MAX_ATTEMPTS = 60; // 60 tentativas * 300ms = 18 segundos de limite
let attempts = 0;

function checkServer() {
  attempts++;
  const req = http.get(URL, (res) => {
    if (res.statusCode >= 200 && res.statusCode < 400) {
      // Servidor 100% pronto!
      process.exit(0);
    } else {
      retry();
    }
  });

  req.on('error', () => {
    retry();
  });

  req.setTimeout(1000, () => {
    req.destroy();
    retry();
  });
}

function retry() {
  if (attempts >= MAX_ATTEMPTS) {
    console.error('Timeout ao aguardar inicialização do servidor.');
    process.exit(1);
  }
  setTimeout(checkServer, 300);
}

checkServer();

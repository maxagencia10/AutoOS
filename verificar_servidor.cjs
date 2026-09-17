// Utilitário de Health Check instantâneo para verificação de status do AutoOS
// Faz uma sondagem rápida (timeout curto) e retorna 0 se ativo, ou 1 se inativo.

const http = require('http');

const PORT = process.env.PORT || 3000;
const URL = `http://127.0.0.1:${PORT}/`;

const req = http.get(URL, (res) => {
  if (res.statusCode >= 200 && res.statusCode < 500) {
    // Servidor respondeu (200, 304, etc)
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.setTimeout(600, () => {
  req.destroy();
  process.exit(1);
});


// Utilitário de verificação do AutoOS
// Retorna:
// 0: Servidor ativo e rodando a partir DESTA MESMA pasta
// 1: Servidor inativo / porta livre
// 2: Servidor ativo, mas é uma versão antiga ou está rodando de OUTRA pasta (precisa reiniciar)

const http = require('http');
const path = require('path');

const PORT = process.env.PORT || 3000;
const currentDir = path.resolve(__dirname).toLowerCase();

const req = http.get(`http://127.0.0.1:${PORT}/api/info`, (res) => {
  if (res.statusCode === 200) {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        const serverDir = path.resolve(json.dir || '').toLowerCase();
        if (serverDir === currentDir) {
          // Mesma pasta e versão compatível
          process.exit(0);
        } else {
          // Pasta diferente!
          process.exit(2);
        }
      } catch (e) {
        process.exit(2);
      }
    });
  } else {
    // Se a rota /api/info não existe (404), é o servidor legado antigo rodando
    process.exit(2);
  }
});

req.on('error', () => {
  // Servidor não está respondendo (porta livre)
  process.exit(1);
});

req.setTimeout(800, () => {
  req.destroy();
  process.exit(1);
});



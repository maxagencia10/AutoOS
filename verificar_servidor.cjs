// Utilitário de verificação rápida do AutoOS
// Retorna:
// 0: Servidor ativo e rodando a partir DESTA MESMA pasta
// 1: Servidor inativo / portas livres (pronto para iniciar)
// 2: Servidor de OUTRA pasta rodando (versão antiga detectada)

const http = require('http');
const fs = require('fs');
const path = require('path');

const currentDir = path.resolve(__dirname).toLowerCase();
const PORT_FILE = path.join(__dirname, 'active_port.txt');

function getPortsToCheck() {
  const list = [];
  if (process.argv[2] && !isNaN(parseInt(process.argv[2], 10))) {
    list.push(parseInt(process.argv[2], 10));
  }
  if (fs.existsSync(PORT_FILE)) {
    try {
      const saved = parseInt(fs.readFileSync(PORT_FILE, 'utf8').trim(), 10);
      if (saved && !list.includes(saved)) {
        list.push(saved);
      }
    } catch (e) {}
  }
  if (process.env.PORT && !isNaN(parseInt(process.env.PORT, 10))) {
    const envP = parseInt(process.env.PORT, 10);
    if (!list.includes(envP)) list.push(envP);
  }
  [3000, 3001, 3002, 3003, 3004, 3005].forEach((p) => {
    if (!list.includes(p)) list.push(p);
  });
  return list;
}

function probePort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/info`, { timeout: 450 }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json && json.app === 'autoos') {
            resolve({ status: 'autoos', info: json });
            return;
          }
        } catch (e) {}
        resolve({ status: 'other' });
      });
    });

    req.on('error', () => resolve({ status: 'closed' }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 'timeout' });
    });
  });
}

function shutdownPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/shutdown`, { timeout: 400 }, () => resolve());
    req.on('error', () => resolve());
    req.on('timeout', () => { req.destroy(); resolve(); });
  });
}

async function main() {
  const ports = getPortsToCheck();

  for (const port of ports) {
    const res = await probePort(port);
    if (res.status === 'autoos') {
      const srvDir = path.resolve(res.info.dir || '').toLowerCase();
      if (srvDir === currentDir) {
        // Servidor do AutoOS desta pasta está 100% ativo e saudável
        try {
          fs.writeFileSync(PORT_FILE, String(port), 'utf8');
        } catch (e) {}
        process.exit(0);
      } else {
        // Servidor antigo de outra pasta está ocupando a porta!
        await shutdownPort(port);
        process.exit(2);
      }
    }
  }

  // Nenhum servidor AutoOS respondendo nas portas verificadas
  process.exit(1);
}

main();

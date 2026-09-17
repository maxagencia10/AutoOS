const path = require('path');
const { spawnSync } = require('child_process');

console.log('[AutoOS] Iniciando compilacao dos arquivos com Node.js...');
const vitePath = path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js');

const result = spawnSync(process.execPath, [vitePath, 'build'], {
  stdio: 'inherit',
  cwd: __dirname,
  shell: false
});

if (result.error) {
  console.error('[AutoOS] Erro ao executar Vite:', result.error);
  process.exit(1);
}

process.exit(result.status ?? 0);

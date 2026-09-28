import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { defineConfig } from 'vite';

function autoosPdfServerPlugin() {
  const pdfDir = path.resolve(__dirname, 'PDFs_Ordens_de_Servico');
  const atualizacoesDir = path.resolve(__dirname, 'atualizacoes');
  try {
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }
    if (!fs.existsSync(atualizacoesDir)) {
      fs.mkdirSync(atualizacoesDir, { recursive: true });
    }
  } catch (e) {}

  return {
    name: 'autoos-pdf-server',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const url = req.url ? req.url.split('?')[0] : '';
        if (url === '/api/salvar-pdf' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', () => {
            try {
              const { filename, base64 } = JSON.parse(body);
              if (!filename || !base64) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ ok: false, error: 'Dados incompletos' }));
                return;
              }
              if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
              const safeName = path.basename(filename).replace(/[^a-zA-Z0-9_\-\.]/g, '_');
              const target = path.join(pdfDir, safeName);
              const buffer = Buffer.from(base64, 'base64');
              fs.writeFileSync(target, buffer);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, filename: safeName, folder: pdfDir, fullPath: target, size: buffer.length }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: err.message }));
            }
          });
          return;
        }

        if (url === '/api/abrir-pasta-pdf') {
          try {
            if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
            if (process.platform === 'win32') {
              exec(`explorer.exe "${pdfDir}"`);
            } else if (process.platform === 'darwin') {
              exec(`open "${pdfDir}"`);
            } else {
              exec(`xdg-open "${pdfDir}"`);
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, folder: pdfDir }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: err.message }));
          }
          return;
        }

        if (url === '/api/pasta-pdf-info') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: true, folder: pdfDir, folderName: 'PDFs_Ordens_de_Servico', exists: fs.existsSync(pdfDir) }));
          return;
        }

        if (url === '/api/abrir-pasta-atualizacoes') {
          try {
            if (!fs.existsSync(atualizacoesDir)) fs.mkdirSync(atualizacoesDir, { recursive: true });
            if (process.platform === 'win32') {
              exec(`explorer.exe "${atualizacoesDir}"`);
            } else if (process.platform === 'darwin') {
              exec(`open "${atualizacoesDir}"`);
            } else {
              exec(`xdg-open "${atualizacoesDir}"`);
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, folder: atualizacoesDir }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: err.message }));
          }
          return;
        }

        if (url === '/api/verificar-atualizacoes-locais') {
          try {
            if (!fs.existsSync(atualizacoesDir)) fs.mkdirSync(atualizacoesDir, { recursive: true });
            const files = fs.readdirSync(atualizacoesDir);
            const pacotes: any[] = [];
            for (const item of files) {
              const itemPath = path.join(atualizacoesDir, item);
              const stat = fs.statSync(itemPath);
              if (stat.isFile() && item.endsWith('.json')) {
                try {
                  const data = JSON.parse(fs.readFileSync(itemPath, 'utf8'));
                  if (data.versao) {
                    pacotes.push({ tipo: 'JSON_MANIFEST', arquivo: item, caminho: itemPath, tamanho: stat.size, modificadoEm: stat.mtime, manifest: data });
                  }
                } catch (e) {}
              } else if (stat.isFile() && item.endsWith('.zip')) {
                pacotes.push({ tipo: 'ZIP_PACKAGE', arquivo: item, caminho: itemPath, tamanho: stat.size, modificadoEm: stat.mtime });
              }
            }

            let versaoSistema = '1.2.0';
            const versionFile = path.resolve(__dirname, 'version.json');
            if (fs.existsSync(versionFile)) {
              try {
                const s = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
                if (s.versao) versaoSistema = s.versao;
              } catch (e) {}
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, pasta: atualizacoesDir, versaoAtual: versaoSistema, totalPacotes: pacotes.length, pacotes }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: err.message }));
          }
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), autoosPdfServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    optimizeDeps: {
      exclude: ['@electric-sql/pglite'],
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

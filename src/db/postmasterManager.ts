/**
 * AutoOS - Gerenciador Seguro de postmaster.pid
 * 
 * Regras Obrigatórias da Fase 1:
 * 1. NUNCA remover postmaster.pid se pertencer a um processo ativo no SO.
 * 2. Verificar o estado real do processo via verificação de sinal do SO (process.kill(pid, 0)).
 * 3. Recuperar inicialização de forma segura caso o arquivo seja comprovadamente órfão (ESRCH).
 * 4. Evitar qualquer exclusão indiscriminada que possa causar corrupção por escrita concorrente.
 */

export interface PostmasterCheckResult {
  status: 'none' | 'active_process' | 'stale_cleaned' | 'corrupt_cleaned' | 'browser_environment' | 'error';
  pid?: number;
  message: string;
  dataDir?: string;
}

class PostmasterMutex {
  private queue: Promise<void> = Promise.resolve();

  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    let release: () => void;
    const waitPromise = new Promise<void>((resolve) => {
      release = resolve;
    });
    const currentQueue = this.queue;
    this.queue = currentQueue.then(() => waitPromise, () => waitPromise);
    await currentQueue;
    try {
      return await fn();
    } finally {
      release!();
    }
  }
}

const pidMutex = new PostmasterMutex();

export async function verifyAndRecoverPostmasterPid(dataDir: string): Promise<PostmasterCheckResult> {
  // Se estiver rodando no navegador (IndexedDB), não há sistema de arquivos do SO
  if (typeof window !== 'undefined' || typeof process === 'undefined' || !process.kill) {
    return {
      status: 'browser_environment',
      message: 'Ambiente de navegador detectado. postmaster.pid gerenciado internamente pelo driver de armazenamento.',
      dataDir,
    };
  }

  return await pidMutex.runExclusive(async () => {
    try {
    // Carregamento dinâmico assíncrono nativo do Node.js (compatível com ESM e seguro para bundlers de navegador)
    const fs = await import('node:fs');
    const path = await import('node:path');

    if (!fs.existsSync(dataDir)) {
      return {
        status: 'none',
        message: `Diretório de dados '${dataDir}' não existe ainda. Nenhuma trava pendente.`,
        dataDir,
      };
    }

    const pidFilePath = path.join(dataDir, 'postmaster.pid');
    if (!fs.existsSync(pidFilePath)) {
      return {
        status: 'none',
        message: 'Nenhum arquivo postmaster.pid encontrado. Diretório limpo.',
        dataDir,
      };
    }

    // Lê conteúdo do arquivo postmaster.pid
    const content = fs.readFileSync(pidFilePath, 'utf8');
    const firstLine = content.split('\n')[0]?.trim();
    const pid = parseInt(firstLine || '', 10);

    if (isNaN(pid) || pid <= 0) {
      // Arquivo com formato inválido/corrompido
      const backupPath = path.join(dataDir, `postmaster.pid.corrupt_${Date.now()}`);
      fs.renameSync(pidFilePath, backupPath);
      return {
        status: 'corrupt_cleaned',
        message: `postmaster.pid continha dados inválidos ('${firstLine}'). Arquivo isolado em '${backupPath}' para permitir inicialização limpa.`,
        dataDir,
      };
    }

    // Verifica se o processo associado ao PID está de fato vivo no sistema operacional
    let isProcessAlive = false;
    try {
      // process.kill(pid, 0) não envia sinal destrutivo; apenas testa a existência do processo no SO
      process.kill(pid, 0);
      isProcessAlive = true;
    } catch (err: any) {
      if (err.code === 'EPERM') {
        // Processo existe mas o usuário atual não tem permissão de enviar sinal: ESTÁ VIVO
        isProcessAlive = true;
      } else if (err.code === 'ESRCH') {
        // ESRCH = No such process. O processo NÃO existe mais no SO
        isProcessAlive = false;
      } else {
        // Erro desconhecido: por segurança máxima e prevenção de corrupção, assume que está vivo
        console.warn(`[AutoOS PID Audit] Código de erro inesperado ao checar PID ${pid}:`, err);
        isProcessAlive = true;
      }
    }

    if (isProcessAlive) {
      // REGRA CRÍTICA: NUNCA REMOVA UM PROCESSO ATIVO!
      return {
        status: 'active_process',
        pid,
        message: `ALERTA DE SEGURANÇA: O processo PID ${pid} está ATIVO no sistema operacional. postmaster.pid PRESERVADO para evitar corrupção e concorrência destrutiva.`,
        dataDir,
      };
    }

    // Processo comprovadamente morto (queda de energia, crash anterior, kill forçado)
    // Remoção estritamente segura de arquivo órfão
    fs.unlinkSync(pidFilePath);
    return {
      status: 'stale_cleaned',
      pid,
      message: `RECUPERAÇÃO CONCLUÍDA: Processo anterior PID ${pid} finalizado (ESRCH). postmaster.pid órfão foi removido com segurança para permitir nova inicialização do banco.`,
      dataDir,
    };
    } catch (err: any) {
      return {
        status: 'error',
        message: `Falha na verificação de postmaster.pid: ${err.message || String(err)}`,
        dataDir,
      };
    }
  });
}

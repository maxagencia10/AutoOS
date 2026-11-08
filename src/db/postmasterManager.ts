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
  backupPath?: string;
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

// Hook para testes unitários de sinais de processos (EPERM, ESRCH)
export let _processSignalCheckerForTesting: ((pid: number) => boolean | 'EPERM' | 'ESRCH') | null = null;
export function _setProcessSignalCheckerForTesting(
  fn: ((pid: number) => boolean | 'EPERM' | 'ESRCH') | null
): void {
  _processSignalCheckerForTesting = fn;
}

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
      const firstLine = content.split('\n')[0]?.trim() || '';

      // Validação estrita: exige exclusivamente dígitos numéricos inteiros positivos
      const isPureDigits = /^\d+$/.test(firstLine);
      const pid = isPureDigits ? parseInt(firstLine, 10) : NaN;

      if (!isPureDigits || isNaN(pid) || pid <= 0) {
        // Arquivo vazio, não-numérico, parcialmente numérico (ex: '123abc') ou corrompido
        const backupFilename = `postmaster.pid.corrupt_${Date.now()}`;
        const backupPath = path.join(dataDir, backupFilename);
        fs.renameSync(pidFilePath, backupPath);
        return {
          status: 'corrupt_cleaned',
          backupPath,
          message: `postmaster.pid continha dados inválidos ('${firstLine}'). Arquivo isolado em '${backupPath}' para permitir inicialização limpa.`,
          dataDir,
        };
      }

      // Verifica se o processo associado ao PID está de fato vivo no sistema operacional
      let isProcessAlive = false;

      if (_processSignalCheckerForTesting) {
        const mockResult = _processSignalCheckerForTesting(pid);
        if (mockResult === true || mockResult === 'EPERM') {
          isProcessAlive = true;
        } else if (mockResult === false || mockResult === 'ESRCH') {
          isProcessAlive = false;
        }
      } else {
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

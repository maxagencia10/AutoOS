export interface PacoteLocalDetectado {
  tipo: 'JSON_MANIFEST' | 'ZIP_PACKAGE' | 'PASTA_EXPANDIDA';
  arquivo: string;
  caminho: string;
  tamanho: number;
  modificadoEm: string;
  manifest?: any;
}

export interface RespostaVerificacaoAtualizacao {
  ok: boolean;
  pasta: string;
  versaoAtual: string;
  totalPacotes: number;
  pacotes: PacoteLocalDetectado[];
}

/**
 * Escaneia a pasta 'atualizacoes' do AutoOS
 */
export async function verificarPacotesPastaAtualizacoes(): Promise<RespostaVerificacaoAtualizacao | null> {
  try {
    const res = await fetch('/api/verificar-atualizacoes-locais');
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {}
  return null;
}

/**
 * Abre a pasta 'atualizacoes' no Windows Explorer
 */
export async function abrirPastaAtualizacoesNoWindows(): Promise<boolean> {
  try {
    const res = await fetch('/api/abrir-pasta-atualizacoes', { method: 'POST' });
    return res.ok;
  } catch (e) {
    return false;
  }
}

/**
 * Dispara o script de atualização e compilação do sistema
 */
export async function dispararAtualizacaoSistema(): Promise<boolean> {
  try {
    const res = await fetch('/api/executar-atualizacao-sistema', { method: 'POST' });
    return res.ok;
  } catch (e) {
    return false;
  }
}

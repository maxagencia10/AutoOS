import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Download,
  Upload,
  Database,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileCode,
  ShieldAlert,
  Clock,
  Sparkles,
  X,
} from 'lucide-react';
import {
  BackupRepository,
  OficinaRepository,
  ClienteRepository,
  VeiculoRepository,
  OrdemServicoRepository,
} from '../services/dbRepository';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/formatters';

export const BackupView: React.FC = () => {
  const { zerarParaNovaInstalacao } = useAuth();
  const [stats, setStats] = useState({
    clientes: 0,
    veiculos: 0,
    ordens: 0,
  });
  const [ultimoBackup, setUltimoBackup] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [modalZerarAberto, setModalZerarAberto] = useState(false);
  const [palavraConfirmacao, setPalavraConfirmacao] = useState('');

  useEffect(() => {
    carregarEstatisticas();
    const salvo = localStorage.getItem('autoos_ultimo_backup');
    if (salvo) setUltimoBackup(salvo);
  }, []);

  const carregarEstatisticas = async () => {
    try {
      const [c, v, o] = await Promise.all([
        ClienteRepository.getAll(),
        VeiculoRepository.getAll(),
        OrdemServicoRepository.getAll(),
      ]);
      setStats({
        clientes: c.length,
        veiculos: v.length,
        ordens: o.length,
      });
    } catch (err) {
      console.error('Erro ao carregar stats:', err);
    }
  };

  const handleExportarJSON = async () => {
    setCarregando(true);
    setMensagemSucesso('');
    setMensagemErro('');
    try {
      const jsonString = await BackupRepository.exportBackupJson();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.href = url;
      a.download = `autoos_backup_postgresql_${timestamp}.json`;
      a.click();
      URL.revokeObjectURL(url);

      const agora = new Date().toISOString();
      setUltimoBackup(agora);
      localStorage.setItem('autoos_ultimo_backup', agora);
      setMensagemSucesso('Backup completo em JSON gerado e baixado com sucesso!');
    } catch (err: any) {
      setMensagemErro('Erro ao gerar backup: ' + (err.message || err));
    } finally {
      setCarregando(false);
    }
  };

  const handleExportarSQL = async () => {
    setCarregando(true);
    setMensagemSucesso('');
    setMensagemErro('');
    try {
      const sqlString = await BackupRepository.exportBackupSQL();
      const blob = new Blob([sqlString], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.href = url;
      a.download = `autoos_dump_postgresql_${timestamp}.sql`;
      a.click();
      URL.revokeObjectURL(url);

      const agora = new Date().toISOString();
      setUltimoBackup(agora);
      localStorage.setItem('autoos_ultimo_backup', agora);
      setMensagemSucesso('Dump completo em SQL (.SQL) exportado com sucesso!');
    } catch (err: any) {
      setMensagemErro('Erro ao gerar dump SQL: ' + (err.message || err));
    } finally {
      setCarregando(false);
    }
  };

  const handleImportarArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm(`Deseja restaurar o banco de dados a partir do arquivo "${file.name}"? Os dados atuais serão substituídos pelos do backup.`)) {
      e.target.value = '';
      return;
    }

    setCarregando(true);
    setMensagemSucesso('');
    setMensagemErro('');

    try {
      const texto = await file.text();
      await BackupRepository.restoreBackupJson(texto);
      await carregarEstatisticas();
      setMensagemSucesso('Banco de dados PostgreSQL restaurado com sucesso a partir do arquivo!');
    } catch (err: any) {
      setMensagemErro('Erro na restauração do backup: ' + (err.message || err));
    } finally {
      setCarregando(false);
      e.target.value = '';
    }
  };

  const handleLimparDadosTeste = async () => {
    if (!confirm('Atenção: deseja realmente resetar e limpar todos os dados de teste do banco de dados?')) {
      return;
    }
    setCarregando(true);
    try {
      await BackupRepository.resetarDadosIniciais();
      await carregarEstatisticas();
      setMensagemSucesso('Banco de dados reinicializado com sucesso com dados padrão!');
    } catch (err: any) {
      setMensagemErro('Erro ao resetar dados: ' + (err.message || err));
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Cabeçalho */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 sm:p-5 rounded-xl flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-red-500" />
            <span>Backup e Segurança dos Dados</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Exportação e restauração segura dos dados com armazenamento local protegido.
          </p>
        </div>
      </div>

      {mensagemSucesso && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center gap-2 shadow">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {mensagemErro && (
        <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2 shadow">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{mensagemErro}</span>
        </div>
      )}

      {/* Estatísticas e Status do Banco */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-zinc-400 mb-1">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Banco de Dados</span>
          </div>
          <div className="text-base font-bold text-white">Ativo e Seguro</div>
          <p className="text-[11px] text-emerald-400 mt-1">● Conectado e Operacional</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-zinc-400 mb-1">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>Último Backup</span>
          </div>
          <div className="text-sm font-bold text-white">
            {ultimoBackup ? formatDateTime(ultimoBackup) : 'Nenhum backup recente'}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Recomendado exportar semanalmente</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-zinc-400 mb-1">
            <Database className="w-4 h-4 text-red-400" />
            <span>Registros Atuais</span>
          </div>
          <div className="text-xs text-zinc-300 space-y-0.5">
            <div>Clientes: <strong className="text-white">{stats.clientes}</strong></div>
            <div>Veículos: <strong className="text-white">{stats.veiculos}</strong></div>
            <div>Ordens de Serviço: <strong className="text-white">{stats.ordens}</strong></div>
          </div>
        </div>
      </div>

      {/* Seção de Exportação (Backup Manual - Section 31) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-zinc-800 pb-2">
          <Download className="w-4 h-4 text-red-500" />
          <span>1. Exportar Backup Manual (Download)</span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Gere uma cópia completa de todos os dados do sistema (Oficina, Usuários, Clientes, Veículos, Histórico de Quilometragem e Ordens de Serviço com todos os itens).
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportarJSON}
            disabled={carregando}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-bold rounded-lg shadow-md shadow-red-950 transition border border-red-500 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Backup Estruturado (.JSON)</span>
          </button>

          <button
            onClick={handleExportarSQL}
            disabled={carregando}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition border border-zinc-700 disabled:opacity-50"
          >
            <FileCode className="w-4 h-4 text-zinc-400" />
            <span>Exportar Script SQL (.SQL Dump)</span>
          </button>
        </div>
      </div>

      {/* Seção de Restauração (Section 32) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-zinc-800 pb-2">
          <Upload className="w-4 h-4 text-red-500" />
          <span>2. Restaurar Backup a partir de Arquivo</span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Selecione um arquivo de backup (.json) gerado anteriormente por este sistema para restabelecer todos os cadastros e ordens de serviço.
        </p>

        <div className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl p-6 text-center transition bg-zinc-950/50">
          <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
          <p className="text-xs text-zinc-300 font-semibold mb-1">
            Clique no botão abaixo para selecionar o arquivo de backup
          </p>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg cursor-pointer transition border border-zinc-700 mt-2">
            <span>Selecionar Arquivo .JSON</span>
            <input
              type="file"
              accept=".json"
              disabled={carregando}
              onChange={handleImportarArquivo}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Seção de Manutenção e Zerar Sistema para Nova Instalação */}
      <div className="bg-zinc-900 border border-red-950/50 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-red-400 font-bold text-sm border-b border-zinc-800 pb-2">
          <ShieldAlert className="w-4 h-4" />
          <span>3. Instalação Limpa & Manutenção</span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Para colocar o sistema em produção oficial para a sua oficina, utilize a opção <strong className="text-zinc-200">Zerar Sistema para Nova Instalação</strong>. Todos os dados fictícios de oficina, clientes, veículos e ordens serão apagados, e o Assistente de Instalação será aberto para cadastrar o Administrador e a sua Oficina do zero.
        </p>

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            onClick={() => {
              setPalavraConfirmacao('');
              setModalZerarAberto(true);
            }}
            disabled={carregando}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-lg shadow-red-950 transition border border-red-500 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>Zerar Sistema para Nova Instalação</span>
          </button>

          <button
            onClick={handleLimparDadosTeste}
            disabled={carregando}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium rounded-lg transition border border-zinc-700 disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restaurar Dados Demo Fictícios</span>
          </button>
        </div>
      </div>

      {/* Modal de Confirmação para Zerar Sistema */}
      {modalZerarAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-zinc-900 border border-red-800/80 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-800 flex items-center justify-center text-red-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Zerar e Reiniciar Instalação</h3>
                  <p className="text-xs text-red-400">Ação permanente e irreversível</p>
                </div>
              </div>
              <button
                onClick={() => setModalZerarAberto(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <p>
                Esta ação apagará <strong className="text-red-400">TODOS</strong> os registros existentes no banco de dados (clientes, veículos, ordens de serviço e dados de teste da oficina).
              </p>
              <p>
                Ao confirmar, o sistema retornará imediatamente ao <strong className="text-white">Assistente de Instalação</strong> para que você cadastre seu próprio Administrador e a sua Oficina.
              </p>
              <div className="pt-2">
                <label className="block text-zinc-400 font-medium mb-1.5">
                  Para confirmar, digite <span className="text-red-400 font-mono font-bold">ZERAR</span> abaixo:
                </label>
                <input
                  type="text"
                  placeholder="Digite ZERAR"
                  value={palavraConfirmacao}
                  onChange={(e) => setPalavraConfirmacao(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalZerarAberto(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={palavraConfirmacao.trim().toUpperCase() !== 'ZERAR' || carregando}
                onClick={async () => {
                  setCarregando(true);
                  try {
                    await zerarParaNovaInstalacao();
                    setModalZerarAberto(false);
                  } catch (e: any) {
                    setMensagemErro('Erro ao zerar: ' + (e.message || e));
                  } finally {
                    setCarregando(false);
                  }
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-bold rounded-lg shadow transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {carregando ? 'Zerando...' : 'Confirmar e Iniciar Instalação'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seção de Execução Local e Scripts (Executável de 1 Clique) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-zinc-800 pb-2">
          <HardDrive className="w-4 h-4 text-emerald-400" />
          <span>4. Executável e Instalação Local (1 Clique)</span>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed">
          Para rodar este sistema no seu computador ou na rede da oficina, utilize o arquivo executável incluído na raiz do projeto:
        </p>

        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold font-mono">
            <span>● Windows:</span>
            <code className="text-white bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">INICIAR_AUTOOS.bat</code>
          </div>
          <p className="text-zinc-400 text-[11px] pl-4">
            Basta dar duplo clique. O script verifica o Node.js, baixa as dependências na primeira vez, inicia o servidor e abre o navegador automaticamente em <strong className="text-zinc-200">http://localhost:3000</strong>.
          </p>

          <div className="flex items-center gap-2 text-blue-400 font-semibold font-mono pt-1">
            <span>● Linux / Mac:</span>
            <code className="text-white bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">./iniciar_autoos.sh</code>
          </div>
        </div>
      </div>

    </div>
  );
};

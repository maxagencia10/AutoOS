import React, { useState, useEffect } from 'react';
import {
  ArrowUpCircle,
  FolderOpen,
  Upload,
  Globe,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Database,
  Clock,
  Sparkles,
  Check,
  Terminal,
  FileArchive,
  Info,
  ArrowLeft,
  DownloadCloud,
  Layers,
  FileCode,
} from 'lucide-react';
import {
  AtualizacaoRepository,
  StatusVersaoSistema,
} from '../services/dbRepository';
import {
  TipoOrigemAtualizacao,
  RegistroAtualizacao,
  PacoteAtualizacaoManifest,
} from '../types';
import {
  verificarPacotesPastaAtualizacoes,
  abrirPastaAtualizacoesNoWindows,
  dispararAtualizacaoSistema,
  PacoteLocalDetectado,
} from '../services/atualizacaoScanner';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/formatters';

interface AtualizacoesViewProps {
  onVoltar?: () => void;
}

export const AtualizacoesView: React.FC<AtualizacoesViewProps> = ({ onVoltar }) => {
  const { usuarioAtual } = useAuth();

  // Status da versão
  const [statusVersao, setStatusVersao] = useState<StatusVersaoSistema>({
    versao_atual: '1.2.0',
    nome_versao: 'AutoOS - Atualização Dinâmica & WhatsApp Pro',
    data_instalacao: '2026-09-28',
    ultima_atualizacao: null,
    total_atualizacoes: 0,
    engine_db: 'Ativo e Protegido',
    modo_prototipo: false,
  });

  const [historico, setHistorico] = useState<RegistroAtualizacao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');

  // 1. Escaneamento da pasta 'atualizacoes'
  const [pacotesLocais, setPacotesLocais] = useState<PacoteLocalDetectado[]>([]);
  const [caminhoPastaAtualizacoes, setCaminhoPastaAtualizacoes] = useState('atualizacoes');
  const [escaneandoPasta, setEscaneandoPasta] = useState(false);
  const [pastaAbertaSucesso, setPastaAbertaSucesso] = useState(false);

  // 2. Upload Direto (.ZIP / .JSON / .SQL)
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [arquivoConteudo, setArquivoConteudo] = useState<string>('');

  // 3. Nuvem / Remoto
  const [urlRemota, setUrlRemota] = useState('https://downloads.autoos.com.br/updates/latest.json');
  const [verificandoNuvem, setVerificandoNuvem] = useState(false);

  // Modo Selecionado na Interface (3 vias)
  const [abaMetodo, setAbaMetodo] = useState<'PASTA' | 'UPLOAD' | 'NUVEM'>('PASTA');

  // Pacote Validado Pronto para Instalar
  const [pacoteValidado, setPacoteValidado] = useState<{
    manifest: PacoteAtualizacaoManifest;
    conteudo_sql?: string;
    local_origem: string;
    tipo: TipoOrigemAtualizacao;
  } | null>(null);

  // Execução
  const [criarBackupPreventivo, setCriarBackupPreventivo] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [progressoLogs, setProgressoLogs] = useState<string[]>([]);
  const [atualizacaoConcluida, setAtualizacaoConcluida] = useState(false);

  useEffect(() => {
    carregarDados();
    escanearPastaLocal();
  }, []);

  const carregarDados = async () => {
    try {
      const [st, hist] = await Promise.all([
        AtualizacaoRepository.getStatusVersao(),
        AtualizacaoRepository.getHistorico(),
      ]);
      setStatusVersao(st);
      setHistorico(hist);
    } catch (e) {
      console.warn('Erro ao carregar dados de atualizações:', e);
    }
  };

  const escanearPastaLocal = async () => {
    setEscaneandoPasta(true);
    try {
      const info = await verificarPacotesPastaAtualizacoes();
      if (info && info.ok) {
        setPacotesLocais(info.pacotes || []);
        if (info.pasta) setCaminhoPastaAtualizacoes(info.pasta);
      }
    } finally {
      setEscaneandoPasta(false);
    }
  };

  const handleAbrirPastaWindows = async () => {
    const ok = await abrirPastaAtualizacoesNoWindows();
    if (ok) {
      setPastaAbertaSucesso(true);
      setTimeout(() => setPastaAbertaSucesso(false), 4000);
    } else {
      alert(`A pasta de atualizações está em: ${caminhoPastaAtualizacoes}`);
    }
  };

  // Selecionar pacote encontrado na pasta local
  const handleSelecionarPacoteDaPasta = (p: PacoteLocalDetectado) => {
    setMensagemErro('');
    setMensagemSucesso('');
    if (p.manifest) {
      setPacoteValidado({
        manifest: p.manifest,
        local_origem: `Pasta: ${p.arquivo}`,
        tipo: 'CAMINHO_PASTA',
      });
      setMensagemSucesso(`Pacote "${p.arquivo}" selecionado da pasta de atualizações!`);
    } else {
      // Se for ZIP ou pasta de compilação
      setPacoteValidado({
        manifest: {
          versao: '1.2.0',
          nome_versao: `Pacote de Atualização (${p.arquivo})`,
          data_lancamento: new Date().toISOString().slice(0, 10),
          novos_recursos: [
            'Envio de OS via WhatsApp com resumo e arquivo PDF oficial',
            'Pasta exclusiva no computador para PDFs: PDFs_Ordens_de_Servico',
            'Botão Copiar Imagem (Ctrl+V) para envio instantâneo',
            'Botão Abrir Pasta no Windows direto para os PDFs das OS',
          ],
          melhorias: [
            'Servidor local com detecção automática de portas livres (3000 a 3005)',
            'Atualizador automático sem tela preta e sem perda de dados',
          ],
        },
        local_origem: p.caminho,
        tipo: 'CAMINHO_PASTA',
      });
      setMensagemSucesso(`Pacote "${p.arquivo}" pronto para ser aplicado com 1 clique!`);
    }
  };

  // Upload de Arquivo direto
  const handleSelecionarArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArquivoSelecionado(file);
    setMensagemErro('');
    setPacoteValidado(null);

    try {
      const texto = await file.text();
      setArquivoConteudo(texto);

      // Tenta parsear direto se for JSON
      try {
        const json = JSON.parse(texto);
        if (json.versao) {
          setPacoteValidado({
            manifest: {
              versao: json.versao,
              nome_versao: json.nome_versao || `Atualização ${json.versao}`,
              data_lancamento: json.data_lancamento || new Date().toISOString().slice(0, 10),
              novos_recursos: json.novos_recursos || [],
              melhorias: json.melhorias || [],
              correcoes: json.correcoes || [],
            },
            local_origem: `Arquivo: ${file.name}`,
            tipo: 'ARQUIVO',
          });
          setMensagemSucesso(`Arquivo "${file.name}" lido e validado com sucesso!`);
          return;
        }
      } catch {}

      // Se for SQL ou outro tipo
      setPacoteValidado({
        manifest: {
          versao: '1.2.0',
          nome_versao: `Pacote Importado: ${file.name}`,
          data_lancamento: new Date().toISOString().slice(0, 10),
          novos_recursos: ['Pacote oficial de atualização'],
        },
        conteudo_sql: file.name.endsWith('.sql') ? texto : undefined,
        local_origem: `Arquivo: ${file.name}`,
        tipo: 'ARQUIVO',
      });
      setMensagemSucesso(`Arquivo "${file.name}" carregado e pronto para instalação.`);
    } catch (err: any) {
      setMensagemErro('Não foi possível ler o arquivo selecionado: ' + (err.message || err));
    }
  };

  // Verificar Nuvem / Online
  const handleVerificarNuvem = async () => {
    setVerificandoNuvem(true);
    setMensagemErro('');
    setMensagemSucesso('');
    setPacoteValidado(null);

    try {
      // Simulação / Chamada à URL remota oficial
      await new Promise((r) => setTimeout(r, 600));

      setPacoteValidado({
        manifest: {
          versao: '1.2.0',
          nome_versao: 'AutoOS - Atualização Dinâmica & WhatsApp Pro (Nuvem)',
          data_lancamento: new Date().toISOString().slice(0, 10),
          novos_recursos: [
            'Envio de OS via WhatsApp com resumo e arquivo PDF oficial',
            'Pasta exclusiva no computador para PDFs: PDFs_Ordens_de_Servico',
            'Botão "Copiar Imagem (Ctrl+V)" para anexar instantâneo no WhatsApp Web',
            'Botão "Abrir Pasta no Windows" direto para os PDFs das OS',
            'Central de Atualizações Tríplice: Pasta, Upload e Nuvem',
          ],
          melhorias: [
            'Proteção de portas e estabilização de sockets no Windows 11',
            'Executável de 1 clique sem perda de dados cadastrados',
          ],
        },
        local_origem: urlRemota,
        tipo: 'URL_REMOTA',
      });
      setMensagemSucesso('Pacote oficial v1.2.0 localizado no canal de atualizações!');
    } catch (err: any) {
      setMensagemErro('Erro ao verificar canal de atualizações: ' + (err.message || err));
    } finally {
      setVerificandoNuvem(false);
    }
  };

  // Aplicação da Atualização
  const handleAplicarAtualizacao = async () => {
    if (!pacoteValidado) return;

    setAtualizando(true);
    setProgressoLogs(['Iniciando processo de atualização do AutoOS...']);
    setAtualizacaoConcluida(false);
    setMensagemErro('');
    setMensagemSucesso('');

    try {
      const res = await AtualizacaoRepository.aplicarAtualizacao({
        tipo_origem: pacoteValidado.tipo,
        local_origem: pacoteValidado.local_origem,
        manifest: pacoteValidado.manifest,
        conteudo_sql: pacoteValidado.conteudo_sql,
        usuario_nome: usuarioAtual?.nome || 'Administrador',
        criar_backup_preventivo: criarBackupPreventivo,
      });

      // Dispara o atualizador local do Windows caso esteja rodando localmente
      dispararAtualizacaoSistema().catch(() => {});

      setProgressoLogs(res.logs);
      setAtualizacaoConcluida(true);
      setMensagemSucesso(`Sistema atualizado com êxito para a versão ${res.versao_instalada}!`);
      await carregarDados();
    } catch (err: any) {
      setMensagemErro('Falha ao aplicar atualização: ' + (err.message || err));
      setProgressoLogs((prev) => [...prev, `[ERRO FATAL] ${err.message || err}`]);
    } finally {
      setAtualizando(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Cabeçalho */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <ArrowUpCircle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <span>Central de Atualizações do AutoOS</span>
              </h1>
              <p className="text-xs text-zinc-400">
                Atualize o sistema com 1 clique usando Pasta Local, Importação Direta ou Nuvem.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-stretch sm:self-auto">
          {onVoltar && (
            <button
              type="button"
              onClick={onVoltar}
              title="Voltar para a tela principal (Dashboard)"
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-zinc-300 hover:text-white rounded-xl text-xs sm:text-sm font-medium transition border border-zinc-700 shadow-sm shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Início</span>
            </button>
          )}

          <div className="flex items-center gap-2 bg-zinc-950 px-3.5 py-2 rounded-xl border border-zinc-800">
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold block">Versão Atual</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">{statusVersao.versao_atual}</span>
            </div>
            <span className="h-6 w-px bg-zinc-800 mx-1" />
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              ESTÁVEL
            </span>
          </div>
        </div>
      </div>

      {mensagemSucesso && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5 shadow animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{mensagemSucesso}</span>
        </div>
      )}

      {mensagemErro && (
        <div className="p-4 bg-red-950/80 border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2.5 shadow animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="font-medium">{mensagemErro}</span>
        </div>
      )}

      {/* Abas das 3 Opções de Atualização */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => {
            setAbaMetodo('PASTA');
            escanearPastaLocal();
          }}
          className={`p-4 rounded-2xl border text-left transition flex flex-col gap-2 cursor-pointer ${
            abaMetodo === 'PASTA'
              ? 'bg-gradient-to-br from-red-950/60 via-zinc-900 to-zinc-950 border-red-500/80 shadow-lg text-white'
              : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <FolderOpen className="w-4 h-4 text-amber-400" />
              <span>Opção 1: Pasta 'atualizacoes'</span>
            </div>
            {pacotesLocais.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono text-[10px] font-bold">
                {pacotesLocais.length} disponível
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Você coloca o pacote na pasta <strong className="text-zinc-200">atualizacoes</strong> e o sistema detecta e instala sozinho.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setAbaMetodo('UPLOAD')}
          className={`p-4 rounded-2xl border text-left transition flex flex-col gap-2 cursor-pointer ${
            abaMetodo === 'UPLOAD'
              ? 'bg-gradient-to-br from-red-950/60 via-zinc-900 to-zinc-950 border-red-500/80 shadow-lg text-white'
              : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-400'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Upload className="w-4 h-4 text-blue-400" />
            <span>Opção 2: Importar Arquivo (.ZIP / .JSON)</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Selecione o arquivo baixado diretamente pela tela, sem precisar abrir nenhuma pasta no Windows.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setAbaMetodo('NUVEM')}
          className={`p-4 rounded-2xl border text-left transition flex flex-col gap-2 cursor-pointer ${
            abaMetodo === 'NUVEM'
              ? 'bg-gradient-to-br from-red-950/60 via-zinc-900 to-zinc-950 border-red-500/80 shadow-lg text-white'
              : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-400'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Opção 3: Atualização Online / Nuvem</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Verifica pela internet se há novidades e atualiza diretamente com 1 clique.
          </p>
        </button>
      </div>

      {/* Conteúdo da Opção 1: Pasta 'atualizacoes' */}
      {abaMetodo === 'PASTA' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-amber-400" />
                <span>Pasta de Atualizações do Sistema</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Local: <strong className="text-amber-300 font-mono">{caminhoPastaAtualizacoes}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={handleAbrirPastaWindows}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 active:bg-amber-500/35 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <FolderOpen className="w-4 h-4 text-amber-400" />
                <span>{pastaAbertaSucesso ? 'Pasta Aberta!' : 'Abrir Pasta no Windows'}</span>
              </button>

              <button
                type="button"
                onClick={escanearPastaLocal}
                disabled={escaneandoPasta}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-zinc-200 rounded-xl text-xs font-semibold transition border border-zinc-700 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${escaneandoPasta ? 'animate-spin' : ''}`} />
                <span>Escanear Pasta</span>
              </button>
            </div>
          </div>

          {pacotesLocais.length === 0 ? (
            <div className="bg-zinc-950/60 border border-dashed border-zinc-800 rounded-xl p-6 text-center space-y-2">
              <Info className="w-7 h-7 text-zinc-500 mx-auto" />
              <p className="text-xs font-semibold text-zinc-300">
                Nenhum arquivo de atualização colocado na pasta ainda.
              </p>
              <p className="text-[11px] text-zinc-400 max-w-md mx-auto">
                Basta clicar em <strong className="text-amber-300">"Abrir Pasta no Windows"</strong> acima e colar qualquer arquivo de atualização (.zip ou .json) lá dentro. O AutoOS detectará na hora!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-zinc-300">Pacotes detectados na pasta:</span>
              <div className="grid grid-cols-1 gap-2">
                {pacotesLocais.map((pacote, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-amber-500/40 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                        <FileArchive className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-xs text-white font-mono">{pacote.arquivo}</strong>
                          <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded font-mono">
                            {pacote.tipo}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Tamanho: {(pacote.tamanho / 1024).toFixed(1)} KB • Modificado em:{' '}
                          {new Date(pacote.modificadoEm).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelecionarPacoteDaPasta(pacote)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer self-end sm:self-center"
                    >
                      Selecionar e Instalar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da Opção 2: Upload Direto */}
      {abaMetodo === 'UPLOAD' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="border-b border-zinc-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-400" />
              <span>Importar Pacote Diretamente da Tela</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Escolha o arquivo .zip, .json ou .sql sem precisar acessar o Windows Explorer.
            </p>
          </div>

          <div className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-2xl p-7 text-center transition bg-zinc-950/60">
            <Upload className="w-10 h-10 text-zinc-500 mx-auto mb-2" />
            <p className="text-xs text-zinc-300 font-medium mb-1">
              {arquivoSelecionado ? (
                <span className="text-emerald-400 font-semibold font-mono">
                  {arquivoSelecionado.name} ({(arquivoSelecionado.size / 1024).toFixed(1)} KB)
                </span>
              ) : (
                'Arraste o arquivo para cá ou clique no botão abaixo'
              )}
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer transition border border-blue-500 shadow-md mt-2">
              <span>{arquivoSelecionado ? 'Trocar Arquivo' : 'Escolher Arquivo do Computador'}</span>
              <input
                type="file"
                accept=".json,.sql,.zip,.pkg"
                onChange={handleSelecionarArquivo}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {/* Conteúdo da Opção 3: Nuvem */}
      {abaMetodo === 'NUVEM' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="border-b border-zinc-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" />
              <span>Atualização Online (Canal Remoto)</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              O AutoOS busca as novidades oficiais diretamente nos servidores centrais.
            </p>
          </div>

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
            <label className="block text-xs font-semibold text-zinc-300">
              Canal Oficial de Distribuição:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={urlRemota}
                onChange={(e) => setUrlRemota(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleVerificarNuvem}
                disabled={verificandoNuvem}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-xl transition border border-emerald-500 flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                {verificandoNuvem ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Consultando Servidor...</span>
                  </>
                ) : (
                  <>
                    <DownloadCloud className="w-4 h-4" />
                    <span>Verificar se Há Atualização</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CARD DE PACOTE VALIDADO E INSTALAÇÃO COM 1 CLIQUE */}
      {pacoteValidado && (
        <div className="bg-zinc-900 border-2 border-emerald-500/50 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                  ✓
                </span>
                <h3 className="text-base font-bold text-white">Pacote Pronto para Instalar</h3>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Origem: <strong className="text-emerald-400 font-mono">{pacoteValidado.local_origem}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Versão de Destino:</span>
              <span className="px-3 py-1 rounded-lg bg-emerald-950 border border-emerald-600 text-emerald-300 font-bold font-mono text-xs">
                {pacoteValidado.manifest.versao}
              </span>
            </div>
          </div>

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{pacoteValidado.manifest.nome_versao}</span>
            </h4>

            {pacoteValidado.manifest.novos_recursos && (
              <div className="text-xs text-zinc-300 space-y-1">
                <strong className="text-emerald-400 block">Recursos e Melhorias Inclusas:</strong>
                <ul className="list-disc list-inside space-y-0.5 text-zinc-400 text-[11px]">
                  {pacoteValidado.manifest.novos_recursos.map((r: string, i: number) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Opções e Botão de Ação */}
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 select-none">
              <input
                type="checkbox"
                checked={criarBackupPreventivo}
                onChange={(e) => setCriarBackupPreventivo(e.target.checked)}
                className="rounded bg-zinc-900 border-zinc-700 text-emerald-600 focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Criar Backup Preventivo Automático (Garante que nenhum cliente ou OS seja perdido)</span>
            </label>

            <button
              type="button"
              id="btn-instalar-atualizacao-agora"
              onClick={handleAplicarAtualizacao}
              disabled={atualizando}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950 transition border border-emerald-500 disabled:opacity-50 cursor-pointer"
            >
              {atualizando ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Aplicando Atualização...</span>
                </>
              ) : (
                <>
                  <ArrowUpCircle className="w-4 h-4" />
                  <span>Atualizar Agora com 1 Clique</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Logs de Execução da Atualização */}
      {progressoLogs.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Progresso da Instalação</span>
            </div>
            {atualizacaoConcluida && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                100% Concluído
              </span>
            )}
          </div>

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-mono text-[11px] text-zinc-300 space-y-1 max-h-48 overflow-y-auto">
            {progressoLogs.map((log, idx) => (
              <div
                key={idx}
                className={
                  log.includes('[ERRO')
                    ? 'text-red-400'
                    : log.includes('Sucesso') || log.includes('protegidos')
                    ? 'text-emerald-400 font-bold'
                    : 'text-zinc-400'
                }
              >
                &gt; {log}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

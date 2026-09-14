import React, { useState, useEffect } from 'react';
import {
  ArrowUpCircle,
  FolderOpen,
  FileCode,
  Globe,
  Upload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Database,
  Clock,
  Sparkles,
  ChevronRight,
  RotateCcw,
  Check,
  Terminal,
  FileArchive,
  Info,
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
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/formatters';

export const AtualizacoesView: React.FC = () => {
  const { usuarioAtual } = useAuth();

  // Status da versão
  const [statusVersao, setStatusVersao] = useState<StatusVersaoSistema>({
    versao_atual: '1.0.0-PROTOTIPO',
    nome_versao: 'Protótipo Operacional Oficial',
    data_instalacao: '2026-09-14',
    ultima_atualizacao: null,
    total_atualizacoes: 0,
    engine_db: 'Ativo e Protegido',
    modo_prototipo: true,
  });

  const [historico, setHistorico] = useState<RegistroAtualizacao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');

  // Seleção de Origem da Atualização
  const [tipoOrigem, setTipoOrigem] = useState<TipoOrigemAtualizacao>('CAMINHO_PASTA');
  const [caminhoPasta, setCaminhoPasta] = useState('C:\\AutoOS\\atualizacoes\\versao_1.1.0');
  const [urlRemota, setUrlRemota] = useState('https://downloads.autoos.com.br/updates/v1.1.0.json');
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [arquivoConteudo, setArquivoConteudo] = useState<string>('');

  // Pacote Validado
  const [pacoteValidado, setPacoteValidado] = useState<{
    manifest: PacoteAtualizacaoManifest;
    conteudo_sql?: string;
    local_origem: string;
  } | null>(null);

  // Execução
  const [criarBackupPreventivo, setCriarBackupPreventivo] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [progressoLogs, setProgressoLogs] = useState<string[]>([]);
  const [atualizacaoConcluida, setAtualizacaoConcluida] = useState(false);

  useEffect(() => {
    carregarDados();
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

  const getLocalOrigemString = (): string => {
    if (tipoOrigem === 'ARQUIVO') {
      return arquivoSelecionado ? arquivoSelecionado.name : 'Nenhum arquivo selecionado';
    }
    if (tipoOrigem === 'CAMINHO_PASTA') {
      return caminhoPasta;
    }
    return urlRemota;
  };

  const handleSelecionarArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArquivoSelecionado(file);
    setMensagemErro('');
    setPacoteValidado(null);

    try {
      const texto = await file.text();
      setArquivoConteudo(texto);
    } catch (err: any) {
      setMensagemErro('Não foi possível ler o arquivo selecionado: ' + (err.message || err));
    }
  };

  const handleVerificarLocal = async () => {
    setMensagemErro('');
    setMensagemSucesso('');
    setPacoteValidado(null);
    setCarregando(true);

    const localOrigem = getLocalOrigemString();

    if (tipoOrigem === 'ARQUIVO' && !arquivoSelecionado) {
      setMensagemErro('Por favor, selecione o arquivo de atualização no seu computador.');
      setCarregando(false);
      return;
    }

    if ((tipoOrigem === 'CAMINHO_PASTA' && !caminhoPasta.trim()) || (tipoOrigem === 'URL_REMOTA' && !urlRemota.trim())) {
      setMensagemErro('Por favor, informe o local exato onde se encontra a atualização.');
      setCarregando(false);
      return;
    }

    try {
      const res = await AtualizacaoRepository.validarPacoteNoLocal({
        tipo_origem: tipoOrigem,
        local_origem: localOrigem,
        conteudo_arquivo: arquivoConteudo || undefined,
      });

      if (!res.valido || !res.manifest) {
        setMensagemErro(res.mensagem || 'Pacote de atualização inválido no local informado.');
        return;
      }

      setPacoteValidado({
        manifest: res.manifest,
        conteudo_sql: res.conteudo_sql,
        local_origem: localOrigem,
      });
      setMensagemSucesso(res.mensagem);
    } catch (err: any) {
      setMensagemErro('Erro ao verificar local de atualização: ' + (err.message || err));
    } finally {
      setCarregando(false);
    }
  };

  const handleAplicarAtualizacao = async () => {
    if (!pacoteValidado) return;

    setAtualizando(true);
    setProgressoLogs(['Iniciando processo de atualização...']);
    setAtualizacaoConcluida(false);
    setMensagemErro('');
    setMensagemSucesso('');

    try {
      const res = await AtualizacaoRepository.aplicarAtualizacao({
        tipo_origem: tipoOrigem,
        local_origem: pacoteValidado.local_origem,
        manifest: pacoteValidado.manifest,
        conteudo_sql: pacoteValidado.conteudo_sql,
        usuario_nome: usuarioAtual?.nome || 'Administrador',
        criar_backup_preventivo: criarBackupPreventivo,
      });

      setProgressoLogs(res.logs);
      setAtualizacaoConcluida(true);
      setMensagemSucesso(`Sistema atualizado com sucesso para a versão ${res.versao_instalada}!`);
      await carregarDados();
    } catch (err: any) {
      setMensagemErro('Falha ao aplicar atualização: ' + (err.message || err));
      setProgressoLogs((prev) => [...prev, `[ERRO FATAL] ${err.message || err}`]);
    } finally {
      setAtualizando(false);
    }
  };

  const handleReverterAtualizacao = async (id: string, versao: string) => {
    if (!confirm(`Atenção: deseja realmente reverter a atualização ${versao} e restaurar os dados do ponto de restauração anterior?`)) {
      return;
    }
    setCarregando(true);
    setMensagemErro('');
    setMensagemSucesso('');
    try {
      await AtualizacaoRepository.reverterAtualizacao(id);
      setMensagemSucesso(`Atualização revertida com sucesso. Versão anterior restaurada!`);
      await carregarDados();
    } catch (err: any) {
      setMensagemErro('Erro ao reverter atualização: ' + (err.message || err));
    } finally {
      setCarregando(false);
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
                <span>Atualização do Sistema AutoOS</span>
              </h1>
              <p className="text-xs text-zinc-400">
                Área administrativa para instalação de novas versões, melhorias e migrações do banco de dados.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto bg-zinc-950 px-3.5 py-2 rounded-xl border border-zinc-800">
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold block">Versão Atual</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">{statusVersao.versao_atual}</span>
          </div>
          <span className="h-6 w-px bg-zinc-800 mx-1" />
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-400 border border-amber-800/60">
            PROTÓTIPO
          </span>
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

      {/* Cartões de Status da Versão Atual */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-zinc-400 mb-1">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Estágio do Sistema</span>
          </div>
          <div className="text-sm font-bold text-white">{statusVersao.nome_versao}</div>
          <p className="text-[11px] text-zinc-400 mt-1">Pronto para receber patches e upgrades</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-zinc-400 mb-1">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Banco de Dados</span>
          </div>
          <div className="text-sm font-bold text-white">{statusVersao.engine_db}</div>
          <p className="text-[11px] text-emerald-400 mt-1">● Migrações protegidas por transação</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-zinc-400 mb-1">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>Histórico de Patches</span>
          </div>
          <div className="text-sm font-bold text-white">
            {statusVersao.total_atualizacoes > 0
              ? `${statusVersao.total_atualizacoes} atualização(ões) aplicada(s)`
              : 'Nenhuma atualização aplicada'}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            {statusVersao.ultima_atualizacao
              ? `Última em ${formatDateTime(statusVersao.ultima_atualizacao)}`
              : 'Versão inicial de instalação'}
          </p>
        </div>
      </div>

      {/* Card 1: PEDIR O LOCAL DA ATUALIZAÇÃO (Requisito Explícito do Usuário) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold font-mono">
              1
            </span>
            <h2 className="text-base font-bold text-white">Local da Atualização</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Informe onde está o pacote ou arquivo de melhorias que você deseja instalar neste protótipo.
          </p>
        </div>

        {/* Seleção do Tipo de Local */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => {
              setTipoOrigem('CAMINHO_PASTA');
              setPacoteValidado(null);
            }}
            className={`p-3.5 rounded-xl border text-left transition flex flex-col gap-1.5 ${
              tipoOrigem === 'CAMINHO_PASTA'
                ? 'bg-red-950/40 border-red-500/60 text-white'
                : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
              <FolderOpen className="w-4 h-4 text-red-500" />
              <span>Caminho de Pasta / Rede</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-tight">
              Pasta no computador, pen drive ou compartilhamento de rede da oficina.
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setTipoOrigem('ARQUIVO');
              setPacoteValidado(null);
            }}
            className={`p-3.5 rounded-xl border text-left transition flex flex-col gap-1.5 ${
              tipoOrigem === 'ARQUIVO'
                ? 'bg-red-950/40 border-red-500/60 text-white'
                : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
              <FileArchive className="w-4 h-4 text-red-500" />
              <span>Arquivo do Pacote</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-tight">
              Arquivo .zip, .json, .pkg ou script de migração .sql baixado.
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setTipoOrigem('URL_REMOTA');
              setPacoteValidado(null);
            }}
            className={`p-3.5 rounded-xl border text-left transition flex flex-col gap-1.5 ${
              tipoOrigem === 'URL_REMOTA'
                ? 'bg-red-950/40 border-red-500/60 text-white'
                : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
              <Globe className="w-4 h-4 text-red-500" />
              <span>Endereço URL / Servidor</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-tight">
              Link direto do servidor de atualizações ou repositório oficial.
            </p>
          </button>
        </div>

        {/* Input específico dependendo do tipo selecionado */}
        {tipoOrigem === 'CAMINHO_PASTA' && (
          <div className="space-y-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <label className="block text-xs font-semibold text-zinc-300">
              Digite ou cole o caminho da pasta onde está a atualização:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={caminhoPasta}
                onChange={(e) => {
                  setCaminhoPasta(e.target.value);
                  setPacoteValidado(null);
                }}
                placeholder="Ex: C:\AutoOS\atualizacoes\versao_1.1.0 ou D:\Updates"
                className="flex-1 px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-red-500"
              />
              <button
                type="button"
                onClick={handleVerificarLocal}
                disabled={carregando}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-white text-xs font-bold rounded-lg transition border border-zinc-700 shrink-0"
              >
                {carregando ? 'Verificando...' : 'Verificar Local'}
              </button>
            </div>

            {/* Atalhos Rápidos de Pastas Comuns */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-zinc-400">
              <span className="font-semibold text-zinc-300">Sugestões rápidas:</span>
              <button
                type="button"
                onClick={() => setCaminhoPasta('C:\\AutoOS\\atualizacoes\\versao_1.1.0')}
                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded border border-zinc-800 font-mono transition"
              >
                C:\AutoOS\atualizacoes\versao_1.1.0
              </button>
              <button
                type="button"
                onClick={() => setCaminhoPasta('D:\\Oficina_Updates\\autoos_v1.1')}
                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded border border-zinc-800 font-mono transition"
              >
                D:\Oficina_Updates\autoos_v1.1
              </button>
              <button
                type="button"
                onClick={() => setCaminhoPasta('\\\\servidor-oficina\\compartilhado\\atualizacoes')}
                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded border border-zinc-800 font-mono transition"
              >
                \\servidor-oficina\compartilhado
              </button>
            </div>
          </div>
        )}

        {tipoOrigem === 'ARQUIVO' && (
          <div className="space-y-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <label className="block text-xs font-semibold text-zinc-300">
              Selecione o arquivo de atualização baixado no computador:
            </label>
            <div className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl p-5 text-center transition bg-zinc-900/40">
              <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
              <p className="text-xs text-zinc-300 font-medium mb-1">
                {arquivoSelecionado ? (
                  <span className="text-emerald-400 font-semibold font-mono">
                    {arquivoSelecionado.name} ({(arquivoSelecionado.size / 1024).toFixed(1)} KB)
                  </span>
                ) : (
                  'Clique para selecionar o arquivo (.zip, .json, .sql, .pkg)'
                )}
              </p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg cursor-pointer transition border border-zinc-700 mt-2">
                <span>{arquivoSelecionado ? 'Trocar Arquivo' : 'Escolher Arquivo do Computador'}</span>
                <input
                  type="file"
                  accept=".json,.sql,.zip,.pkg,.txt"
                  onChange={handleSelecionarArquivo}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleVerificarLocal}
                disabled={!arquivoSelecionado || carregando}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-white text-xs font-bold rounded-lg transition border border-zinc-700 disabled:opacity-40"
              >
                {carregando ? 'Validando Arquivo...' : 'Validar Arquivo Selecionado'}
              </button>
            </div>
          </div>
        )}

        {tipoOrigem === 'URL_REMOTA' && (
          <div className="space-y-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <label className="block text-xs font-semibold text-zinc-300">
              Informe a URL do pacote ou repositório de atualização:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={urlRemota}
                onChange={(e) => {
                  setUrlRemota(e.target.value);
                  setPacoteValidado(null);
                }}
                placeholder="https://servidor.com.br/autoos/updates/v1.1.0.json"
                className="flex-1 px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-red-500"
              />
              <button
                type="button"
                onClick={handleVerificarLocal}
                disabled={carregando}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-white text-xs font-bold rounded-lg transition border border-zinc-700 shrink-0"
              >
                {carregando ? 'Conectando...' : 'Buscar Pacote'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Card 2: PACOTE VALIDADO E DETALHES DAS MELHORIAS */}
      {pacoteValidado && (
        <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-5 sm:p-6 space-y-5 animate-fadeIn">
          <div className="border-b border-zinc-800 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                  2
                </span>
                <h2 className="text-base font-bold text-white">Pacote de Melhorias Encontrado</h2>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Origem confirmada em: <strong className="text-zinc-200 font-mono">{pacoteValidado.local_origem}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Nova Versão:</span>
              <span className="px-3 py-1 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold font-mono text-xs">
                {pacoteValidado.manifest.versao}
              </span>
            </div>
          </div>

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{pacoteValidado.manifest.nome_versao}</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Data do Pacote: {pacoteValidado.manifest.data_lancamento} • Compatibilidade: {pacoteValidado.manifest.compatibilidade_minima || 'v1.0.0+'}
              </p>
            </div>

            {/* Listas de Recursos, Melhorias e Correções */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              {pacoteValidado.manifest.novos_recursos && pacoteValidado.manifest.novos_recursos.length > 0 && (
                <div className="bg-zinc-900/70 p-3 rounded-lg border border-zinc-800/80">
                  <h4 className="font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>Novos Recursos e Telas:</span>
                  </h4>
                  <ul className="space-y-1 text-zinc-300 text-[11px] list-disc list-inside">
                    {pacoteValidado.manifest.novos_recursos.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {pacoteValidado.manifest.melhorias && pacoteValidado.manifest.melhorias.length > 0 && (
                <div className="bg-zinc-900/70 p-3 rounded-lg border border-zinc-800/80">
                  <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Melhorias no Protótipo:</span>
                  </h4>
                  <ul className="space-y-1 text-zinc-300 text-[11px] list-disc list-inside">
                    {pacoteValidado.manifest.melhorias.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Opções de Proteção e Execução */}
            <div className="pt-2 border-t border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 select-none">
                <input
                  type="checkbox"
                  checked={criarBackupPreventivo}
                  onChange={(e) => setCriarBackupPreventivo(e.target.checked)}
                  className="rounded bg-zinc-900 border-zinc-700 text-red-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Criar Ponto de Restauração Automático (Protege todos os dados da oficina antes de atualizar)</span>
              </label>

              <button
                type="button"
                onClick={handleAplicarAtualizacao}
                disabled={atualizando}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-950 transition border border-red-500 disabled:opacity-50 shrink-0 cursor-pointer"
              >
                {atualizando ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Instalando Atualização...</span>
                  </>
                ) : (
                  <>
                    <ArrowUpCircle className="w-4 h-4" />
                    <span>Instalar Atualização Agora</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card 3: CONSOLE DE PROGRESSO E LOGS DE EXECUÇÃO */}
      {progressoLogs.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
              <Terminal className="w-4 h-4 text-red-500" />
              <span>Log de Execução da Atualização</span>
            </div>
            {atualizacaoConcluida && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                100% Concluído
              </span>
            )}
          </div>

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 font-mono text-[11px] text-zinc-300 space-y-1.5 max-h-56 overflow-y-auto">
            {progressoLogs.map((log, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 ${
                  log.includes('[ERRO')
                    ? 'text-red-400'
                    : log.includes('Sucesso') || log.includes('protegidos')
                    ? 'text-emerald-400 font-semibold'
                    : 'text-zinc-300'
                }`}
              >
                <span className="text-zinc-400 select-none">&gt;</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card 4: HISTÓRICO DE ATUALIZAÇÕES APLICADAS */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-500" />
              <span>Histórico de Atualizações do Sistema</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Registro de todas as melhorias e patches aplicados na oficina.
            </p>
          </div>
        </div>

        {historico.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-xs bg-zinc-950/50 rounded-xl border border-zinc-800/60">
            <Info className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
            <p className="font-medium text-zinc-300">Nenhuma atualização adicional foi aplicada ainda.</p>
            <p className="text-zinc-400 text-[11px] mt-0.5">
              O sistema está rodando a versão original de protótipo. Use o campo acima para aplicar atualizações futuras.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">Versão</th>
                  <th className="py-2.5 px-3">Origem / Local Informado</th>
                  <th className="py-2.5 px-3">Data e Hora</th>
                  <th className="py-2.5 px-3">Responsável</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Restauração</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {historico.map((reg) => (
                  <tr key={reg.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      <span className="text-zinc-400">{reg.versao_anterior}</span>
                      <span className="mx-1 text-red-500">➔</span>
                      <span className="text-emerald-400">{reg.versao_instalada}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 text-zinc-200">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400">
                          {reg.tipo_origem}
                        </span>
                        <span className="truncate max-w-xs font-mono text-[11px] text-zinc-300" title={reg.local_origem}>
                          {reg.local_origem}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-zinc-400 font-mono text-[11px]">
                      {formatDateTime(reg.data_hora)}
                    </td>
                    <td className="py-3 px-3 text-zinc-300">{reg.usuario_nome}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          reg.status === 'SUCESSO'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : reg.status === 'REVERTIDO'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-red-950 text-red-400 border border-red-800'
                        }`}
                      >
                        {reg.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {reg.backup_snapshot && reg.status === 'SUCESSO' && (
                        <button
                          type="button"
                          onClick={() => handleReverterAtualizacao(reg.id, reg.versao_instalada)}
                          disabled={carregando}
                          title="Restaurar ponto de restauração anterior a esta atualização"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-300 hover:text-white rounded text-[11px] transition border border-zinc-700"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reverter</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

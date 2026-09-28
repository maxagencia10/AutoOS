import React, { useEffect, useState } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  XCircle,
  TrendingUp,
  Users,
  Car,
  PlusCircle,
  Search,
  ArrowRight,
  Eye,
  Calendar,
  Sparkles,
  HelpCircle,
  MousePointer,
  Settings,
  MessageSquare,
} from 'lucide-react';
import { OrdemServico } from '../types';
import { OrdemServicoRepository } from '../services/dbRepository';
import { formatCurrency, formatDate, getStatusBadgeInfo, formatPlaca } from '../utils/formatters';
import { ModalEnvioWhatsAppOS } from './ModalEnvioWhatsAppOS';
import { verificarPacotesPastaAtualizacoes } from '../services/atualizacaoScanner';
import { ArrowUpCircle } from 'lucide-react';

interface DashboardProps {
  onNovaOS: () => void;
  onNovoCliente: () => void;
  onNovoVeiculo: () => void;
  onVerTodasOS: () => void;
  onVisualizarOS: (os: OrdemServico) => void;
  onAbrirTour?: (etapaInicial?: number) => void;
  onConfiguracoes?: () => void;
  onIrParaAtualizacoes?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNovaOS,
  onNovoCliente,
  onNovoVeiculo,
  onVerTodasOS,
  onVisualizarOS,
  onAbrirTour,
  onConfiguracoes,
  onIrParaAtualizacoes,
}) => {
  const [metrics, setMetrics] = useState({
    total: 0,
    abertas: 0,
    aguardando: 0,
    aprovadas: 0,
    emExecucao: 0,
    concluidas: 0,
    entregues: 0,
    canceladas: 0,
    faturamentoTotal: 0,
    faturamentoConcluido: 0,
    totalClientes: 0,
    totalVeiculos: 0,
  });
  const [todasOS, setTodasOS] = useState<OrdemServico[]>([]);
  const [recentes, setRecentes] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [osParaWhatsApp, setOsParaWhatsApp] = useState<OrdemServico | null>(null);
  const [pacotesPendentes, setPacotesPendentes] = useState<number>(0);

  useEffect(() => {
    carregarDados();
    verificarPacotesPastaAtualizacoes().then((info) => {
      if (info && info.totalPacotes) {
        setPacotesPendentes(info.totalPacotes);
      }
    }).catch(() => {});
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [m, osList] = await Promise.all([
        OrdemServicoRepository.getMetrics(),
        OrdemServicoRepository.getAll(),
      ]);
      setMetrics(m);
      setTodasOS(osList);
      setRecentes(osList.slice(0, 5));
    } catch (err) {
      console.error('Erro ao carregar métricas:', err);
    } finally {
      setLoading(false);
    }
  };

  const cardsStatus = [
    { label: 'Abertas', count: metrics.abertas, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-950/40', border: 'border-blue-900/50' },
    { label: 'Aguard. Aprovação', count: metrics.aguardando, icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-950/40', border: 'border-amber-900/50' },
    { label: 'Aprovadas', count: metrics.aprovadas, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-900/50' },
    { label: 'Em Execução', count: metrics.emExecucao, icon: FileText, color: 'text-indigo-400', bg: 'bg-indigo-950/40', border: 'border-indigo-900/50' },
    { label: 'Concluídas', count: metrics.concluidas, icon: CheckCircle2, color: 'text-teal-400', bg: 'bg-teal-950/40', border: 'border-teal-900/50' },
    { label: 'Entregues', count: metrics.entregues, icon: Truck, color: 'text-zinc-200', bg: 'bg-zinc-900', border: 'border-zinc-800' },
    { label: 'Canceladas', count: metrics.canceladas, icon: XCircle, color: 'text-red-400', bg: 'bg-red-950/40', border: 'border-red-900/50' },
  ];

  return (
    <div className="space-y-6">

      {/* Banner de Atualização Detectada na Pasta ou Nuvem */}
      {pacotesPendentes > 0 && onIrParaAtualizacoes && (
        <div className="bg-gradient-to-r from-emerald-950 via-zinc-900 to-zinc-950 border-2 border-emerald-500/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-emerald-950/40 animate-pulse">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <ArrowUpCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Nova Atualização do AutoOS Detectada!
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px] font-mono font-bold">
                  {pacotesPendentes} pacote(s) na pasta
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5">
                Um novo pacote de melhorias foi colocado na pasta de atualizações. Clique para instalar em 1 clique sem perder dados.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onIrParaAtualizacoes}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950 transition border border-emerald-500 shrink-0 cursor-pointer"
          >
            <span>Ver e Instalar Atualização</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Barra de Ações Rápidas do Dashboard */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Painel Operacional da Oficina</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Controle em tempo real de ordens de serviço, faturamento e veículos em manutenção.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            id="dash-btn-nova-os"
            onClick={onNovaOS}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-lg text-sm font-semibold shadow-lg shadow-red-950/50 transition border border-red-500"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nova OS</span>
          </button>
          <button
            id="dash-btn-novo-cliente"
            onClick={onNovoCliente}
            title="Ir para a gestão de Clientes"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-zinc-200 rounded-lg text-xs sm:text-sm font-medium transition border border-zinc-700"
          >
            <Users className="w-3.5 h-3.5 text-zinc-400" />
            <span>Clientes</span>
          </button>
          <button
            id="dash-btn-novo-veiculo"
            onClick={onNovoVeiculo}
            title="Ir para a gestão de Veículos"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-zinc-200 rounded-lg text-xs sm:text-sm font-medium transition border border-zinc-700"
          >
            <Car className="w-3.5 h-3.5 text-zinc-400" />
            <span>Veículos</span>
          </button>
          <button
            id="dash-btn-consultar-os"
            onClick={onVerTodasOS}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs sm:text-sm font-medium transition border border-zinc-700"
          >
            <Search className="w-3.5 h-3.5 text-zinc-400" />
            <span>Consultar OS</span>
          </button>
          {onConfiguracoes && (
            <button
              id="dash-btn-config-oficina"
              onClick={onConfiguracoes}
              title="Configurações da Oficina, Cabeçalho e Impressão"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-zinc-200 rounded-lg text-xs sm:text-sm font-medium transition border border-zinc-700"
            >
              <Settings className="w-3.5 h-3.5 text-red-400" />
              <span>Configurar Oficina & Cabeçalho</span>
            </button>
          )}
        </div>
      </div>

      {/* Roteiro Rápido em 3 Passos para Facilitar o Uso */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border-2 border-red-500/30 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-600/20 text-red-400 rounded-xl border border-red-500/30 shrink-0">
              <Sparkles className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Roteiro de Atendimento: Como Usar em 3 Passos</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Siga sempre esta ordem simples: Cadastre o Cliente ➔ Cadastre o Veículo ➔ Gere a Ordem de Serviço.
              </p>
            </div>
          </div>

          {onAbrirTour && (
            <button
              onClick={() => onAbrirTour(1)}
              id="dash-btn-iniciar-tour"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-red-950/60 transition border border-red-400 shrink-0"
            >
              <MousePointer className="w-4 h-4 text-white" />
              <span>Ver Tour com Apontador na Tela</span>
            </button>
          )}
        </div>

        {/* 3 Passos Visuais Interativos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
          {/* 1. Cadastrar Cliente */}
          <div
            onClick={() => onAbrirTour ? onAbrirTour(1) : onNovoCliente()}
            className="bg-zinc-950/60 hover:bg-zinc-800/70 border border-zinc-800 hover:border-red-500/50 rounded-xl p-3.5 transition cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/60 border border-blue-800/40 px-2 py-0.5 rounded-full">
                  1º Passo
                </span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <h3 className="font-bold text-white text-sm group-hover:text-red-400 transition">
                1. Cadastrar o Cliente
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Informe o nome e WhatsApp. Dica: digite o CEP que o endereço preenche sozinho!
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px] font-semibold text-blue-400 group-hover:text-blue-300">
              <span>Como fazer ➔</span>
            </div>
          </div>

          {/* 2. Cadastrar Veículo */}
          <div
            onClick={() => onAbrirTour ? onAbrirTour(2) : onNovoVeiculo()}
            className="bg-zinc-950/60 hover:bg-zinc-800/70 border border-zinc-800 hover:border-amber-500/50 rounded-xl p-3.5 transition cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded-full">
                  2º Passo
                </span>
                <Car className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="font-bold text-white text-sm group-hover:text-amber-400 transition">
                2. Cadastrar o Veículo
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Vincule ao cliente e digite a placa (Mercosul ou antiga), marca, modelo e Km atual.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px] font-semibold text-amber-400 group-hover:text-amber-300">
              <span>Como fazer ➔</span>
            </div>
          </div>

          {/* 3. Gerar OS */}
          <div
            onClick={() => onAbrirTour ? onAbrirTour(3) : onNovaOS()}
            className="bg-zinc-950/60 hover:bg-zinc-800/70 border border-zinc-800 hover:border-emerald-500/50 rounded-xl p-3.5 transition cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                  3º Passo
                </span>
                <FileText className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="font-bold text-white text-sm group-hover:text-emerald-400 transition">
                3. Gerar a Ordem de Serviço
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Selecione o cliente e carro, adicione peças/serviços e emita para impressão e WhatsApp.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px] font-semibold text-emerald-400 group-hover:text-emerald-300">
              <span>Emitir OS ➔</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Métricas Financeiras e Totais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Faturamento Concluído</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {formatCurrency(metrics.faturamentoConcluido)}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">OS concluídas e entregues</p>
          <div className="absolute right-0 bottom-0 h-1 w-full bg-emerald-500/40" />
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Volume em Andamento</span>
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {formatCurrency(metrics.faturamentoTotal - metrics.faturamentoConcluido)}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">OS em aberto e execução</p>
          <div className="absolute right-0 bottom-0 h-1 w-full bg-amber-500/40" />
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Total de Clientes</span>
            <Users className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {metrics.totalClientes}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Base ativa cadastrada</p>
          <div className="absolute right-0 bottom-0 h-1 w-full bg-blue-500/40" />
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Veículos na Base</span>
            <Car className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {metrics.totalVeiculos}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Com histórico de KM e OS</p>
          <div className="absolute right-0 bottom-0 h-1 w-full bg-red-500/40" />
        </div>

      </div>

      {/* Grid de Status das Ordens de Serviço */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {cardsStatus.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className={`${c.bg} ${c.border} border rounded-xl p-3 flex flex-col justify-between transition hover:border-zinc-700`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-zinc-400 truncate">{c.label}</span>
                <Icon className={`w-3.5 h-3.5 ${c.color}`} />
              </div>
              <div className={`text-xl font-bold ${c.color} font-mono`}>
                {c.count}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabela de Ordens de Serviço Recentes */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-500" />
            <h2 className="text-base sm:text-lg font-bold text-white">Ordens de Serviço Recentes</h2>
          </div>
          <button
            onClick={onVerTodasOS}
            className="text-xs sm:text-sm text-red-400 hover:text-red-300 font-medium flex items-center gap-1 transition"
          >
            <span>Ver todas ({metrics.total})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-zinc-400 text-sm">Carregando dados do PostgreSQL...</div>
        ) : recentes.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-sm">
            Nenhuma Ordem de Serviço cadastrada até o momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-zinc-950 text-zinc-400 uppercase text-[11px] font-semibold border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Número</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Veículo / Placa</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Valor Total</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {recentes.map((os) => {
                  const badge = getStatusBadgeInfo(os.status);
                  return (
                    <tr key={os.id} className="hover:bg-zinc-800/40 transition">
                      <td className="px-4 py-3.5 font-mono font-bold text-white">
                        {os.numero_formatado}
                      </td>
                      <td className="px-4 py-3.5 text-zinc-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{formatDate(os.data)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-zinc-200">{os.cliente_nome}</div>
                        <div className="text-[11px] text-zinc-400">{os.cliente_telefone}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-zinc-200">{os.veiculo_modelo}</div>
                        <div className="text-[11px] font-mono font-semibold text-red-400">
                          {formatPlaca(os.veiculo_placa)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text} border ${badge.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {os.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-zinc-100">
                        {formatCurrency(os.total)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onVisualizarOS(os)}
                            title="Visualizar OS e Imprimir A4"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition border border-zinc-700"
                          >
                            <Eye className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Ver</span>
                          </button>

                          <button
                            onClick={() => setOsParaWhatsApp(os)}
                            title="Enviar Ordem de Serviço com PDF via WhatsApp"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 text-xs font-medium transition border border-emerald-500/40"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Envio via WhatsApp com PDF */}
      {osParaWhatsApp && (
        <ModalEnvioWhatsAppOS
          os={osParaWhatsApp}
          onClose={() => setOsParaWhatsApp(null)}
        />
      )}

    </div>
  );
};

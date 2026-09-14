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
} from 'lucide-react';
import { OrdemServico } from '../types';
import { OrdemServicoRepository } from '../services/dbRepository';
import { formatCurrency, formatDate, getStatusBadgeInfo, formatPlaca } from '../utils/formatters';

interface DashboardProps {
  onNovaOS: () => void;
  onNovoCliente: () => void;
  onNovoVeiculo: () => void;
  onVerTodasOS: () => void;
  onVisualizarOS: (os: OrdemServico) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNovaOS,
  onNovoCliente,
  onNovoVeiculo,
  onVerTodasOS,
  onVisualizarOS,
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
  const [recentes, setRecentes] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [m, osList] = await Promise.all([
        OrdemServicoRepository.getMetrics(),
        OrdemServicoRepository.getAll(),
      ]);
      setMetrics(m);
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
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-zinc-200 rounded-lg text-xs sm:text-sm font-medium transition border border-zinc-700"
          >
            <Users className="w-3.5 h-3.5 text-zinc-400" />
            <span>Novo Cliente</span>
          </button>
          <button
            id="dash-btn-novo-veiculo"
            onClick={onNovoVeiculo}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-zinc-200 rounded-lg text-xs sm:text-sm font-medium transition border border-zinc-700"
          >
            <Car className="w-3.5 h-3.5 text-zinc-400" />
            <span>Novo Veículo</span>
          </button>
          <button
            id="dash-btn-consultar-os"
            onClick={onVerTodasOS}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs sm:text-sm font-medium transition border border-zinc-700"
          >
            <Search className="w-3.5 h-3.5 text-zinc-400" />
            <span>Consultar OS</span>
          </button>
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
                        <button
                          onClick={() => onVisualizarOS(os)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition border border-zinc-700"
                        >
                          <Eye className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Ver</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

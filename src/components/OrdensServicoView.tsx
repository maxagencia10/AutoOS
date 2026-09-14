import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Plus,
  Eye,
  Edit2,
  Printer,
  Share2,
  Trash2,
  Filter,
  Calendar,
  DollarSign,
  Gauge,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { OrdemServico, StatusOS } from '../types';
import { OrdemServicoRepository } from '../services/dbRepository';
import {
  formatCurrency,
  formatDate,
  formatPlaca,
  getStatusBadgeInfo,
  buildWhatsAppLink,
} from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

interface OrdensServicoViewProps {
  onNovaOS: () => void;
  onVisualizarOS: (os: OrdemServico) => void;
  onEditarOS: (os: OrdemServico) => void;
}

export const OrdensServicoView: React.FC<OrdensServicoViewProps> = ({
  onNovaOS,
  onVisualizarOS,
  onEditarOS,
}) => {
  const { isAdmin } = useAuth();
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [search, setSearch] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODAS');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarOrdens();
  }, [search, filtroStatus]);

  const carregarOrdens = async () => {
    setLoading(true);
    try {
      const list = await OrdemServicoRepository.getAll({
        search,
        status: filtroStatus === 'TODAS' ? undefined : (filtroStatus as StatusOS),
      });
      setOrdens(list);
    } catch (err) {
      console.error('Erro ao listar OS:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExcluirOS = async (id: string, numero: string) => {
    if (!confirm(`Tem certeza que deseja excluir permanentemente a ${numero}?`)) {
      return;
    }
    try {
      await OrdemServicoRepository.delete(id);
      carregarOrdens();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir OS.');
    }
  };

  const handleWhatsApp = (os: OrdemServico) => {
    const link = buildWhatsAppLink(
      os.cliente_whatsapp || os.cliente_telefone,
      os.numero_formatado,
      os.cliente_nome,
      os.veiculo_modelo,
      os.veiculo_placa,
      os.total,
      os.status
    );
    window.open(link, '_blank');
  };

  const statusOptions = [
    'TODAS',
    'ABERTA',
    'AGUARDANDO APROVAÇÃO',
    'APROVADA',
    'EM EXECUÇÃO',
    'CONCLUÍDA',
    'ENTREGUE',
    'CANCELADA',
  ];

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-4 sm:p-5 rounded-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-red-500" />
            <span>Ordens de Serviço</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Gerenciamento completo do ciclo de atendimento automotivo, orçamentos e aprovações.
          </p>
        </div>

        <button
          id="btn-nova-os-lista"
          onClick={onNovaOS}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-lg text-sm font-semibold shadow-md shadow-red-950 transition border border-red-500"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Ordem de Serviço</span>
        </button>
      </div>

      {/* Barra de Filtros e Pesquisa */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              id="input-busca-os"
              placeholder="Pesquisar por número da OS (ex: OS Nº 000001), cliente, placa ou veículo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 transition text-xs sm:text-sm"
            />
          </div>

          {/* Filtro por Status */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-zinc-400 shrink-0" />
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 text-xs sm:text-sm focus:outline-none focus:border-red-500 font-medium cursor-pointer w-full md:w-auto"
            >
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'TODAS' ? 'Filtrar: Todos os Status' : opt}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Chips de Acesso Rápido a Status */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {statusOptions.map((opt) => {
            const active = filtroStatus === opt;
            return (
              <button
                key={opt}
                onClick={() => setFiltroStatus(opt)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap transition text-[11px] font-medium border ${
                  active
                    ? 'bg-red-600/20 text-red-400 border-red-500/40 font-bold'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                {opt === 'TODAS' ? 'Todas' : opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabela de Ordens de Serviço */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-sm">Carregando ordens de serviço do PostgreSQL...</div>
        ) : ordens.length === 0 ? (
          <div className="p-12 text-center bg-zinc-900/50">
            <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-300 font-medium text-base">Nenhuma Ordem de Serviço encontrada.</p>
            <p className="text-zinc-500 text-xs mt-1">Crie uma nova OS utilizando o botão acima.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-zinc-950 text-zinc-400 uppercase text-[11px] font-semibold border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Número</th>
                  <th className="px-4 py-3">Data / Hora</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Veículo / Placa</th>
                  <th className="px-4 py-3">Quilometragem</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Total (R$)</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {ordens.map((os) => {
                  const badge = getStatusBadgeInfo(os.status);
                  return (
                    <tr key={os.id} className="hover:bg-zinc-800/40 transition">
                      <td className="px-4 py-3.5 font-mono font-bold text-white whitespace-nowrap">
                        {os.numero_formatado}
                      </td>
                      <td className="px-4 py-3.5 text-zinc-300 whitespace-nowrap">
                        <div>{formatDate(os.data)}</div>
                        <div className="text-[10px] text-zinc-500">{os.hora}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-zinc-100">{os.cliente_nome}</div>
                        <div className="text-[11px] text-zinc-400">{os.cliente_telefone}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-zinc-200">{os.veiculo_modelo}</div>
                        <div className="text-[11px] font-mono font-semibold text-red-400">
                          {formatPlaca(os.veiculo_placa)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-zinc-300 whitespace-nowrap">
                        {os.quilometragem.toLocaleString('pt-BR')} km
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text} border ${badge.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {os.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-white whitespace-nowrap">
                        {formatCurrency(os.total)}
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onVisualizarOS(os)}
                            title="Visualizar Detalhes e Imprimir A4"
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md transition border border-zinc-700"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleWhatsApp(os)}
                            title="Enviar Notificação via WhatsApp"
                            className="p-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 rounded-md transition border border-emerald-800/80"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {os.status !== 'CANCELADA' && (
                            <button
                              onClick={() => onEditarOS(os)}
                              title="Editar Ordem de Serviço"
                              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition border border-zinc-700"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              onClick={() => handleExcluirOS(os.id, os.numero_formatado)}
                              title="Excluir Definitivamente"
                              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-md transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

    </div>
  );
};

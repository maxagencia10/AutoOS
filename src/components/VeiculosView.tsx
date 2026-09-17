import React, { useState, useEffect } from 'react';
import {
  Car,
  Search,
  Plus,
  Edit2,
  Trash2,
  Gauge,
  Calendar,
  FileText,
  Eye,
  X,
  AlertCircle,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { Veiculo, Cliente, OrdemServico } from '../types';
import {
  VeiculoRepository,
  ClienteRepository,
  OrdemServicoRepository,
} from '../services/dbRepository';
import {
  formatPlaca,
  formatCurrency,
  formatDate,
  getStatusBadgeInfo,
} from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { detectarMarcaPorModelo, CATALOGO_VEICULOS } from '../utils/veiculoMarcas';

interface VeiculosViewProps {
  onVisualizarOS: (os: OrdemServico) => void;
  onNovaOSParaVeiculo?: (veiculo: Veiculo) => void;
  onAbrirTour?: (etapa?: number) => void;
  veiculoInicial?: Veiculo | null;
  onLimparVeiculoInicial?: () => void;
}

export const VeiculosView: React.FC<VeiculosViewProps> = ({
  onVisualizarOS,
  onNovaOSParaVeiculo,
  onAbrirTour,
  veiculoInicial,
  onLimparVeiculoInicial,
}) => {
  const { isAdmin } = useAuth();
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [veiculoDestacadoId, setVeiculoDestacadoId] = useState<string | null>(null);

  // Modal de Cadastro/Edição
  const [modalOpen, setModalOpen] = useState(false);
  const [veiculoEditando, setVeiculoEditando] = useState<Veiculo | null>(null);
  const [formData, setFormData] = useState({
    cliente_id: '',
    veiculo: '',
    marca: '',
    ano: new Date().getFullYear(),
    cor: '',
    placa: '',
    quilometragem: 0,
  });
  const [erroForm, setErroForm] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [marcaDetectada, setMarcaDetectada] = useState<string | null>(null);
  const [marcaEditadaManualmente, setMarcaEditadaManualmente] = useState(false);

  // Modal de Histórico do Veículo (Section 28)
  const [detalheVeiculo, setDetalheVeiculo] = useState<Veiculo | null>(null);
  const [osVeiculo, setOsVeiculo] = useState<OrdemServico[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);

  useEffect(() => {
    carregarDados();
  }, [search]);

  // Ao navegar via Busca Global para um veículo específico
  useEffect(() => {
    if (veiculoInicial) {
      setVeiculoDestacadoId(veiculoInicial.id);
      setSearch(veiculoInicial.placa);
      abrirHistoricoVeiculo(veiculoInicial);
      onLimparVeiculoInicial?.();
    }
  }, [veiculoInicial]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [veics, clis] = await Promise.all([
        VeiculoRepository.getAll(search),
        ClienteRepository.getAll(),
      ]);
      setVeiculos(veics);
      setClientes(clis);
    } catch (err) {
      console.error('Erro ao carregar veículos:', err);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalNovo = () => {
    setVeiculoEditando(null);
    setFormData({
      cliente_id: clientes[0]?.id || '',
      veiculo: '',
      marca: '',
      ano: new Date().getFullYear(),
      cor: '',
      placa: '',
      quilometragem: 0,
    });
    setMarcaDetectada(null);
    setMarcaEditadaManualmente(false);
    setErroForm('');
    setModalOpen(true);
  };

  const abrirModalEditar = (v: Veiculo) => {
    setVeiculoEditando(v);
    setFormData({
      cliente_id: v.cliente_id,
      veiculo: v.veiculo,
      marca: v.marca,
      ano: v.ano,
      cor: v.cor,
      placa: v.placa,
      quilometragem: v.quilometragem,
    });
    setMarcaDetectada(null);
    setMarcaEditadaManualmente(true);
    setErroForm('');
    setModalOpen(true);
  };

  const handleModeloChange = (valor: string) => {
    const deteccao = detectarMarcaPorModelo(valor);
    if (deteccao) {
      setMarcaDetectada(deteccao.marca);
      setFormData((prev) => {
        const deveAtualizarMarca = !marcaEditadaManualmente || !prev.marca || prev.marca === marcaDetectada;
        return {
          ...prev,
          veiculo: valor,
          marca: deveAtualizarMarca ? deteccao.marca : prev.marca,
        };
      });
    } else {
      if (!valor.trim()) {
        setMarcaDetectada(null);
      }
      setFormData((prev) => ({ ...prev, veiculo: valor }));
    }
  };

  const salvarVeiculo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cliente_id) {
      setErroForm('Selecione o proprietário (cliente) do veículo.');
      return;
    }
    if (!formData.veiculo.trim() || !formData.marca.trim() || !formData.placa.trim()) {
      setErroForm('Preencha os campos obrigatórios: Veículo, Marca e Placa.');
      return;
    }

    setSalvando(true);
    setErroForm('');
    try {
      if (veiculoEditando) {
        await VeiculoRepository.update(veiculoEditando.id, formData);
      } else {
        await VeiculoRepository.create(formData);
      }
      setModalOpen(false);
      carregarDados();
    } catch (err: any) {
      setErroForm(err.message || 'Erro ao salvar veículo.');
    } finally {
      setSalvando(false);
    }
  };

  const excluirVeiculo = async (id: string, placa: string) => {
    if (!confirm(`Deseja realmente excluir o veículo placa ${formatPlaca(placa)}?`)) {
      return;
    }
    try {
      await VeiculoRepository.delete(id);
      carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir veículo.');
    }
  };

  const abrirHistoricoVeiculo = async (v: Veiculo) => {
    setDetalheVeiculo(v);
    setCarregandoHistorico(true);
    try {
      const ordens = await OrdemServicoRepository.getAll({ veiculoId: v.id });
      setOsVeiculo(ordens);
    } catch (err) {
      console.error('Erro ao carregar histórico do veículo:', err);
    } finally {
      setCarregandoHistorico(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-4 sm:p-5 rounded-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Car className="w-6 h-6 text-red-500" />
            <span>Cadastro e Gestão de Veículos</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Controle de frota, proprietários e evolução de quilometragem.
          </p>
        </div>

        <button
          id="btn-novo-veiculo"
          onClick={abrirModalNovo}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-lg text-sm font-semibold shadow-md shadow-red-950 transition border border-red-500"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Veículo</span>
        </button>
      </div>

      {/* Banner Orientativo do 2º Passo do Roteiro */}
      <div className="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 border border-amber-900/60 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-amber-600/30 border border-amber-500/50 flex items-center justify-center text-amber-400 font-bold shrink-0 text-xs">
            2º
          </div>
          <div>
            <span className="font-bold text-amber-300 block sm:inline">2º Passo do Roteiro: Cadastrar o Veículo. </span>
            <span className="text-zinc-300">
              Clique em <strong className="text-white">"Novo Veículo"</strong> para vincular o carro ao cliente, digitar a Placa e o Modelo (Ex: Fiat Palio, Gol, Onix).
            </span>
          </div>
        </div>
        {onAbrirTour && (
          <button
            onClick={() => onAbrirTour(2)}
            className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 shrink-0 text-left sm:text-right"
          >
            Ver instruções com apontador ➔
          </button>
        )}
      </div>

      {/* Barra de Pesquisa */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          id="input-busca-veiculo"
          placeholder="Pesquisar por placa (ex: BRA2E19), modelo, marca ou cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 transition text-sm shadow-inner"
        />
      </div>

      {/* Listagem de Veículos */}
      {loading ? (
        <div className="p-8 text-center text-zinc-400 text-sm">Carregando veículos...</div>
      ) : veiculos.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <Car className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-300 font-medium text-base">Nenhum veículo encontrado.</p>
          <p className="text-zinc-500 text-xs mt-1">Cadastre o primeiro veículo vinculado a um cliente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {veiculos.map((v) => {
            const isDestacado = v.id === veiculoDestacadoId;
            return (
              <div
                key={v.id}
                className={`bg-zinc-900 border rounded-xl p-4 sm:p-5 flex flex-col justify-between transition shadow-sm ${
                  isDestacado
                    ? 'border-red-500 bg-red-950/20 ring-2 ring-red-500/40 shadow-lg shadow-red-950/50'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-red-400 font-mono font-bold text-sm tracking-wider inline-block mb-1">
                      {formatPlaca(v.placa)}
                    </span>
                    <h3 className="text-base font-bold text-white tracking-tight">{v.veiculo}</h3>
                    <p className="text-xs text-zinc-400 font-medium">{v.marca} • Ano {v.ano} • {v.cor}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => abrirModalEditar(v)}
                      title="Editar Veículo"
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => excluirVeiculo(v.id, v.placa)}
                        title="Excluir Veículo"
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-md transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-zinc-950/80 rounded-lg p-2.5 border border-zinc-800/80 space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Cliente / Proprietário:</span>
                    <span className="font-semibold text-zinc-200 truncate max-w-[170px]">{v.cliente_nome}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Quilometragem Atual:</span>
                    <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5" />
                      {v.quilometragem.toLocaleString('pt-BR')} km
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => abrirHistoricoVeiculo(v)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition border border-zinc-700"
                >
                  <Eye className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Histórico do Veículo</span>
                </button>
                {onNovaOSParaVeiculo && (
                  <button
                    onClick={() => onNovaOSParaVeiculo(v)}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-semibold rounded-lg transition border border-red-500/30"
                  >
                    <span>+ OS</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    )}

      {/* Modal Cadastro/Edição de Veículo */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-5">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-bold text-white">
                  {veiculoEditando ? 'Editar Dados do Veículo' : 'Novo Cadastro de Veículo'}
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {erroForm && (
              <div className="mb-4 p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{erroForm}</span>
              </div>
            )}

            {/* Dica Simples para o Usuário */}
            <div className="mb-4 p-3 bg-amber-950/30 border border-amber-900/40 rounded-xl text-xs flex items-start gap-2.5">
              <span className="text-amber-400 font-bold shrink-0">💡 Passo 2:</span>
              <span className="text-zinc-300">
                Selecione o <strong className="text-white">Proprietário</strong> na lista, digite a <strong className="text-white">Placa</strong> e o <strong className="text-white">Modelo</strong> do veículo. Opcional: preencha a quilometragem atual.
              </span>
            </div>

            <form onSubmit={salvarVeiculo} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Proprietário (Cliente) <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.cliente_id}
                  onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                >
                  <option value="">Selecione um cliente cadastrado...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} {c.cpf_cnpj ? `(${c.cpf_cnpj})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-zinc-400 font-medium">
                      Veículo (Modelo / Versão) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Busca e preenchimento automático da marca</span>
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      list="modelos-sugeridos-veiculos-view"
                      placeholder="Ex: Civic 2.0 EXL, Gol 1.6 MSI, Onix Plus..."
                      value={formData.veiculo}
                      onChange={(e) => handleModeloChange(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                    />
                    <datalist id="modelos-sugeridos-veiculos-view">
                      {CATALOGO_VEICULOS.slice(0, 100).map((c) => (
                        <option key={`view-${c.modelo}-${c.marca}`} value={c.modelo}>
                          {c.marca}
                        </option>
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-zinc-400 font-medium">
                      Marca / Montadora <span className="text-red-500">*</span>
                    </label>
                    {marcaDetectada && (
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-950/60 border border-emerald-800/80 px-1.5 py-0.5 rounded">
                        <Sparkles className="w-2.5 h-2.5" />
                        Automática
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Honda, Volkswagen, Toyota"
                    value={formData.marca}
                    onChange={(e) => {
                      setFormData({ ...formData, marca: e.target.value });
                      setMarcaEditadaManualmente(true);
                    }}
                    className={`w-full px-3 py-2 bg-zinc-950 border rounded-lg text-white focus:outline-none focus:border-red-500 ${
                      marcaDetectada && !marcaEditadaManualmente ? 'border-emerald-700/80 ring-1 ring-emerald-500/30' : 'border-zinc-800'
                    }`}
                  />
                  {marcaDetectada && !marcaEditadaManualmente && (
                    <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                      <span>✓ Montadora <strong>{marcaDetectada}</strong> detectada pelo modelo</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">
                    Placa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="BRA2E19 ou ABC-1234"
                    value={formData.placa}
                    onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Ano de Fabricação / Modelo</label>
                  <input
                    type="number"
                    min={1950}
                    max={2035}
                    value={formData.ano}
                    onChange={(e) => setFormData({ ...formData, ano: parseInt(e.target.value, 10) || 2020 })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Cor Predominante</label>
                  <input
                    type="text"
                    placeholder="Ex: Prata, Preto, Branco"
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-zinc-400 font-medium mb-1">
                    Quilometragem Atual (KM)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Ex: 48500"
                    value={formData.quilometragem}
                    onChange={(e) => setFormData({ ...formData, quilometragem: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-zinc-300 hover:text-white bg-zinc-800 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-semibold rounded-lg shadow-md transition disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : veiculoEditando ? 'Salvar Alterações' : 'Cadastrar Veículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Histórico do Veículo (Section 28) */}
      {detalheVeiculo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
              <div>
                <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">
                  Histórico Técnico do Veículo
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="px-2.5 py-1 bg-zinc-950 border border-zinc-700 rounded text-red-400 font-mono font-bold text-base">
                    {formatPlaca(detalheVeiculo.placa)}
                  </span>
                  <h2 className="text-xl font-bold text-white tracking-tight">{detalheVeiculo.veiculo}</h2>
                </div>
                <div className="text-xs text-zinc-400 mt-1">
                  {detalheVeiculo.marca} • Ano {detalheVeiculo.ano} • Cor {detalheVeiculo.cor} • Proprietário: <span className="text-zinc-200 font-semibold">{detalheVeiculo.cliente_nome}</span>
                </div>
              </div>
              <button
                onClick={() => setDetalheVeiculo(null)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-4 space-y-6">
              
              {/* Linha do Tempo de Quilometragem */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-emerald-400" />
                    Quilometragem Registrada
                  </span>
                  <span className="text-base font-mono font-bold text-emerald-400">
                    {detalheVeiculo.quilometragem.toLocaleString('pt-BR')} km
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  A quilometragem é sincronizada e atualizada automaticamente a cada Ordem de Serviço concluída para este veículo.
                </p>
              </div>

              {/* Lista de Ordens de Serviço do Veículo */}
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-red-500" />
                  <span>Ordens de Serviço deste Veículo ({osVeiculo.length})</span>
                </h3>

                {osVeiculo.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">Nenhuma Ordem de Serviço vinculada a este veículo.</p>
                ) : (
                  <div className="space-y-3">
                    {osVeiculo.map((os) => {
                      const badge = getStatusBadgeInfo(os.status);
                      return (
                        <div
                          key={os.id}
                          className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-zinc-700 transition"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white text-sm">{os.numero_formatado}</span>
                              <span className="text-zinc-500">•</span>
                              <span className="text-xs text-zinc-400">{formatDate(os.data)} às {os.hora}</span>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.bg} ${badge.text} border ${badge.border}`}
                              >
                                {os.status}
                              </span>
                            </div>

                            <div className="text-xs text-zinc-300 font-mono">
                              KM no atendimento: <span className="text-emerald-400 font-bold">{os.quilometragem.toLocaleString('pt-BR')} km</span>
                            </div>

                            <div className="text-xs text-zinc-400">
                              <span className="text-zinc-300 font-semibold">Reclamação:</span> {os.reclamacao_cliente}
                            </div>
                            <div className="text-xs text-zinc-400 line-clamp-1">
                              <span className="text-zinc-300 font-semibold">Serviços:</span> {os.itens.map(i => i.descricao).join(', ')}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="text-right">
                              <div className="text-xs text-zinc-400">Total</div>
                              <div className="text-sm font-bold font-mono text-zinc-100">{formatCurrency(os.total)}</div>
                            </div>
                            <button
                              onClick={() => {
                                setDetalheVeiculo(null);
                                onVisualizarOS(os);
                              }}
                              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition border border-zinc-700 flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Ver OS</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setDetalheVeiculo(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

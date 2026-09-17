import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Car,
  FileText,
  MapPin,
  Clock,
  Eye,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Cliente, Veiculo, OrdemServico } from '../types';
import {
  ClienteRepository,
  VeiculoRepository,
  OrdemServicoRepository,
} from '../services/dbRepository';
import {
  formatCpfCnpj,
  formatPhone,
  formatCurrency,
  formatDate,
  getStatusBadgeInfo,
  formatPlaca,
} from '../utils/formatters';
import { consultarCep, formatarCep } from '../utils/cep';
import { useAuth } from '../context/AuthContext';

interface ClientesViewProps {
  onVisualizarOS: (os: OrdemServico) => void;
  onNovaOSParaCliente?: (cliente: Cliente) => void;
  onAbrirTour?: (etapa?: number) => void;
  clienteInicial?: Cliente | null;
  onLimparClienteInicial?: () => void;
}

export const ClientesView: React.FC<ClientesViewProps> = ({
  onVisualizarOS,
  onNovaOSParaCliente,
  onAbrirTour,
  clienteInicial,
  onLimparClienteInicial,
}) => {
  const { isAdmin } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [clienteDestacadoId, setClienteDestacadoId] = useState<string | null>(null);

  // Modal de Cadastro/Edição
  const [modalOpen, setModalOpen] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cpf_cnpj: '',
    telefone: '',
    whatsapp: '',
    email: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  });
  const [erroForm, setErroForm] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);

  const handleBuscarCep = async (cepParaBuscar?: string) => {
    const cepAlvo = cepParaBuscar || formData.cep;
    setErroForm('');
    try {
      setBuscandoCep(true);
      const endereco = await consultarCep(cepAlvo);
      setFormData((prev) => ({
        ...prev,
        cep: endereco.cep,
        logradouro: endereco.logradouro || prev.logradouro,
        bairro: endereco.bairro || prev.bairro,
        cidade: endereco.cidade || prev.cidade,
        estado: endereco.estado || prev.estado,
      }));
    } catch (err: any) {
      setErroForm(err.message || 'Erro ao consultar o CEP do cliente.');
    } finally {
      setBuscandoCep(false);
    }
  };

  // Modal de Detalhes / Histórico do Cliente (Section 29)
  const [detalheCliente, setDetalheCliente] = useState<Cliente | null>(null);
  const [veiculosCliente, setVeiculosCliente] = useState<Veiculo[]>([]);
  const [osCliente, setOsCliente] = useState<OrdemServico[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);

  useEffect(() => {
    carregarClientes();
  }, [search]);

  // Ao navegar via Busca Global para um cliente específico
  useEffect(() => {
    if (clienteInicial) {
      setClienteDestacadoId(clienteInicial.id);
      setSearch(clienteInicial.nome);
      abrirHistorico(clienteInicial);
      onLimparClienteInicial?.();
    }
  }, [clienteInicial]);

  const carregarClientes = async () => {
    setLoading(true);
    try {
      const list = await ClienteRepository.getAll(search);
      setClientes(list);
    } catch (err) {
      console.error('Erro ao listar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalNovo = () => {
    setClienteEditando(null);
    setFormData({
      nome: '',
      cpf_cnpj: '',
      telefone: '',
      whatsapp: '',
      email: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
    });
    setErroForm('');
    setModalOpen(true);
  };

  const abrirModalEditar = (c: Cliente) => {
    setClienteEditando(c);
    setFormData({
      nome: c.nome,
      cpf_cnpj: c.cpf_cnpj || '',
      telefone: c.telefone || '',
      whatsapp: c.whatsapp || '',
      email: c.email || '',
      cep: c.cep || '',
      logradouro: c.logradouro || '',
      numero: c.numero || '',
      complemento: c.complemento || '',
      bairro: c.bairro || '',
      cidade: c.cidade || '',
      estado: c.estado || '',
    });
    setErroForm('');
    setModalOpen(true);
  };

  const salvarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      setErroForm('O nome do cliente é obrigatório.');
      return;
    }

    setSalvando(true);
    setErroForm('');
    try {
      if (clienteEditando) {
        await ClienteRepository.update(clienteEditando.id, formData);
      } else {
        await ClienteRepository.create(formData);
      }
      setModalOpen(false);
      carregarClientes();
    } catch (err: any) {
      setErroForm(err.message || 'Erro ao salvar cliente.');
    } finally {
      setSalvando(false);
    }
  };

  const excluirCliente = async (id: string, nome: string) => {
    if (!confirm(`Deseja realmente excluir o cadastro de "${nome}"? Esta ação não pode ser desfeita.`)) {
      return;
    }
    try {
      await ClienteRepository.delete(id);
      carregarClientes();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir cliente.');
    }
  };

  const abrirHistorico = async (c: Cliente) => {
    setDetalheCliente(c);
    setCarregandoHistorico(true);
    try {
      const [veics, ordens] = await Promise.all([
        VeiculoRepository.getByClienteId(c.id),
        OrdemServicoRepository.getAll({ clienteId: c.id }),
      ]);
      setVeiculosCliente(veics);
      setOsCliente(ordens);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
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
            <Users className="w-6 h-6 text-red-500" />
            <span>Cadastro e Gestão de Clientes</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Base de clientes com histórico de veículos e ordens de serviço.
          </p>
        </div>

        <button
          id="btn-novo-cliente"
          onClick={abrirModalNovo}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-lg text-sm font-semibold shadow-md shadow-red-950 transition border border-red-500"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Banner Orientativo do 1º Passo do Roteiro */}
      <div className="bg-gradient-to-r from-blue-950/40 via-zinc-900 to-zinc-900 border border-blue-900/60 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400 font-bold shrink-0 text-xs">
            1º
          </div>
          <div>
            <span className="font-bold text-blue-300 block sm:inline">1º Passo do Roteiro: Cadastrar o Cliente. </span>
            <span className="text-zinc-300">
              Clique em <strong className="text-white">"Novo Cliente"</strong> para preencher o Nome e WhatsApp. Dica: digite o CEP que Rua, Bairro e Cidade preenchem sozinhos!
            </span>
          </div>
        </div>
        {onAbrirTour && (
          <button
            onClick={() => onAbrirTour(1)}
            className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 shrink-0 text-left sm:text-right"
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
          id="input-busca-cliente"
          placeholder="Pesquisar por nome, CPF/CNPJ ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 transition text-sm shadow-inner"
        />
      </div>

      {/* Listagem de Clientes */}
      {loading ? (
        <div className="p-8 text-center text-zinc-400 text-sm">Carregando clientes...</div>
      ) : clientes.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-300 font-medium text-base">Nenhum cliente encontrado.</p>
          <p className="text-zinc-500 text-xs mt-1">Cadastre o primeiro cliente da oficina clicando no botão acima.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientes.map((c) => {
            const isDestacado = c.id === clienteDestacadoId;
            return (
              <div
                key={c.id}
                className={`bg-zinc-900 border rounded-xl p-4 sm:p-5 flex flex-col justify-between transition shadow-sm ${
                  isDestacado
                    ? 'border-red-500 bg-red-950/20 ring-2 ring-red-500/40 shadow-lg shadow-red-950/50'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">{c.nome}</h3>
                    {c.cpf_cnpj && (
                      <span className="text-xs font-mono text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 mt-1 inline-block">
                        {formatCpfCnpj(c.cpf_cnpj)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => abrirModalEditar(c)}
                      title="Editar Cliente"
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => excluirCliente(c.id, c.nome)}
                        title="Excluir Cliente"
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-md transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-xs text-zinc-400">
                  {c.telefone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{formatPhone(c.telefone)}</span>
                    </div>
                  )}
                  {c.whatsapp && (
                    <div className="flex items-center gap-2 text-emerald-400">
                      <span className="font-semibold text-[10px] bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                        WhatsApp
                      </span>
                      <span>{formatPhone(c.whatsapp)}</span>
                    </div>
                  )}
                  {c.cidade && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                      <span>
                        {c.cidade}
                        {c.estado ? ` - ${c.estado}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => abrirHistorico(c)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition border border-zinc-700"
                >
                  <Eye className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Histórico do Cliente</span>
                </button>
                {onNovaOSParaCliente && (
                  <button
                    onClick={() => onNovaOSParaCliente(c)}
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

      {/* Modal de Cadastro / Edição de Cliente */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-5">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-bold text-white">
                  {clienteEditando ? 'Editar Dados do Cliente' : 'Novo Cadastro de Cliente'}
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
            <div className="mb-4 p-3 bg-blue-950/30 border border-blue-900/40 rounded-xl text-xs flex items-start gap-2.5">
              <span className="text-blue-400 font-bold shrink-0">💡 Passo 1:</span>
              <span className="text-zinc-300">
                Preencha pelo menos o <strong className="text-white">Nome</strong> e o <strong className="text-white">WhatsApp</strong>. Ao digitar os 8 dígitos do <strong className="text-white">CEP</strong>, o sistema busca o endereço na hora!
              </span>
            </div>

            <form onSubmit={salvarCliente} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-zinc-300 font-semibold mb-1">
                    Nome Completo / Razão Social <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Alberto da Silva ou Mecânica Express Ltda"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">CPF ou CNPJ</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00 ou 00.000.000/0001-00"
                    value={formData.cpf_cnpj}
                    onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="cliente@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Telefone Principal</label>
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">WhatsApp (para envio de OS)</label>
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="pt-2 border-t border-zinc-800/80">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-3">
                  Endereço do Cliente
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-400 font-medium mb-1">CEP</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="00000-000"
                        maxLength={9}
                        value={formData.cep}
                        onChange={(e) => {
                          const formatado = formatarCep(e.target.value);
                          setFormData({ ...formData, cep: formatado });
                          if (formatado.replace(/\D/g, '').length === 8) {
                            handleBuscarCep(formatado);
                          }
                        }}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500 font-mono text-xs sm:text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleBuscarCep()}
                        disabled={buscandoCep}
                        title="Buscar endereço nos Correios pelo CEP"
                        className="px-2.5 py-2 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-200 rounded-lg border border-zinc-700 transition flex items-center justify-center shrink-0 disabled:opacity-50"
                      >
                        {buscandoCep ? (
                          <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4 text-zinc-300" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-zinc-400 font-medium mb-1">Logradouro / Rua</label>
                    <input
                      type="text"
                      placeholder="Avenida Brasil"
                      value={formData.logradouro}
                      onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-medium mb-1">Número</label>
                    <input
                      type="text"
                      placeholder="120"
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-medium mb-1">Complemento</label>
                    <input
                      type="text"
                      placeholder="Apto 44, Bloco B"
                      value={formData.complemento}
                      onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-medium mb-1">Bairro</label>
                    <input
                      type="text"
                      placeholder="Centro"
                      value={formData.bairro}
                      onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-zinc-400 font-medium mb-1">Cidade</label>
                    <input
                      type="text"
                      placeholder="São Paulo"
                      value={formData.cidade}
                      onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-medium mb-1">UF (Estado)</label>
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="SP"
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500 font-mono uppercase"
                    />
                  </div>
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
                  {salvando ? 'Salvando...' : clienteEditando ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Histórico do Cliente (Section 29) */}
      {detalheCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
              <div>
                <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">
                  Histórico Completo do Cliente
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight">{detalheCliente.nome}</h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1">
                  {detalheCliente.cpf_cnpj && <span>CPF/CNPJ: {formatCpfCnpj(detalheCliente.cpf_cnpj)}</span>}
                  {detalheCliente.telefone && <span>Tel: {formatPhone(detalheCliente.telefone)}</span>}
                  {detalheCliente.whatsapp && (
                    <span className="text-emerald-400 font-medium">WhatsApp: {formatPhone(detalheCliente.whatsapp)}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setDetalheCliente(null)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-4 space-y-6">
              {/* Veículos Vinculados */}
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <Car className="w-4 h-4 text-red-500" />
                  <span>Veículos Vinculados ({veiculosCliente.length})</span>
                </h3>

                {veiculosCliente.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">Nenhum veículo vinculado a este cliente.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {veiculosCliente.map((v) => (
                      <div key={v.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex justify-between items-center">
                        <div>
                          <div className="text-sm font-bold text-zinc-100">{v.veiculo}</div>
                          <div className="text-xs text-zinc-400">{v.marca} • {v.ano} • Cor {v.cor}</div>
                          <div className="text-[11px] text-zinc-400 mt-1">KM atual: {v.quilometragem.toLocaleString('pt-BR')} km</div>
                        </div>
                        <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-red-400 font-mono font-bold text-xs">
                          {formatPlaca(v.placa)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ordens de Serviço Anteriores */}
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-red-500" />
                  <span>Histórico de Ordens de Serviço ({osCliente.length})</span>
                </h3>

                {osCliente.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">Nenhuma Ordem de Serviço emitida para este cliente ainda.</p>
                ) : (
                  <div className="space-y-3">
                    {osCliente.map((os) => {
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
                            <div className="text-xs text-zinc-300">
                              Veículo: <span className="font-semibold text-white">{os.veiculo_modelo}</span> ({formatPlaca(os.veiculo_placa)}) • KM na OS: {os.quilometragem.toLocaleString('pt-BR')} km
                            </div>
                            <div className="text-xs text-zinc-400 line-clamp-1">
                              Serviços: {os.itens.map(i => i.descricao).join(', ')}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="text-right">
                              <div className="text-xs text-zinc-400">Total</div>
                              <div className="text-sm font-bold font-mono text-zinc-100">{formatCurrency(os.total)}</div>
                            </div>
                            <button
                              onClick={() => {
                                setDetalheCliente(null);
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
                onClick={() => setDetalheCliente(null)}
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

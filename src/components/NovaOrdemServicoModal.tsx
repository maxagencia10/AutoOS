import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  AlertTriangle,
  FileText,
  User,
  Car,
  DollarSign,
  Gauge,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import {
  Cliente,
  Veiculo,
  OrdemServico,
  ItemOS,
  StatusOS,
  FormaPagamento,
  OficinaConfig,
} from '../types';
import {
  ClienteRepository,
  VeiculoRepository,
  OrdemServicoRepository,
  OficinaRepository,
} from '../services/dbRepository';
import {
  formatCurrency,
  formatPlaca,
  formatPhone,
  formatCpfCnpj,
} from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { ModalCadastroVeiculoRapido } from './ModalCadastroVeiculoRapido';
import { ModalCadastroClienteRapido } from './ModalCadastroClienteRapido';

interface NovaOrdemServicoModalProps {
  osParaEditar?: OrdemServico | null;
  clientePreselecionado?: Cliente | null;
  veiculoPreselecionado?: Veiculo | null;
  onClose: () => void;
  onSuccess: (os: OrdemServico) => void;
}

export const NovaOrdemServicoModal: React.FC<NovaOrdemServicoModalProps> = ({
  osParaEditar,
  clientePreselecionado,
  veiculoPreselecionado,
  onClose,
  onSuccess,
}) => {
  const { usuarioAtual, oficinaAtiva } = useAuth();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculosDisponiveis, setVeiculosDisponiveis] = useState<Veiculo[]>([]);
  const [oficina, setOficina] = useState<OficinaConfig | null>(null);

  // Estados do formulário da OS
  const [numeroFormatado, setNumeroFormatado] = useState('OS Nº ......');
  const [numeroSequencial, setNumeroSequencial] = useState(1);
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [hora, setHora] = useState(
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );

  const [clienteId, setClienteId] = useState('');
  const [modalNovoClienteOpen, setModalNovoClienteOpen] = useState(false);
  const [feedbackClienteCriado, setFeedbackClienteCriado] = useState<string | null>(null);
  const [veiculoId, setVeiculoId] = useState('');
  const [modalNovoVeiculoOpen, setModalNovoVeiculoOpen] = useState(false);
  const [feedbackVeiculoCriado, setFeedbackVeiculoCriado] = useState<string | null>(null);

  // Cliente e Veículo selecionados
  const clienteSelecionado = clientes.find((c) => c.id === clienteId) || null;
  const veiculoSelecionado = veiculosDisponiveis.find((v) => v.id === veiculoId) || null;

  // Quilometragem
  const [quilometragem, setQuilometragem] = useState<number>(0);
  const [kmAnterior, setKmAnterior] = useState<number>(0);
  const [confirmouKmMenor, setConfirmouKmMenor] = useState(false);
  const [alertaKmMenorAberto, setAlertaKmMenorAberto] = useState(false);

  // Problema e Avaliação Técnica
  const [reclamacaoCliente, setReclamacaoCliente] = useState('');
  const [diagnosticoAvaliacao, setDiagnosticoAvaliacao] = useState('');

  // Itens da OS
  const [itens, setItens] = useState<ItemOS[]>([
    {
      id: 'item_init_1',
      tipo: 'SERVICO',
      descricao: '',
      quantidade: 1,
      valor_unitario: 0,
      valor_total: 0,
    },
  ]);

  // Financeiro
  const [desconto, setDesconto] = useState<number>(0);
  const [acrescimo, setAcrescimo] = useState<number>(0);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('Pix');

  // Textos e status
  const [observacoes, setObservacoes] = useState('');
  const [garantia, setGarantia] = useState('');
  const [status, setStatus] = useState<StatusOS>('ABERTA');

  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Carrega dados iniciais
  useEffect(() => {
    carregarDependencias();
  }, []);

  const carregarDependencias = async () => {
    try {
      const [clis, ofi] = await Promise.all([
        ClienteRepository.getAll(),
        OficinaRepository.get(),
      ]);
      setClientes(clis);
      setOficina(ofi);

      if (osParaEditar) {
        // Modo Edição
        setNumeroFormatado(osParaEditar.numero_formatado);
        setNumeroSequencial(osParaEditar.numero);
        setData(osParaEditar.data);
        setHora(osParaEditar.hora);
        setClienteId(osParaEditar.cliente_id);
        setVeiculoId(osParaEditar.veiculo_id);
        setQuilometragem(osParaEditar.quilometragem);
        setKmAnterior(osParaEditar.quilometragem_anterior || 0);
        setReclamacaoCliente(osParaEditar.reclamacao_cliente);
        setDiagnosticoAvaliacao(osParaEditar.diagnostico_avaliacao || '');
        setItens(osParaEditar.itens);
        setDesconto(osParaEditar.desconto);
        setAcrescimo(osParaEditar.acrescimo);
        setFormaPagamento(osParaEditar.forma_pagamento);
        setObservacoes(osParaEditar.observacoes || '');
        setGarantia(osParaEditar.garantia || ofi.texto_padrao_garantia);
        setStatus(osParaEditar.status);

        // Carrega veículos do cliente da OS
        const veics = await VeiculoRepository.getByClienteId(osParaEditar.cliente_id);
        setVeiculosDisponiveis(veics);
      } else {
        // Modo Nova OS
        const proximo = await OrdemServicoRepository.getNextNumero();
        setNumeroFormatado(proximo.numero_formatado);
        setNumeroSequencial(proximo.numero);
        setGarantia(ofi.texto_padrao_garantia);

        if (clientePreselecionado) {
          setClienteId(clientePreselecionado.id);
          const veics = await VeiculoRepository.getByClienteId(clientePreselecionado.id);
          setVeiculosDisponiveis(veics);

          if (veiculoPreselecionado) {
            setVeiculoId(veiculoPreselecionado.id);
            setQuilometragem(veiculoPreselecionado.quilometragem);
            setKmAnterior(veiculoPreselecionado.quilometragem);
          } else if (veics.length > 0) {
            setVeiculoId(veics[0].id);
            setQuilometragem(veics[0].quilometragem);
            setKmAnterior(veics[0].quilometragem);
          }
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados da OS:', err);
    }
  };

  // Ao mudar o cliente, busca os veículos vinculados
  const handleClienteChange = async (cId: string) => {
    setClienteId(cId);
    setVeiculoId('');
    if (!cId) {
      setVeiculosDisponiveis([]);
      return;
    }
    try {
      const veics = await VeiculoRepository.getByClienteId(cId);
      setVeiculosDisponiveis(veics);
      if (veics.length > 0) {
        setVeiculoId(veics[0].id);
        setQuilometragem(veics[0].quilometragem);
        setKmAnterior(veics[0].quilometragem);
      }
    } catch (err) {
      console.error('Erro ao buscar veículos do cliente:', err);
    }
  };

  // Ao mudar o veículo selecionado, preenche a KM anterior
  const handleVeiculoChange = (vId: string) => {
    setVeiculoId(vId);
    const veic = veiculosDisponiveis.find((v) => v.id === vId);
    if (veic) {
      setKmAnterior(veic.quilometragem);
      if (quilometragem === 0 || !osParaEditar) {
        setQuilometragem(veic.quilometragem);
      }
    }
  };

  const handleClienteSelectChange = (cId: string) => {
    if (cId === '__CADASTRAR_NOVO_CLIENTE__') {
      setModalNovoClienteOpen(true);
      return;
    }
    handleClienteChange(cId);
  };

  const handleClienteCadastrado = (novoCliente: Cliente) => {
    setClientes((prev) => {
      const existe = prev.some((c) => c.id === novoCliente.id);
      if (existe) return prev.map((c) => (c.id === novoCliente.id ? novoCliente : c));
      return [...prev, novoCliente];
    });
    setClienteId(novoCliente.id);
    setVeiculoId('');
    setVeiculosDisponiveis([]);
    setFeedbackClienteCriado(
      `Cliente "${novoCliente.nome}" cadastrado e selecionado com sucesso!`
    );
    setTimeout(() => {
      setFeedbackClienteCriado(null);
    }, 6000);
  };

  const handleVeiculoSelectChange = (vId: string) => {
    if (vId === '__CADASTRAR_NOVO_VEICULO__') {
      setModalNovoVeiculoOpen(true);
      return;
    }
    handleVeiculoChange(vId);
  };

  const handleNovoVeiculoCadastrado = (novoVeiculo: Veiculo) => {
    setVeiculosDisponiveis((prev) => {
      const existe = prev.some((v) => v.id === novoVeiculo.id);
      if (existe) return prev.map((v) => (v.id === novoVeiculo.id ? novoVeiculo : v));
      return [...prev, novoVeiculo];
    });
    setVeiculoId(novoVeiculo.id);
    setKmAnterior(novoVeiculo.quilometragem);
    setQuilometragem(novoVeiculo.quilometragem);
    setFeedbackVeiculoCriado(
      `Veículo ${novoVeiculo.marca} ${novoVeiculo.veiculo} (${formatPlaca(novoVeiculo.placa)}) cadastrado e selecionado com sucesso!`
    );
    setTimeout(() => {
      setFeedbackVeiculoCriado(null);
    }, 6000);
  };

  // Gerenciamento dinâmico de itens
  const addItem = () => {
    setItens([
      ...itens,
      {
        id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        tipo: 'SERVICO',
        descricao: '',
        quantidade: 1,
        valor_unitario: 0,
        valor_total: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (itens.length <= 1) {
      setItens([
        {
          id: 'item_' + Date.now(),
          tipo: 'SERVICO',
          descricao: '',
          quantidade: 1,
          valor_unitario: 0,
          valor_total: 0,
        },
      ]);
      return;
    }
    setItens(itens.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ItemOS, value: any) => {
    const updated = [...itens];
    const item = { ...updated[index], [field]: value };

    if (field === 'quantidade' || field === 'valor_unitario') {
      const qtd = field === 'quantidade' ? Number(value) : item.quantidade;
      const unit = field === 'valor_unitario' ? Number(value) : item.valor_unitario;
      item.valor_total = Math.max(0, qtd * unit);
    }

    updated[index] = item;
    setItens(updated);
  };

  // Cálculos financeiros automáticos (Section 15)
  const subtotal = itens.reduce((acc, it) => acc + (Number(it.quantidade) * Number(it.valor_unitario)), 0);
  const total = Math.max(0, subtotal - Number(desconto || 0) + Number(acrescimo || 0));

  // Validação e Salvamento
  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!clienteSelecionado) {
      setErro('Por favor, selecione o cliente da Ordem de Serviço.');
      return;
    }
    if (!veiculoSelecionado) {
      setErro('Por favor, selecione o veículo para atendimento.');
      return;
    }
    if (!reclamacaoCliente.trim()) {
      setErro('A reclamação do cliente é obrigatória.');
      return;
    }

    const itensValidos = itens.filter((i) => i.descricao.trim().length > 0);
    if (itensValidos.length === 0) {
      setErro('Adicione pelo menos 1 serviço ou peça com descrição.');
      return;
    }

    // Regra da Quilometragem (Section 8)
    if (kmAnterior > 0 && Number(quilometragem) < kmAnterior && !confirmouKmMenor) {
      setAlertaKmMenorAberto(true);
      return;
    }

    setSalvando(true);
    try {
      const osPayload = {
        oficina_id: oficinaAtiva?.id || 'oficina_matriz',
        numero: numeroSequencial,
        numero_formatado: numeroFormatado,
        data,
        hora,
        cliente_id: clienteSelecionado.id,
        veiculo_id: veiculoSelecionado.id,
        cliente_nome: clienteSelecionado.nome,
        cliente_cpf_cnpj: clienteSelecionado.cpf_cnpj || '',
        cliente_telefone: clienteSelecionado.telefone || '',
        cliente_whatsapp: clienteSelecionado.whatsapp || '',
        cliente_email: clienteSelecionado.email || '',
        cliente_endereco: `${clienteSelecionado.logradouro || ''}, ${clienteSelecionado.numero || ''} ${clienteSelecionado.bairro ? '- ' + clienteSelecionado.bairro : ''} ${clienteSelecionado.cidade ? '- ' + clienteSelecionado.cidade + '/' + clienteSelecionado.estado : ''}`.trim(),
        cliente_cep: clienteSelecionado.cep || '',
        veiculo_modelo: veiculoSelecionado.veiculo,
        veiculo_marca: veiculoSelecionado.marca,
        veiculo_ano: veiculoSelecionado.ano,
        veiculo_cor: veiculoSelecionado.cor,
        veiculo_placa: veiculoSelecionado.placa,
        quilometragem: Number(quilometragem) || 0,
        quilometragem_anterior: kmAnterior,
        reclamacao_cliente: reclamacaoCliente.trim(),
        diagnostico_avaliacao: diagnosticoAvaliacao.trim(),
        itens: itensValidos.map((it) => ({
          ...it,
          quantidade: Number(it.quantidade),
          valor_unitario: Number(it.valor_unitario),
          valor_total: Number(it.quantidade) * Number(it.valor_unitario),
        })),
        subtotal,
        desconto: Number(desconto) || 0,
        acrescimo: Number(acrescimo) || 0,
        total,
        forma_pagamento: formaPagamento,
        observacoes: observacoes.trim(),
        garantia: garantia.trim(),
        status,
        usuario_responsavel_id: usuarioAtual?.id || 'user_admin',
        usuario_responsavel_nome: usuarioAtual?.nome || 'Administrador',
      };

      let osSalva: OrdemServico;
      if (osParaEditar) {
        osSalva = await OrdemServicoRepository.update(osParaEditar.id, osPayload);
      } else {
        osSalva = await OrdemServicoRepository.create(osPayload);
      }

      onSuccess(osSalva);
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar Ordem de Serviço.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-1.5 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-5xl w-full p-3 sm:p-6 shadow-2xl relative my-auto sm:my-6 max-h-[96dvh] sm:max-h-[94vh] flex flex-col">
        
        {/* Cabeçalho do Modal */}
        <div className="flex items-start sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800 shrink-0">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 mt-0.5 sm:mt-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-bold text-white tracking-tight">
                  {osParaEditar ? 'Editar Ordem de Serviço' : 'Abertura de Ordem de Serviço'}
                </h2>
                <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-red-400 font-mono font-bold text-xs sm:text-sm">
                  {numeroFormatado}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400">
                Preencha os dados do cliente, veículo, diagnóstico e itens com cálculo automático.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition shrink-0 cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {erro && (
          <div className="my-3 p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* Formulário com Scroll Interno */}
        <form onSubmit={handleSalvar} className="overflow-y-auto flex-1 py-4 space-y-6 text-xs sm:text-sm pr-1">
          
          {/* Dica do Roteiro - Passo 3 */}
          <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-xl p-3 text-xs flex items-start gap-2.5">
            <span className="text-emerald-400 font-bold shrink-0">💡 Passo 3:</span>
            <span className="text-zinc-300">
              1) Escolha o <strong className="text-white">Cliente</strong> e o <strong className="text-white">Veículo</strong> ➔ 2) Descreva o <strong className="text-white">Defeito</strong> do carro ➔ 3) Adicione os <strong className="text-white">Serviços e Peças</strong> com valores ➔ 4) Clique em <strong className="text-white">"Salvar e Emitir OS"</strong> para imprimir ou enviar no WhatsApp!
            </span>
          </div>

          {/* Data, Hora e Status */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800/80">
            <div>
              <label className="block text-zinc-400 font-medium mb-1">Data de Abertura</label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-medium mb-1">Hora</label>
              <input
                type="text"
                required
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-medium mb-1">Status da OS</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusOS)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500 font-semibold"
              >
                <option value="ABERTA">ABERTA</option>
                <option value="AGUARDANDO APROVAÇÃO">AGUARDANDO APROVAÇÃO</option>
                <option value="APROVADA">APROVADA</option>
                <option value="EM EXECUÇÃO">EM EXECUÇÃO</option>
                <option value="CONCLUÍDA">CONCLUÍDA</option>
                <option value="ENTREGUE">ENTREGUE</option>
                <option value="CANCELADA">CANCELADA</option>
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 font-medium mb-1">Mecânico / Técnico</label>
              <input
                type="text"
                disabled
                value={usuarioAtual?.nome || 'Administrador'}
                className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded-lg text-zinc-300 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Seleção do Cliente e Seleção do Veículo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Bloco Cliente (Section 11) */}
            <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-200 font-bold">
                  <User className="w-4 h-4 text-red-500" />
                  <span>Identificação do Cliente</span>
                </div>
                <button
                  type="button"
                  onClick={() => setModalNovoClienteOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-500/40 rounded-lg text-xs font-semibold transition shadow-sm"
                  title="Cadastrar novo cliente imediatamente"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Cliente</span>
                </button>
              </div>

              {/* Feedback visual de cliente recém-cadastrado */}
              {feedbackClienteCriado && (
                <div className="p-2.5 bg-emerald-950/80 border border-emerald-800 rounded-lg text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{feedbackClienteCriado}</span>
                </div>
              )}

              <div>
                <label className="block text-zinc-400 font-medium mb-1">
                  Selecionar Cliente <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={clienteId}
                  onChange={(e) => handleClienteSelectChange(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                >
                  <option value="">
                    {clientes.length === 0 ? 'Nenhum cliente cadastrado...' : 'Selecione um cliente...'}
                  </option>
                  <option value="__CADASTRAR_NOVO_CLIENTE__" className="text-red-400 font-bold bg-zinc-800">
                    + Cadastrar Novo Cliente...
                  </option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} {c.cpf_cnpj ? `(${c.cpf_cnpj})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {clientes.length === 0 && (
                <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-3.5 space-y-2.5 animate-in fade-in">
                  <div className="flex items-start gap-2.5 text-amber-300 font-semibold text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div>Nenhum cliente cadastrado no sistema</div>
                      <p className="text-zinc-400 font-normal mt-0.5 text-xs leading-relaxed">
                        O sistema acabou de ser instalado ou ainda não possui clientes cadastrados. Clique no botão abaixo para cadastrar o primeiro cliente e vincular a esta OS.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalNovoClienteOpen(true)}
                    className="w-full py-2 px-3 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold rounded-lg transition flex items-center justify-center gap-2 text-xs shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Cadastrar Primeiro Cliente Agora</span>
                  </button>
                </div>
              )}

              {clienteSelecionado && (
                <div className="bg-zinc-900/80 rounded-lg p-3 border border-zinc-800 text-xs space-y-1">
                  <div className="text-zinc-200 font-semibold">{clienteSelecionado.nome}</div>
                  <div className="text-zinc-400">CPF/CNPJ: {formatCpfCnpj(clienteSelecionado.cpf_cnpj)}</div>
                  <div className="text-zinc-400">Tel: {formatPhone(clienteSelecionado.telefone)} | WhatsApp: {formatPhone(clienteSelecionado.whatsapp)}</div>
                  {clienteSelecionado.logradouro && (
                    <div className="text-zinc-400 truncate">
                      {clienteSelecionado.logradouro}, {clienteSelecionado.numero} - {clienteSelecionado.cidade}/{clienteSelecionado.estado}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bloco Veículo e Quilometragem (Section 8 e 12) */}
            <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-200 font-bold">
                  <Car className="w-4 h-4 text-red-500" />
                  <span>Identificação do Veículo</span>
                </div>
                {clienteSelecionado && (
                  <button
                    type="button"
                    onClick={() => setModalNovoVeiculoOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-500/40 rounded-lg text-xs font-semibold transition shadow-sm"
                    title="Cadastrar novo ou mais um veículo para este cliente"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Cadastrar Veículo</span>
                  </button>
                )}
              </div>

              {/* Feedback visual de veículo recém-cadastrado */}
              {feedbackVeiculoCriado && (
                <div className="p-2.5 bg-emerald-950/80 border border-emerald-800 rounded-lg text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{feedbackVeiculoCriado}</span>
                </div>
              )}

              {!clienteId ? (
                <div className="p-3 bg-zinc-900/60 border border-dashed border-zinc-800 rounded-lg text-xs text-zinc-500 flex items-center gap-2">
                  <Car className="w-4 h-4 text-zinc-600 shrink-0" />
                  <span>Selecione o cliente ao lado para carregar os veículos cadastrados ou registrar um novo veículo.</span>
                </div>
              ) : veiculosDisponiveis.length === 0 ? (
                /* Caso o cliente ainda não possua nenhum veículo cadastrado */
                <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-start gap-2.5 text-amber-300 font-semibold text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div>Nenhum veículo cadastrado para este cliente</div>
                      <p className="text-zinc-400 font-normal mt-0.5 text-xs">
                        O cliente <strong className="text-zinc-200">{clienteSelecionado?.nome}</strong> ainda não possui veículos vinculados.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalNovoVeiculoOpen(true)}
                    className="w-full py-2 px-3 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold rounded-lg transition flex items-center justify-center gap-2 text-xs shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Cadastrar Primeiro Veículo do Cliente</span>
                  </button>
                </div>
              ) : (
                /* Caso o cliente já tenha veículos cadastrados */
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-zinc-400 font-medium text-xs">
                        Selecionar Veículo do Cliente <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setModalNovoVeiculoOpen(true)}
                        className="text-red-400 hover:text-red-300 font-medium text-[11px] flex items-center gap-1 hover:underline underline-offset-2"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Novo ou mais um veículo?</span>
                      </button>
                    </div>
                    <select
                      required
                      value={veiculoId}
                      onChange={(e) => handleVeiculoSelectChange(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="">Selecione um veículo cadastrado...</option>
                      {veiculosDisponiveis.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.veiculo} ({formatPlaca(v.placa)}) - {v.marca} {v.ano}
                        </option>
                      ))}
                      <option value="__CADASTRAR_NOVO_VEICULO__" className="text-red-400 font-bold bg-zinc-900">
                        ➕ + Cadastrar Novo / Mais um Veículo...
                      </option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 px-0.5">
                    <span>
                      {veiculosDisponiveis.length} {veiculosDisponiveis.length === 1 ? 'veículo registrado' : 'veículos registrados'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setModalNovoVeiculoOpen(true)}
                      className="text-zinc-400 hover:text-zinc-200 underline underline-offset-2 transition"
                    >
                      + Cadastrar outro carro
                    </button>
                  </div>
                </div>
              )}

              {veiculoSelecionado && (
                <div className="space-y-3">
                  <div className="bg-zinc-900/80 rounded-lg p-3 border border-zinc-800 text-xs flex justify-between items-center">
                    <div>
                      <div className="text-zinc-200 font-semibold">{veiculoSelecionado.veiculo}</div>
                      <div className="text-zinc-400">{veiculoSelecionado.marca} • {veiculoSelecionado.ano} • {veiculoSelecionado.cor}</div>
                    </div>
                    <span className="px-2.5 py-1 bg-zinc-950 border border-zinc-700 rounded text-red-400 font-mono font-bold text-xs">
                      {formatPlaca(veiculoSelecionado.placa)}
                    </span>
                  </div>

                  {/* Controle de Quilometragem (Section 8) */}
                  <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-zinc-400" />
                        Última KM Registrada:
                      </span>
                      <span className="font-mono font-bold text-zinc-300">
                        {kmAnterior.toLocaleString('pt-BR')} km
                      </span>
                    </div>

                    <div>
                      <label className="block text-zinc-300 font-semibold text-xs mb-1">
                        Quilometragem Atual desta OS <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={quilometragem}
                        onChange={(e) => {
                          setQuilometragem(parseInt(e.target.value, 10) || 0);
                          setConfirmouKmMenor(false);
                        }}
                        className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-emerald-400 font-mono font-bold text-sm focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Reclamação do Cliente & Diagnóstico Técnico (Section 13) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-300 font-bold mb-1.5 flex items-center gap-1.5">
                <span>RECLAMAÇÃO DO CLIENTE</span>
                <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Descreva o problema exatamente como relatado pelo proprietário (ruídos, falhas, aquecimento, luzes no painel...)"
                value={reclamacaoCliente}
                onChange={(e) => setReclamacaoCliente(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-red-500 placeholder-zinc-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-bold mb-1.5 flex items-center gap-1.5">
                <span>DIAGNÓSTICO / AVALIAÇÃO TÉCNICA</span>
              </label>
              <textarea
                rows={3}
                placeholder="Laudo técnico da oficina: testes realizados, componentes danificados, medições e procedimentos recomendados..."
                value={diagnosticoAvaliacao}
                onChange={(e) => setDiagnosticoAvaliacao(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-red-500 placeholder-zinc-500"
              />
            </div>
          </div>

          {/* Tabela Dinâmica de Serviços e Peças (Section 14) */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-red-500" />
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  Serviços e Peças / Itens da OS
                </span>
              </div>
              <button
                type="button"
                id="btn-adicionar-item-os"
                onClick={addItem}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Adicionar Item</span>
              </button>
            </div>

            {/* Visualização de Itens da OS em Cards para Dispositivos Móveis */}
            <div className="md:hidden space-y-3">
              {itens.map((it, idx) => (
                <div key={it.id || idx} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase font-mono">
                        #{idx + 1}
                      </span>
                      <select
                        value={it.tipo}
                        onChange={(e) => updateItem(idx, 'tipo', e.target.value)}
                        className="px-2 py-1 bg-zinc-950 border border-zinc-700 rounded text-zinc-200 text-xs font-semibold focus:outline-none focus:border-red-500"
                      >
                        <option value="SERVICO">Serviço</option>
                        <option value="PECA">Peça</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {formatCurrency(Number(it.quantidade) * Number(it.valor_unitario))}
                      </span>
                      {itens.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="p-1.5 text-zinc-400 hover:text-red-400 active:text-red-300 hover:bg-zinc-800 rounded-lg transition"
                          title="Remover Item"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Descrição</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Troca de pastilhas de freio..."
                      value={it.descricao}
                      onChange={(e) => updateItem(idx, 'descricao', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Quantidade</label>
                      <input
                        type="number"
                        step="any"
                        min={0.1}
                        required
                        value={it.quantidade}
                        onChange={(e) => updateItem(idx, 'quantidade', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs text-center font-mono focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Valor Unitário (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        required
                        value={it.valor_unitario}
                        onChange={(e) => updateItem(idx, 'valor_unitario', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs text-right font-mono focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addItem}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-dashed border-zinc-700 hover:border-red-500 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5 text-red-400" />
                <span>+ Adicionar Outro Item à OS</span>
              </button>
            </div>

            {/* Visualização de Itens da OS em Tabela para Tablets e Computadores */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                  <tr>
                    <th className="px-3 py-2 w-28">Tipo</th>
                    <th className="px-3 py-2">Descrição do Serviço / Peça</th>
                    <th className="px-3 py-2 w-20 text-center">Qtd</th>
                    <th className="px-3 py-2 w-28 text-right">Unitário (R$)</th>
                    <th className="px-3 py-2 w-28 text-right">Total (R$)</th>
                    <th className="px-3 py-2 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {itens.map((it, idx) => (
                    <tr key={it.id || idx} className="hover:bg-zinc-900/40 transition">
                      <td className="px-3 py-2">
                        <select
                          value={it.tipo}
                          onChange={(e) => updateItem(idx, 'tipo', e.target.value)}
                          className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-200 text-xs focus:outline-none focus:border-red-500"
                        >
                          <option value="SERVICO">Serviço</option>
                          <option value="PECA">Peça</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          required
                          placeholder="Ex: Troca de pastilhas de freio dianteiras"
                          value={it.descricao}
                          onChange={(e) => updateItem(idx, 'descricao', e.target.value)}
                          className="w-full px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-100 text-xs focus:outline-none focus:border-red-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          step="any"
                          min={0.1}
                          required
                          value={it.quantidade}
                          onChange={(e) => updateItem(idx, 'quantidade', parseFloat(e.target.value) || 0)}
                          className="w-full text-center px-1.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-100 text-xs focus:outline-none focus:border-red-500 font-mono"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          required
                          value={it.valor_unitario}
                          onChange={(e) => updateItem(idx, 'valor_unitario', parseFloat(e.target.value) || 0)}
                          className="w-full text-right px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-100 text-xs focus:outline-none focus:border-red-500 font-mono"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-zinc-200">
                        {formatCurrency(Number(it.quantidade) * Number(it.valor_unitario))}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-zinc-500 hover:text-red-400 p-1 transition cursor-pointer"
                          title="Remover Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Resumo Financeiro da OS (Section 15) */}
            <div className="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div>
                  <label className="block text-zinc-400 text-[11px] font-medium mb-1">Desconto (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={desconto}
                    onChange={(e) => setDesconto(parseFloat(e.target.value) || 0)}
                    className="w-28 px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-200 text-xs font-mono focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-[11px] font-medium mb-1">Acréscimo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={acrescimo}
                    onChange={(e) => setAcrescimo(parseFloat(e.target.value) || 0)}
                    className="w-28 px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-200 text-xs font-mono focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-[11px] font-medium mb-1">Forma de Pagamento</label>
                  <select
                    value={formaPagamento}
                    onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)}
                    className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-200 text-xs focus:outline-none focus:border-red-500"
                  >
                    <option value="Pix">Pix</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão">Cartão</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Faturado">Faturado</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div className="text-right space-y-0.5">
                <div className="text-xs text-zinc-400">
                  Subtotal: <span className="font-mono text-zinc-300">{formatCurrency(subtotal)}</span>
                </div>
                {desconto > 0 && (
                  <div className="text-xs text-emerald-400">
                    Desconto: <span className="font-mono">-{formatCurrency(desconto)}</span>
                  </div>
                )}
                {acrescimo > 0 && (
                  <div className="text-xs text-amber-400">
                    Acréscimo: <span className="font-mono">+{formatCurrency(acrescimo)}</span>
                  </div>
                )}
                <div className="text-base sm:text-lg font-bold font-mono text-white flex items-center justify-end gap-2 pt-1 border-t border-zinc-800">
                  <span className="text-xs uppercase text-zinc-400 font-sans font-semibold">Total Geral:</span>
                  <span className="text-red-400">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Observações e Garantia */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 font-medium mb-1">Observações Internas / do Cliente</label>
              <textarea
                rows={2}
                placeholder="Observações complementares, estado de conservação, objetos deixados no veículo..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-medium mb-1">Termo de Garantia</label>
              <textarea
                rows={2}
                placeholder="Termo de garantia para esta OS..."
                value={garantia}
                onChange={(e) => setGarantia(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Rodapé e Ações Responsivas - Fixo e Sempre Visível */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-3 border-t border-zinc-800 shrink-0 sticky bottom-0 bg-zinc-900/98 backdrop-blur-md -mx-3 -mb-3 sm:-mx-6 sm:-mb-6 p-3 sm:p-5 rounded-b-2xl shadow-2xl z-20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded-lg font-medium transition text-center cursor-pointer text-xs sm:text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              id="btn-salvar-os"
              className="px-6 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-semibold rounded-lg shadow-lg shadow-red-950 transition border border-red-500 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
            >
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{salvando ? 'Salvando Ordem de Serviço...' : osParaEditar ? 'Atualizar Ordem de Serviço' : 'Salvar e Emitir OS'}</span>
            </button>
          </div>

        </form>

        {/* Modal de Confirmação de KM Menor (Section 8) */}
        {alertaKmMenorAberto && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4">
            <div className="bg-zinc-900 border border-amber-500/50 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-amber-400">
                <AlertTriangle className="w-7 h-7 shrink-0" />
                <h3 className="text-base font-bold text-white">Atenção: Conferência de Quilometragem</h3>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                A quilometragem informada (<strong className="text-white font-mono">{Number(quilometragem).toLocaleString('pt-BR')} km</strong>) é <span className="text-amber-400 font-bold">menor</span> que a última quilometragem registrada para este veículo (<strong className="text-white font-mono">{kmAnterior.toLocaleString('pt-BR')} km</strong>).
              </p>
              <p className="text-xs text-zinc-400 italic">
                Deseja continuar mesmo assim e registrar esta quilometragem na Ordem de Serviço?
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAlertaKmMenorAberto(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition"
                >
                  Corrigir Quilometragem
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmouKmMenor(true);
                    setAlertaKmMenorAberto(false);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow transition"
                >
                  Sim, Continuar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Cadastro Rápido de Cliente */}
        <ModalCadastroClienteRapido
          isOpen={modalNovoClienteOpen}
          onClose={() => setModalNovoClienteOpen(false)}
          onClienteCadastrado={handleClienteCadastrado}
        />

        {/* Modal de Cadastro Rápido de Veículo para o Cliente Selecionado */}
        {clienteSelecionado && (
          <ModalCadastroVeiculoRapido
            isOpen={modalNovoVeiculoOpen}
            onClose={() => setModalNovoVeiculoOpen(false)}
            cliente={clienteSelecionado}
            onVeiculoCadastrado={handleNovoVeiculoCadastrado}
          />
        )}

      </div>
    </div>
  );
};

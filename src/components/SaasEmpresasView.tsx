import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  FileText,
  ShieldCheck,
  ExternalLink,
  Search,
  Sparkles,
  ArrowRight,
  Database,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Key,
  Copy,
  Check,
  Share2,
  Send,
  Lock,
  RefreshCw,
  X,
} from 'lucide-react';
import { OficinaConfig, PlanoSaaS, StatusEmpresa, Usuario } from '../types';
import { OficinaRepository, OrdemServicoRepository, UsuarioRepository } from '../services/dbRepository';
import { useAuth } from '../context/AuthContext';

export const SaasEmpresasView: React.FC = () => {
  const { oficinasDisponiveis, oficinaAtiva, selecionarOficina, recarregarOficinas } = useAuth();
  const [empresas, setEmpresas] = useState<OficinaConfig[]>([]);
  const [filtro, setFiltro] = useState('');
  const [modalAberta, setModalAberta] = useState(false);
  const [empresaEdicao, setEmpresaEdicao] = useState<OficinaConfig | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Modal de Acesso / Envio de Credenciais
  const [modalAcessoAberta, setModalAcessoAberta] = useState(false);
  const [empresaAcesso, setEmpresaAcesso] = useState<OficinaConfig | null>(null);
  const [adminAcesso, setAdminAcesso] = useState<Usuario | null>(null);
  const [carregandoAcesso, setCarregandoAcesso] = useState(false);
  const [copiadoLink, setCopiadoLink] = useState(false);
  const [copiadoMsg, setCopiadoMsg] = useState(false);
  const [novaSenhaInput, setNovaSenhaInput] = useState('');
  const [editandoSenha, setEditandoSenha] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  // Formulário da Empresa
  const [nome, setNome] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('SP');
  const [plano, setPlano] = useState<PlanoSaaS>('PRO');
  const [statusEmpresa, setStatusEmpresa] = useState<StatusEmpresa>('ATIVA');
  const [limiteOS, setLimiteOS] = useState<number>(500);
  const [responsavelNome, setResponsavelNome] = useState('');
  const [responsavelContato, setResponsavelContato] = useState('');

  // Formulário do Administrador Inicial (para novas oficinas)
  const [adminNome, setAdminNome] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminSenha, setAdminSenha] = useState('');

  useEffect(() => {
    carregar();
  }, [oficinasDisponiveis]);

  const carregar = async () => {
    const list = await OficinaRepository.getAll();
    setEmpresas(list);
  };

  const abrirNova = () => {
    setEmpresaEdicao(null);
    setNome('');
    setRazaoSocial('');
    setCnpj('');
    setTelefone('');
    setWhatsapp('');
    setEmail('');
    setCidade('');
    setEstado('SP');
    setPlano('PRO');
    setStatusEmpresa('ATIVA');
    setLimiteOS(500);
    setResponsavelNome('');
    setResponsavelContato('');
    // Dados de acesso inicial
    setAdminNome('');
    setAdminEmail('');
    setAdminSenha('auto' + Math.floor(100 + Math.random() * 900));
    setModalAberta(true);
  };

  const abrirEditar = (emp: OficinaConfig) => {
    setEmpresaEdicao(emp);
    setNome(emp.nome);
    setRazaoSocial(emp.razao_social || '');
    setCnpj(emp.cnpj || '');
    setTelefone(emp.telefone || '');
    setWhatsapp(emp.whatsapp || '');
    setEmail(emp.email || '');
    setCidade(emp.cidade || '');
    setEstado(emp.estado || 'SP');
    setPlano(emp.plano || 'PRO');
    setStatusEmpresa(emp.status_empresa || 'ATIVA');
    setLimiteOS(emp.limite_os_mensal || 500);
    setResponsavelNome(emp.responsavel_nome || '');
    setResponsavelContato(emp.responsavel_contato || '');
    setModalAberta(true);
  };

  const abrirModalAcesso = async (emp: OficinaConfig, usuarioPredefinido?: Usuario | null) => {
    setEmpresaAcesso(emp);
    setCarregandoAcesso(true);
    setModalAcessoAberta(true);
    setCopiadoLink(false);
    setCopiadoMsg(false);
    setEditandoSenha(false);
    setNovaSenhaInput('');
    try {
      if (usuarioPredefinido) {
        setAdminAcesso(usuarioPredefinido);
      } else {
        const users = await UsuarioRepository.getByOficina(emp.id);
        const admin = users.find(u => u.perfil === 'ADMINISTRADOR') || users[0] || null;
        if (!admin) {
          const novo = await UsuarioRepository.create({
            oficina_id: emp.id,
            nome: emp.responsavel_nome || emp.nome,
            email: emp.email || `admin@${emp.id}.com`,
            senha: 'auto' + Math.floor(100 + Math.random() * 900),
            telefone: emp.responsavel_contato || emp.whatsapp || '',
            perfil: 'ADMINISTRADOR',
            ativo: true,
          });
          setAdminAcesso(novo);
        } else {
          setAdminAcesso(admin);
        }
      }
    } catch (e) {
      console.error('Erro ao carregar acesso:', e);
    } finally {
      setCarregandoAcesso(false);
    }
  };

  const montarTextoWhatsApp = (emp: OficinaConfig, user: Usuario | null, senhaCustom?: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://seu-autoos.vercel.app';
    const link = `${origin}/?oficina=${emp.id}`;
    const senhaUsar = senhaCustom || user?.senha || 'auto123';
    const emailUsar = user?.email || emp.email || 'Não configurado';
    const resp = emp.responsavel_nome ? `Olá, *${emp.responsavel_nome}*!` : 'Olá!';

    return (
      `🚗🔧 *ACESSO LIBERADO - AUTOOS OFICINAS*\n\n` +
      `${resp} O sistema de gestão e Ordem de Serviço da sua oficina *${emp.nome}* já está liberado e ativo no Plano *${emp.plano || 'PRO'}*!\n\n` +
      `🌐 *Link de Acesso Direto:*\n${link}\n\n` +
      `👤 *Seu E-mail / Usuário:* ${emailUsar}\n` +
      `🔑 *Sua Senha:* ${senhaUsar}\n\n` +
      `📋 *Como usar:*\n` +
      `1. Abra o link acima no seu celular ou computador.\n` +
      `2. O sistema abrirá diretamente o painel exclusivo da sua oficina.\n` +
      `3. Você já pode cadastrar clientes, veículos e emitir Ordens de Serviço completas com impressão A4 e envio no WhatsApp!\n\n` +
      `Qualquer dúvida estamos à disposição!`
    );
  };

  const handleCopiarLink = (empId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://seu-autoos.vercel.app';
    const link = `${origin}/?oficina=${empId}`;
    navigator.clipboard.writeText(link);
    setCopiadoLink(true);
    setTimeout(() => setCopiadoLink(false), 2500);
  };

  const handleCopiarMensagemCompleta = () => {
    if (!empresaAcesso) return;
    const msg = montarTextoWhatsApp(empresaAcesso, adminAcesso, novaSenhaInput || undefined);
    navigator.clipboard.writeText(msg);
    setCopiadoMsg(true);
    setTimeout(() => setCopiadoMsg(false), 2500);
  };

  const handleEnviarWhatsApp = () => {
    if (!empresaAcesso) return;
    const msg = montarTextoWhatsApp(empresaAcesso, adminAcesso, novaSenhaInput || undefined);
    let tel = (empresaAcesso.whatsapp || empresaAcesso.responsavel_contato || '').replace(/\D/g, '');
    if (tel && !tel.startsWith('55') && tel.length <= 11) {
      tel = '55' + tel;
    }
    const url = tel
      ? `https://api.whatsapp.com/send?phone=${tel}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleSalvarNovaSenha = async () => {
    if (!adminAcesso || !novaSenhaInput.trim()) return;
    setSalvandoSenha(true);
    try {
      await UsuarioRepository.update(adminAcesso.id, { senha: novaSenhaInput.trim() });
      setAdminAcesso({ ...adminAcesso, senha: novaSenhaInput.trim() });
      setEditandoSenha(false);
      alert('Senha atualizada com sucesso! Você já pode enviar o novo acesso via WhatsApp.');
    } catch (e: any) {
      alert(e.message || 'Erro ao atualizar senha.');
    } finally {
      setSalvandoSenha(false);
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      alert('Informe o Nome da Oficina / Empresa.');
      return;
    }
    setSalvando(true);
    try {
      if (empresaEdicao) {
        await OficinaRepository.update(
          {
            nome: nome.trim(),
            razao_social: razaoSocial.trim() || nome.trim(),
            nome_fantasia: nome.trim(),
            cnpj: cnpj.trim(),
            telefone: telefone.trim(),
            whatsapp: whatsapp.trim(),
            email: email.trim().toLowerCase(),
            cidade: cidade.trim(),
            estado: estado.trim(),
            plano,
            status_empresa: statusEmpresa,
            limite_os_mensal: Number(limiteOS),
            responsavel_nome: responsavelNome.trim(),
            responsavel_contato: responsavelContato.trim(),
          },
          empresaEdicao.id
        );
        await recarregarOficinas();
        await carregar();
        setModalAberta(false);
      } else {
        const { oficina: novaOficina, adminUser } = await OficinaRepository.createWithAdmin(
          {
            nome: nome.trim(),
            razao_social: razaoSocial.trim() || nome.trim(),
            nome_fantasia: nome.trim(),
            cnpj: cnpj.trim(),
            telefone: telefone.trim(),
            whatsapp: whatsapp.trim(),
            email: email.trim().toLowerCase(),
            cidade: cidade.trim(),
            estado: estado.trim(),
            plano,
            status_empresa: statusEmpresa,
            limite_os_mensal: Number(limiteOS),
            responsavel_nome: responsavelNome.trim(),
            responsavel_contato: responsavelContato.trim(),
          },
          {
            nome: adminNome.trim() || responsavelNome.trim() || nome.trim(),
            email: adminEmail.trim().toLowerCase() || email.trim().toLowerCase() || `admin@${Date.now()}.com`,
            senha: adminSenha.trim() || 'auto123',
            telefone: responsavelContato.trim() || whatsapp.trim(),
          }
        );
        await recarregarOficinas();
        await carregar();
        setModalAberta(false);
        // Abre imediatamente o modal para enviar o acesso ao cliente!
        abrirModalAcesso(novaOficina, adminUser);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar empresa.');
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id: string, nomeEmp: string) => {
    if (!confirm(`Tem certeza que deseja excluir permanentemente a empresa "${nomeEmp}" e todos os seus dados?`)) {
      return;
    }
    try {
      await OficinaRepository.delete(id);
      await recarregarOficinas();
      await carregar();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir empresa.');
    }
  };

  const filtradas = empresas.filter((e) => {
    const termo = filtro.toLowerCase();
    return (
      e.nome.toLowerCase().includes(termo) ||
      (e.cnpj && e.cnpj.includes(termo)) ||
      (e.cidade && e.cidade.toLowerCase().includes(termo))
    );
  });

  return (
    <div className="space-y-6">
      {/* Topo / Header da Gestão SaaS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-4 sm:p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-mono font-bold tracking-wider uppercase">
              Plataforma Micro-SaaS
            </span>
            <span className="text-xs text-zinc-500 font-mono">Multi-Tenant / PostgreSQL</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-red-500" />
            <span>Gestão de Empresas & Oficinas</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Gerencie cada cliente do seu Micro-SaaS. Cada oficina possui dados, clientes, OS e logo 100% isolados.
          </p>
        </div>

        <button
          onClick={abrirNova}
          id="btn-nova-empresa-saas"
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-red-950 transition border border-red-500 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Oficina</span>
        </button>
      </div>

      {/* Cards de Métricas SaaS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <div className="text-[11px] text-zinc-400 font-medium">Total de Oficinas</div>
          <div className="text-2xl font-bold text-white mt-1">{empresas.length}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <div className="text-[11px] text-emerald-400 font-medium">Empresas Ativas</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {empresas.filter(e => (e.status_empresa || 'ATIVA') === 'ATIVA').length}
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <div className="text-[11px] text-amber-400 font-medium">Em Teste (Trial)</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {empresas.filter(e => e.status_empresa === 'EM_TESTE').length}
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <div className="text-[11px] text-blue-400 font-medium">Oficina Conectada</div>
          <div className="text-xs font-bold text-blue-300 mt-2 truncate">
            {oficinaAtiva?.nome || 'Nenhuma'}
          </div>
        </div>
      </div>

      {/* Barra de Filtro */}
      <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
        <Search className="w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Buscar por nome da oficina, CNPJ ou cidade..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="bg-transparent text-xs sm:text-sm text-zinc-200 focus:outline-none w-full"
        />
      </div>

      {/* Lista de Empresas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtradas.map((emp) => {
          const isAtiva = oficinaAtiva?.id === emp.id;
          const status = emp.status_empresa || 'ATIVA';
          const planoNome = emp.plano || 'PRO';

          return (
            <div
              key={emp.id}
              className={`bg-zinc-900 border rounded-2xl p-5 flex flex-col justify-between transition relative overflow-hidden ${
                isAtiva ? 'border-red-500/60 ring-2 ring-red-500/20' : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {isAtiva && (
                <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-bl-lg font-mono">
                  ATIVA NO PAINEL
                </div>
              )}

              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-red-400 font-mono">
                      {emp.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight truncate max-w-[200px]">
                        {emp.nome}
                      </h3>
                      <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                        {emp.cnpj ? `CNPJ: ${emp.cnpj}` : 'CNPJ não informado'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-zinc-400">
                  {emp.cidade && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span>{emp.cidade} - {emp.estado || 'SP'}</span>
                    </div>
                  )}
                  {emp.whatsapp && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span>WhatsApp: {emp.whatsapp}</span>
                    </div>
                  )}
                  {emp.responsavel_nome && (
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span>Dono/Resp: {emp.responsavel_nome}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-2 pt-3 border-t border-zinc-800/80">
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                    Plano {planoNome}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    status === 'ATIVA'
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                      : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                  }`}>
                    {status}
                  </span>
                  <span className="text-[10px] text-zinc-500 ml-auto font-mono">
                    Até {emp.limite_os_mensal || 500} OS/mês
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => selecionarOficina(emp.id)}
                  title="Conectar a esta oficina e gerenciar seus dados agora"
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
                    isAtiva
                      ? 'bg-zinc-800 text-zinc-400 border-zinc-700 cursor-default'
                      : 'bg-red-600/15 hover:bg-red-600/25 text-red-300 border-red-500/40 hover:text-white'
                  }`}
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>{isAtiva ? 'Oficina Selecionada' : 'Acessar Oficina'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => abrirModalAcesso(emp)}
                    title="Enviar Acesso via WhatsApp / Copiar Link e Credenciais"
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 active:bg-emerald-800 text-emerald-400 hover:text-emerald-300 rounded-lg transition border border-emerald-800/80 text-xs font-bold cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Acesso</span>
                  </button>

                  <button
                    onClick={() => abrirEditar(emp)}
                    title="Editar Dados da Empresa e Plano"
                    className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition border border-zinc-700 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {empresas.length > 1 && (
                    <button
                      onClick={() => handleExcluir(emp.id, emp.nome)}
                      title="Excluir Empresa"
                      className="p-1.5 bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-400 rounded-lg transition border border-zinc-700 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Cadastro / Edição da Empresa */}
      {modalAberta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto sm:my-6 max-h-[94dvh] sm:max-h-[90vh] flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-red-500" />
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {empresaEdicao ? 'Editar Empresa / Oficina' : 'Cadastrar Nova Oficina (SaaS)'}
                </h2>
              </div>
              <button
                onClick={() => setModalAberta(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
                title="Fechar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvar} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Nome da Oficina / Nome Fantasia *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Impérios Car Mecânica Especializada"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Razão Social
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Impérios Car Ltda"
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    WhatsApp Comercial
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    placeholder="contato@oficina.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    placeholder="São Paulo"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Estado (UF)
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="SP"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value.toUpperCase())}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Plano Micro-SaaS
                  </label>
                  <select
                    value={plano}
                    onChange={(e) => setPlano(e.target.value as PlanoSaaS)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                  >
                    <option value="BRONZE">Plano Bronze (Até 100 OS/mês)</option>
                    <option value="PRATA">Plano Prata (Até 250 OS/mês)</option>
                    <option value="OURO">Plano Ouro (Até 500 OS/mês)</option>
                    <option value="PRO">Plano Pro (Até 1.000 OS/mês)</option>
                    <option value="ILIMITADO">Plano Ilimitado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Status da Assinatura
                  </label>
                  <select
                    value={statusEmpresa}
                    onChange={(e) => setStatusEmpresa(e.target.value as StatusEmpresa)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                  >
                    <option value="ATIVA">Ativa (Acesso Liberado)</option>
                    <option value="EM_TESTE">Em Teste Grátis (Trial)</option>
                    <option value="BLOQUEADA">Bloqueada (Inadimplente)</option>
                    <option value="CANCELADA">Cancelada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Dono / Responsável
                  </label>
                  <input
                    type="text"
                    placeholder="Nome do cliente/proprietário"
                    value={responsavelNome}
                    onChange={(e) => setResponsavelNome(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Contato do Responsável
                  </label>
                  <input
                    type="text"
                    placeholder="Celular ou E-mail pessoal"
                    value={responsavelContato}
                    onChange={(e) => setResponsavelContato(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                  />
                </div>

                {/* Seção de Credenciais de Acesso (apenas ao cadastrar nova oficina) */}
                {!empresaEdicao && (
                  <div className="sm:col-span-2 p-3.5 rounded-xl bg-zinc-950/80 border border-red-500/30 space-y-3 mt-2">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-red-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Acesso do Administrador desta Oficina
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-tight">
                      O sistema criará automaticamente o usuário administrador e gerará a mensagem com o link para envio no WhatsApp.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                          Nome do Administrador
                        </label>
                        <input
                          type="text"
                          placeholder={responsavelNome || 'Ex: João da Silva'}
                          value={adminNome}
                          onChange={(e) => setAdminNome(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-red-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                          E-mail de Login *
                        </label>
                        <input
                          type="email"
                          required={!empresaEdicao}
                          placeholder={email || 'login@oficina.com.br'}
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-red-500 focus:outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-zinc-300">
                            Senha de Acesso Inicial *
                          </label>
                          <button
                            type="button"
                            onClick={() => setAdminSenha('auto' + Math.floor(100 + Math.random() * 900))}
                            className="text-[10px] text-red-400 hover:text-red-300 cursor-pointer flex items-center gap-1 font-mono"
                          >
                            <RefreshCw className="w-3 h-3" /> Gerar Nova Senha
                          </button>
                        </div>
                        <input
                          type="text"
                          required={!empresaEdicao}
                          placeholder="Senha..."
                          value={adminSenha}
                          onChange={(e) => setAdminSenha(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold focus:border-red-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800 sticky bottom-0 bg-zinc-900/98 backdrop-blur-md z-10">
                <button
                  type="button"
                  onClick={() => setModalAberta(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-red-950 disabled:opacity-50 cursor-pointer"
                >
                  {salvando ? 'Salvando...' : empresaEdicao ? 'Salvar Empresa' : 'Salvar e Gerar Acesso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Compartilhamento / Envio de Acesso (WhatsApp e Link) */}
      {modalAcessoAberta && empresaAcesso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto sm:my-6 max-h-[94dvh] sm:max-h-[92vh] flex flex-col overflow-y-auto">
            
            {/* Topo do Modal de Acesso */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                    Acesso da Oficina: {empresaAcesso.nome}
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    Envie o acesso direto com 1 clique para o WhatsApp do cliente ou copie o link
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalAcessoAberta(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo das Credenciais */}
            <div className="space-y-3.5 text-xs">
              
              {/* Card do Link Direto de Acesso */}
              <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                    Link Direto com Auto-Conexão
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    Oficina ID: {empresaAcesso.id}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : 'https://seu-autoos.vercel.app'}/?oficina=${empresaAcesso.id}`}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono select-all focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopiarLink(empresaAcesso.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-zinc-200 rounded-lg border border-zinc-700 transition font-semibold cursor-pointer shrink-0"
                    title="Copiar Link"
                  >
                    {copiadoLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-300" />}
                    <span>{copiadoLink ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Card dos Dados do Usuário / Senha */}
              <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                    Credenciais do Administrador
                  </span>
                  {empresaAcesso.responsavel_nome && (
                    <span className="text-[11px] text-zinc-300 font-medium">
                      Resp: {empresaAcesso.responsavel_nome}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800/60">
                    <span className="text-[10px] text-zinc-500 block">Usuário / Login</span>
                    <span className="text-xs font-bold text-white font-mono break-all">
                      {adminAcesso?.email || empresaAcesso.email || 'Não configurado'}
                    </span>
                  </div>

                  <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Senha Atual</span>
                      <span className="text-xs font-bold text-emerald-400 font-mono">
                        {adminAcesso?.senha || 'auto123'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditandoSenha(!editandoSenha);
                        setNovaSenhaInput(adminAcesso?.senha || 'auto123');
                      }}
                      className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
                    >
                      {editandoSenha ? 'Cancelar' : 'Alterar'}
                    </button>
                  </div>
                </div>

                {/* Edição Rápida de Senha */}
                {editandoSenha && (
                  <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-700 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nova senha..."
                      value={novaSenhaInput}
                      onChange={(e) => setNovaSenhaInput(e.target.value)}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleSalvarNovaSenha}
                      disabled={salvandoSenha || !novaSenhaInput.trim()}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      {salvandoSenha ? 'Salvando...' : 'Salvar Senha'}
                    </button>
                  </div>
                )}
              </div>

              {/* Visualização da Mensagem Pré-Formatada do WhatsApp */}
              <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                    Mensagem Pronta para WhatsApp
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    Número: {empresaAcesso.whatsapp || empresaAcesso.responsavel_contato || 'Não informado'}
                  </span>
                </div>
                <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-lg p-2.5 text-[11px] text-zinc-300 font-sans whitespace-pre-line max-h-36 overflow-y-auto leading-relaxed border-l-2 border-l-emerald-500">
                  {montarTextoWhatsApp(empresaAcesso, adminAcesso, novaSenhaInput || undefined)}
                </div>
              </div>

            </div>

            {/* Ações Inferiores - Enviar WhatsApp ou Copiar Mensagem */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-zinc-800 sticky bottom-0 bg-zinc-900/98 backdrop-blur-md z-10 shrink-0">
              <button
                type="button"
                onClick={handleCopiarMensagemCompleta}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-zinc-200 rounded-xl text-xs font-semibold transition border border-zinc-700 cursor-pointer"
              >
                {copiadoMsg ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-300" />}
                <span>{copiadoMsg ? 'Mensagem Copiada!' : 'Copiar Texto'}</span>
              </button>

              <button
                type="button"
                onClick={handleEnviarWhatsApp}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-950 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Enviar no WhatsApp do Dono</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

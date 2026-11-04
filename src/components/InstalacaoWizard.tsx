import React, { useState } from 'react';
import {
  Wrench,
  ShieldCheck,
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  FileText,
  Search,
  Sparkles,
  AlertCircle,
  Database,
} from 'lucide-react';
import { SistemaRepository } from '../services/dbRepository';
import { useAuth } from '../context/AuthContext';
import { formatCpfCnpj, formatPhone, formatCep } from '../utils/formatters';

interface InstalacaoWizardProps {
  onInstalacaoConcluida?: () => void;
}

export const InstalacaoWizard: React.FC<InstalacaoWizardProps> = ({ onInstalacaoConcluida }) => {
  const { definirUsuarioAposInstalacao } = useAuth();

  const [etapa, setEtapa] = useState<1 | 2 | 3>(1);
  const [salvando, setSalvando] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erro, setErro] = useState<string>('');

  // Passo 1: Administrador
  const [admin, setAdmin] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    telefone: '',
  });

  // Passo 2: Oficina
  const [oficina, setOficina] = useState({
    nome: '',
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    telefone: '',
    whatsapp: '',
    email: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: 'SP',
    texto_padrao_garantia:
      'Garantia legal de 90 dias para peças aplicadas e serviços executados, conforme artigo 26 do Código de Defesa do Consumidor (CDC), com uso e manutenção preventiva adequados.',
    texto_padrao_condicoes:
      '• Veículo recebido em nossas dependências exclusivamente para diagnóstico e execução dos serviços autorizados.\n• Qualquer necessidade adicional ou substituição de peças constatada durante a desmontagem será previamente orçada e submetida à aprovação do cliente.\n• As peças substituídas ficam à disposição do cliente até a entrega do veículo.',
  });

  // Validação do Passo 1
  const validarPasso1 = (): boolean => {
    setErro('');
    if (!admin.nome.trim()) {
      setErro('Informe o nome completo do administrador.');
      return false;
    }
    if (!admin.email.trim() || !admin.email.includes('@')) {
      setErro('Informe um e-mail válido para o administrador.');
      return false;
    }
    if (!admin.senha || admin.senha.length < 4) {
      setErro('A senha do administrador deve conter pelo menos 4 caracteres.');
      return false;
    }
    if (admin.senha !== admin.confirmarSenha) {
      setErro('A confirmação de senha não confere.');
      return false;
    }
    return true;
  };

  // Validação do Passo 2
  const validarPasso2 = (): boolean => {
    setErro('');
    if (!oficina.nome.trim()) {
      setErro('Informe o nome da oficina / nome fantasia.');
      return false;
    }
    if (!oficina.telefone.trim() && !oficina.whatsapp.trim()) {
      setErro('Informe ao menos um telefone ou WhatsApp da oficina.');
      return false;
    }
    return true;
  };

  const avancarPasso1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (validarPasso1()) {
      // Pré-preenche o nome fantasia da oficina se estiver vazio
      if (!oficina.nome_fantasia && oficina.nome) {
        setOficina((prev) => ({ ...prev, nome_fantasia: prev.nome }));
      }
      setEtapa(2);
    }
  };

  const avancarPasso2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (validarPasso2()) {
      setEtapa(3);
    }
  };

  // Busca automática de endereço por CEP
  const buscarEnderecoCep = async () => {
    const cepLimpo = oficina.cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;

    setBuscandoCep(true);
    setErro('');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setOficina((prev) => ({
          ...prev,
          logradouro: data.logradouro || prev.logradouro,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado,
        }));
      }
    } catch {
      // Falha silenciosa
    } finally {
      setBuscandoCep(false);
    }
  };

  // Finalizar Instalação
  const concluirInstalacao = async () => {
    setSalvando(true);
    setErro('');
    try {
      const res = await SistemaRepository.instalar({
        admin: {
          nome: admin.nome,
          email: admin.email,
          senha: admin.senha,
        },
        oficina: {
          nome: oficina.nome,
          razao_social: oficina.razao_social || oficina.nome,
          nome_fantasia: oficina.nome_fantasia || oficina.nome,
          cnpj: oficina.cnpj,
          telefone: oficina.telefone,
          whatsapp: oficina.whatsapp,
          email: oficina.email,
          cep: oficina.cep,
          logradouro: oficina.logradouro,
          numero: oficina.numero,
          complemento: oficina.complemento,
          bairro: oficina.bairro,
          cidade: oficina.cidade,
          estado: oficina.estado,
          texto_padrao_garantia: oficina.texto_padrao_garantia,
          texto_padrao_condicoes: oficina.texto_padrao_condicoes,
        },
      });

      definirUsuarioAposInstalacao(res.adminUser);
      if (onInstalacaoConcluida) {
        onInstalacaoConcluida();
      }
    } catch (err: any) {
      console.error('Erro na instalação:', err);
      setErro('Falha ao concluir instalação: ' + (err.message || err));
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center px-4 py-10 font-sans antialiased">
      <div className="w-full max-w-3xl space-y-6">
        
        {/* Cabeçalho de Boas-Vindas */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 shadow-xl shadow-red-950 border border-red-500/30 mb-2">
            <Wrench className="w-7 h-7 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-white font-mono">
              AUTO<span className="text-red-500">OS</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950/80 text-red-400 border border-red-800/60">
              Instalação Limpa
            </span>
          </div>
          <p className="text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Bem-vindo à instalação inicial. Cadastre o usuário Administrador mestre e os dados oficiais da sua oficina mecânica para iniciar com o sistema 100% zerado e pronto para produção.
          </p>
        </div>

        {/* Indicador de Passos */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 bg-zinc-900 border border-zinc-800 rounded-xl p-2.5">
          <button
            type="button"
            onClick={() => setEtapa(1)}
            className={`flex items-center justify-center gap-2 p-2 rounded-lg text-xs font-semibold transition ${
              etapa === 1
                ? 'bg-red-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">1. Administrador</span>
            <span className="sm:hidden">1. Admin</span>
          </button>

          <button
            type="button"
            onClick={() => validarPasso1() && setEtapa(2)}
            className={`flex items-center justify-center gap-2 p-2 rounded-lg text-xs font-semibold transition ${
              etapa === 2
                ? 'bg-red-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">2. Dados da Oficina</span>
            <span className="sm:hidden">2. Oficina</span>
          </button>

          <button
            type="button"
            onClick={() => validarPasso1() && validarPasso2() && setEtapa(3)}
            className={`flex items-center justify-center gap-2 p-2 rounded-lg text-xs font-semibold transition ${
              etapa === 3
                ? 'bg-red-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="hidden sm:inline">3. Finalizar</span>
            <span className="sm:hidden">3. Iniciar</span>
          </button>
        </div>

        {/* Mensagem de Erro */}
        {erro && (
          <div className="flex items-center gap-2.5 p-3.5 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-200 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* CONTEÚDO DA ETAPA 1: ADMINISTRADOR */}
        {etapa === 1 && (
          <form onSubmit={avancarPasso1} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <ShieldCheck className="w-5 h-5 text-red-500" />
                <span>Passo 1: Criar Usuário Administrador Geral</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Esta será a conta mestre que terá acesso total a todas as ordens de serviço, financeiro, configurações e cadastro de outros usuários da equipe.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Nome Completo do Administrador *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Roberto Silva"
                    value={admin.nome}
                    onChange={(e) => setAdmin({ ...admin, nome: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  E-mail de Acesso (Login) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="admin@oficina.com.br"
                    value={admin.email}
                    onChange={(e) => setAdmin({ ...admin, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Telefone / WhatsApp Pessoal
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={admin.telefone}
                    onChange={(e) => setAdmin({ ...admin, telefone: formatPhone(e.target.value) })}
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Senha de Acesso *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 4 caracteres"
                    value={admin.senha}
                    onChange={(e) => setAdmin({ ...admin, senha: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Confirmar Senha *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Repita a senha"
                    value={admin.confirmarSenha}
                    onChange={(e) => setAdmin({ ...admin, confirmarSenha: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500 transition"
                  />
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl flex items-start gap-3 text-xs text-zinc-400">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-zinc-200 block mb-0.5">Perfil de Administrador:</strong>
                O perfil Administrador permite cadastrar mecânicos, atendentes, visualizar relatórios completos e editar os parâmetros da oficina a qualquer momento.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-semibold rounded-lg shadow-lg shadow-red-950 transition border border-red-500"
              >
                <span>Avançar para Dados da Oficina</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* CONTEÚDO DA ETAPA 2: OFICINA */}
        {etapa === 2 && (
          <form onSubmit={avancarPasso2} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Building2 className="w-5 h-5 text-red-500" />
                <span>Passo 2: Informações Oficiais da Oficina</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Estes dados sairão impressos no cabeçalho das Ordens de Serviço, nos orçamentos, relatórios e contatos com os clientes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Nome da Oficina / Nome Fantasia *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Auto Mecânica Central - Serviços Automotivos"
                  value={oficina.nome}
                  onChange={(e) =>
                    setOficina({ ...oficina, nome: e.target.value, nome_fantasia: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Razão Social (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Auto Mecânica Central Especializada Ltda"
                  value={oficina.razao_social}
                  onChange={(e) => setOficina({ ...oficina, razao_social: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  CNPJ (opcional)
                </label>
                <input
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={oficina.cnpj}
                  onChange={(e) => setOficina({ ...oficina, cnpj: formatCpfCnpj(e.target.value) })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  WhatsApp Comercial *
                </label>
                <input
                  type="text"
                  placeholder="(11) 96944-0424"
                  value={oficina.whatsapp}
                  onChange={(e) => setOficina({ ...oficina, whatsapp: formatPhone(e.target.value) })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Telefone Fixo / Comercial
                </label>
                <input
                  type="text"
                  placeholder="(11) 3322-5500"
                  value={oficina.telefone}
                  onChange={(e) => setOficina({ ...oficina, telefone: formatPhone(e.target.value) })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500 transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  E-mail de Contato da Oficina
                </label>
                <input
                  type="email"
                  placeholder="contato@oficina.com.br"
                  value={oficina.email}
                  onChange={(e) => setOficina({ ...oficina, email: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500 transition"
                />
              </div>

              {/* Endereço com busca de CEP */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  CEP
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="00000-000"
                    value={oficina.cep}
                    onChange={(e) => setOficina({ ...oficina, cep: formatCep(e.target.value) })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500 transition"
                  />
                  <button
                    type="button"
                    onClick={buscarEnderecoCep}
                    disabled={buscandoCep}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold transition border border-zinc-700 shrink-0"
                    title="Buscar endereço por CEP"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Logradouro (Rua, Av)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Avenida Direitos Humanos"
                  value={oficina.logradouro}
                  onChange={(e) => setOficina({ ...oficina, logradouro: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Número
                  </label>
                  <input
                    type="text"
                    placeholder="2055"
                    value={oficina.numero}
                    onChange={(e) => setOficina({ ...oficina, numero: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Complemento
                  </label>
                  <input
                    type="text"
                    placeholder="Galpão"
                    value={oficina.complemento}
                    onChange={(e) => setOficina({ ...oficina, complemento: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Bairro
                  </label>
                  <input
                    type="text"
                    placeholder="Imirim"
                    value={oficina.bairro}
                    onChange={(e) => setOficina({ ...oficina, bairro: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Estado
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="SP"
                    value={oficina.estado}
                    onChange={(e) => setOficina({ ...oficina, estado: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500 transition uppercase"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Cidade
                </label>
                <input
                  type="text"
                  placeholder="São Paulo"
                  value={oficina.cidade}
                  onChange={(e) => setOficina({ ...oficina, cidade: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500 transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setEtapa(1)}
                className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao Administrador</span>
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-semibold rounded-lg shadow-lg shadow-red-950 transition border border-red-500"
              >
                <span>Avançar para Revisão e Conclusão</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* CONTEÚDO DA ETAPA 3: REVISÃO E CONCLUSÃO */}
        {etapa === 3 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Passo 3: Revisão e Inicialização do Sistema</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Revise os dados abaixo. O sistema será configurado e iniciado completamente zerado (sem clientes, veículos ou ordens de teste).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card Resumo do Administrador */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-red-500" />
                    Administrador Mestre
                  </span>
                  <button
                    type="button"
                    onClick={() => setEtapa(1)}
                    className="text-red-400 hover:underline text-[11px]"
                  >
                    Editar
                  </button>
                </div>
                <div>
                  <span className="text-zinc-500 block">Nome:</span>
                  <strong className="text-zinc-200">{admin.nome}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block">E-mail (Login):</span>
                  <strong className="text-zinc-200">{admin.email}</strong>
                </div>
                {admin.telefone && (
                  <div>
                    <span className="text-zinc-500 block">Telefone:</span>
                    <strong className="text-zinc-200">{admin.telefone}</strong>
                  </div>
                )}
                <div>
                  <span className="text-zinc-500 block">Perfil:</span>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                    ADMINISTRADOR (Acesso Total)
                  </span>
                </div>
              </div>

              {/* Card Resumo da Oficina */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-red-500" />
                    Dados da Oficina
                  </span>
                  <button
                    type="button"
                    onClick={() => setEtapa(2)}
                    className="text-red-400 hover:underline text-[11px]"
                  >
                    Editar
                  </button>
                </div>
                <div>
                  <span className="text-zinc-500 block">Nome:</span>
                  <strong className="text-zinc-200">{oficina.nome}</strong>
                </div>
                {oficina.cnpj && (
                  <div>
                    <span className="text-zinc-500 block">CNPJ:</span>
                    <strong className="text-zinc-200">{oficina.cnpj}</strong>
                  </div>
                )}
                <div>
                  <span className="text-zinc-500 block">Contatos:</span>
                  <strong className="text-zinc-200">
                    {oficina.whatsapp || oficina.telefone}
                  </strong>
                </div>
                {oficina.cidade && (
                  <div>
                    <span className="text-zinc-500 block">Localização:</span>
                    <strong className="text-zinc-200">
                      {oficina.cidade} - {oficina.estado}
                    </strong>
                  </div>
                )}
              </div>
            </div>

            {/* Aviso de Sistema Zerado */}
            <div className="p-4 bg-emerald-950/40 border border-emerald-800/50 rounded-xl flex items-start gap-3 text-xs text-emerald-200">
              <Database className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="text-emerald-300 block font-semibold">
                  Sistema Pronto para Produção (100% Zerado):
                </strong>
                <p className="text-emerald-400/90 leading-relaxed">
                  O banco de dados será inicializado limpo: sem ordens de serviço fictícias, sem clientes de teste e sem veículos fictícios. Você iniciará os cadastros reais diretamente.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setEtapa(2)}
                disabled={salvando}
                className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar aos Dados da Oficina</span>
              </button>

              <button
                type="button"
                onClick={concluirInstalacao}
                disabled={salvando}
                className="flex items-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold rounded-xl shadow-xl shadow-red-950 transition border border-red-500 disabled:opacity-50"
              >
                {salvando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Configurando Sistema...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Concluir Cadastro e Ir para Login</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

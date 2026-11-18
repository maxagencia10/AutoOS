import React, { useState } from 'react';
import {
  Crown,
  Building2,
  Users,
  ShieldCheck,
  Share2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  Phone,
  Copy,
  Check,
  Send,
  ExternalLink,
  RefreshCw,
  Plus,
  Settings,
  Database,
  ArrowLeft,
  Globe,
  AlertTriangle,
  HelpCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Key,
  Eye,
  EyeOff,
  Mail,
  UserCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SaasEmpresasView } from './SaasEmpresasView';
import { UsuariosView } from './UsuariosView';
import { gerarLinkExclusivoLoja, gerarLinkAdminGeral } from '../utils/conviteSaaS';
import { UsuarioRepository } from '../services/dbRepository';
import { formatPhone } from '../utils/formatters';

interface AdminGeralViewProps {
  onVoltarParaOficina?: () => void;
}

export const AdminGeralView: React.FC<AdminGeralViewProps> = ({ onVoltarParaOficina }) => {
  const {
    usuarioAtual,
    oficinaAtiva,
    oficinasDisponiveis,
    usuariosDisponiveis,
    isSuperAdmin,
    promoverParaSuperAdmin,
    sairAdminGeral,
    selecionarOficina,
    testarLoginLojista,
    recarregarUsuarios,
    urlBasePublica,
    setUrlBasePublica,
  } = useAuth();

  const [abaInterna, setAbaInterna] = useState<'empresas' | 'usuarios' | 'guia_acessos' | 'conta_master'>(
    'empresas'
  );
  const [oficinaSelecionadaParaConvite, setOficinaSelecionadaParaConvite] = useState<string>(
    oficinasDisponiveis[0]?.id || ''
  );
  const [copiadoConvite, setCopiadoConvite] = useState(false);
  const [copiadoLinkMaster, setCopiadoLinkMaster] = useState<'producao' | 'atual' | null>(null);
  const [urlInput, setUrlInput] = useState(urlBasePublica);
  const [salvouUrl, setSalvouUrl] = useState(false);
  const [expandirAjudaVercel, setExpandirAjudaVercel] = useState(true);

  const contaMasterAtual =
    (usuarioAtual?.perfil === 'SUPERADMIN' ? usuarioAtual : null) ||
    usuariosDisponiveis.find((u) => u.perfil === 'SUPERADMIN') ||
    null;

  const [masterNome, setMasterNome] = useState(contaMasterAtual?.nome || 'Administrador Geral (Master)');
  const [masterEmail, setMasterEmail] = useState(contaMasterAtual?.email || 'maxagencia@gmail.com');
  const [masterTelefone, setMasterTelefone] = useState(contaMasterAtual?.telefone || '');
  const [masterNovaSenha, setMasterNovaSenha] = useState('');
  const [masterConfirmarSenha, setMasterConfirmarSenha] = useState('');
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [salvandoMaster, setSalvandoMaster] = useState(false);
  const [erroMaster, setErroMaster] = useState('');
  const [sucessoMaster, setSucessoMaster] = useState('');

  React.useEffect(() => {
    if (contaMasterAtual) {
      setMasterNome(contaMasterAtual.nome || 'Administrador Geral (Master)');
      setMasterEmail(contaMasterAtual.email || '');
      setMasterTelefone(contaMasterAtual.telefone || '');
    }
  }, [contaMasterAtual?.id, contaMasterAtual?.nome, contaMasterAtual?.email, contaMasterAtual?.telefone]);

  const handleSalvarContaMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroMaster('');
    setSucessoMaster('');

    if (!contaMasterAtual) {
      setErroMaster('Conta Master (SUPERADMIN) não encontrada no banco de dados.');
      return;
    }

    const nomeLimpo = masterNome.trim();
    const emailLimpo = masterEmail.trim().toLowerCase();
    const senhaNovaLimpa = masterNovaSenha.trim();
    const confirmarLimpa = masterConfirmarSenha.trim();

    if (!nomeLimpo) {
      setErroMaster('Informe o nome do Administrador Geral.');
      return;
    }
    if (!emailLimpo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
      setErroMaster('Informe um e-mail válido para o usuário master.');
      return;
    }
    if (senhaNovaLimpa) {
      if (senhaNovaLimpa.length < 4) {
        setErroMaster('A nova senha deve ter pelo menos 4 caracteres.');
        return;
      }
      if (senhaNovaLimpa !== confirmarLimpa) {
        setErroMaster('A confirmação da nova senha não confere.');
        return;
      }
    }

    setSalvandoMaster(true);
    try {
      await UsuarioRepository.update(contaMasterAtual.id, {
        nome: nomeLimpo,
        email: emailLimpo,
        telefone: masterTelefone.trim(),
        ...(senhaNovaLimpa ? { senha: senhaNovaLimpa } : {}),
      });
      await recarregarUsuarios();
      setMasterNovaSenha('');
      setMasterConfirmarSenha('');
      setSucessoMaster(
        senhaNovaLimpa
          ? `Credenciais do Usuário Master atualizadas! Novo login: ${emailLimpo} (senha alterada).`
          : `Dados do Usuário Master atualizados para ${emailLimpo}.`
      );
    } catch (err: any) {
      setErroMaster(err.message || 'Erro ao atualizar credenciais do Usuário Master.');
    } finally {
      setSalvandoMaster(false);
    }
  };

  const oficinaAlvo =
    oficinasDisponiveis.find((o) => o.id === oficinaSelecionadaParaConvite) ||
    oficinasDisponiveis[0] ||
    oficinaAtiva;

  const adminDestaOficina =
    usuariosDisponiveis.find(
      (u) => u.oficina_id === oficinaAlvo?.id && u.perfil === 'ADMINISTRADOR'
    ) ||
    usuariosDisponiveis.find((u) => u.oficina_id === oficinaAlvo?.id && u.perfil !== 'SUPERADMIN') ||
    null;

  const originUrl = urlBasePublica || (typeof window !== 'undefined' ? window.location.origin : 'https://auto-os-gold.vercel.app');
  const currentBrowserOrigin = typeof window !== 'undefined' ? window.location.origin : originUrl;
  const linkAdminGeralOficial = gerarLinkAdminGeral(originUrl);
  const linkAdminGeralAtual = gerarLinkAdminGeral(currentBrowserOrigin);
  const linkAcessoDireto = oficinaAlvo
    ? gerarLinkExclusivoLoja({
        baseUrl: originUrl,
        oficina: oficinaAlvo,
        usuario: adminDestaOficina,
      })
    : originUrl;

  const handleCopiarLinkMaster = (tipo: 'producao' | 'atual', valor: string) => {
    navigator.clipboard.writeText(valor);
    setCopiadoLinkMaster(tipo);
    setTimeout(() => setCopiadoLinkMaster(null), 2500);
  };

  const handleSalvarUrlBase = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlBasePublica(urlInput);
    setSalvouUrl(true);
    setTimeout(() => setSalvouUrl(false), 3000);
  };

  const mensagemProntaWhatsApp =
    `🚗🔧 *BEM-VINDO AO AUTOOS - SEU ACESSO ESTÁ LIBERADO!*\n\n` +
    `Olá, *${adminDestaOficina?.nome || oficinaAlvo?.responsavel_nome || 'Gestor'}*!\n` +
    `Seu acesso exclusivo para a unidade *${oficinaAlvo?.nome || 'Sua Loja'}* foi ativado com sucesso no Plano *${oficinaAlvo?.plano || 'PRO'}*.\n\n` +
    `🌐 *Link de Acesso Direto à Loja:*\n${linkAcessoDireto}\n\n` +
    `👤 *Usuário / Login:* ${adminDestaOficina?.email || oficinaAlvo?.email || 'admin'}\n` +
    `🔑 *Senha Inicial:* ${adminDestaOficina?.senha || 'auto123'}\n\n` +
    `📋 *Passo a Passo de Acesso:*\n` +
    `1. Clique no link acima pelo celular ou computador.\n` +
    `2. A tela de login da sua loja abrirá com o seu e-mail preenchido.\n` +
    `3. Digite sua senha inicial para acessar.\n` +
    `4. Logo após entrar, confirme ou complete os dados do seu cadastro de administrador e da loja.\n` +
    `5. Pronto! Você já terá controle total da oficina!`;

  const handleCopiarMensagem = () => {
    navigator.clipboard.writeText(mensagemProntaWhatsApp);
    setCopiadoConvite(true);
    setTimeout(() => setCopiadoConvite(false), 2500);
  };

  const handleEnviarWhatsApp = () => {
    let fone = (adminDestaOficina?.telefone || oficinaAlvo?.whatsapp || oficinaAlvo?.telefone || '').replace(/\D/g, '');
    if (fone && !fone.startsWith('55') && fone.length <= 11) {
      fone = '55' + fone;
    }
    const url = fone
      ? `https://api.whatsapp.com/send?phone=${fone}&text=${encodeURIComponent(mensagemProntaWhatsApp)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagemProntaWhatsApp)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Banner Principal de Administrador Geral (Master) */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/40 border border-amber-500/30 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-zinc-950 shadow-lg shadow-amber-950/60 border border-amber-400/50 shrink-0">
              <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-zinc-950" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Painel Master Micro-SaaS
                </span>
                <span className="text-[10px] text-zinc-400">
                  Multi-Empresas & Franquias
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
                <span>Administração Geral da Plataforma</span>
              </h1>
              <p className="text-xs sm:text-sm text-zinc-300 mt-0.5">
                Você está conectado como{' '}
                <strong className="text-amber-400">{usuarioAtual?.nome || 'Admin Geral'}</strong> (
                {usuarioAtual?.email}). Acesso irrestrito a todas as oficinas e lojas.
              </p>
            </div>
          </div>

          {/* Botões de Ação do Header */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => setAbaInterna('conta_master')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white text-xs font-bold border border-amber-500/40 transition cursor-pointer"
              title="Alterar e-mail, senha e dados do usuário Master"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Alterar Usuário Master</span>
            </button>

            {onVoltarParaOficina && (
              <button
                onClick={onVoltarParaOficina}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-zinc-400" />
                <span>Voltar à Oficina ({oficinaAtiva?.nome || 'Ativa'})</span>
              </button>
            )}

            <button
              onClick={sairAdminGeral}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium border border-zinc-800 transition cursor-pointer"
              title="Voltar ao modo de usuário comum"
            >
              <span>Alternar Modo Usuário</span>
            </button>
          </div>
        </div>

        {/* Métricas Rápidas no Topo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-zinc-800/80">
          <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Total de Lojas / Oficinas
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold text-white font-mono">
                {oficinasDisponiveis.length}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold">cadastradas</span>
            </div>
          </div>

          <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Lojas em Operação Ativa
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold text-emerald-400 font-mono">
                {oficinasDisponiveis.filter((o) => (o.status_empresa || 'ATIVA') === 'ATIVA').length}
              </span>
              <span className="text-[10px] text-zinc-400">ativas</span>
            </div>
          </div>

          <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Usuários Cadastrados
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold text-amber-400 font-mono">
                {usuariosDisponiveis.length}
              </span>
              <span className="text-[10px] text-zinc-400">em todas as lojas</span>
            </div>
          </div>

          <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Arquitetura & Hospedagem
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xs font-bold text-zinc-200">PostgreSQL WASM</span>
              <span className="text-[10px] text-emerald-400 font-semibold">100% Vercel SPA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação entre Abas do Painel Geral */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setAbaInterna('empresas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
            abaInterna === 'empresas'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Lojas & Oficinas ({oficinasDisponiveis.length})</span>
        </button>

        <button
          onClick={() => setAbaInterna('usuarios')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
            abaInterna === 'usuarios'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuários Globais ({usuariosDisponiveis.length})</span>
        </button>

        <button
          onClick={() => setAbaInterna('guia_acessos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
            abaInterna === 'guia_acessos'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Central de Novos Acessos & WhatsApp</span>
        </button>

        <button
          onClick={() => setAbaInterna('conta_master')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
            abaInterna === 'conta_master'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Conta Master (Acesso Geral)</span>
        </button>
      </div>

      {/* Conteúdo da Aba 1: Empresas e Lojas */}
      {abaInterna === 'empresas' && (
        <div>
          <SaasEmpresasView />
        </div>
      )}

      {/* Conteúdo da Aba 2: Usuários de Todas as Oficinas */}
      {abaInterna === 'usuarios' && (
        <div>
          <UsuariosView />
        </div>
      )}

      {/* Conteúdo da Aba 3: Como Enviar Acessos & Gerador de Convites */}
      {abaInterna === 'guia_acessos' && (
        <div className="space-y-6">

          {/* ALERTA E GUIA RESOLUÇÃO VERCEL: Como desativar a tela de login da Vercel para o cliente */}
          <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <span>O link enviado pediu login na Vercel para o seu cliente?</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase font-bold">
                      Solução Rápida
                    </span>
                  </h3>
                  <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                    Por padrão, a Vercel ativa uma proteção chamada <strong>Deployment Protection / Vercel Authentication</strong> para projetos e links de visualização (Preview). Isso faz com que a Vercel exija login de quem abre o link. Veja como resolver em 30 segundos:
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setExpandirAjudaVercel(!expandirAjudaVercel)}
                className="text-amber-400 hover:text-white p-1 rounded-lg hover:bg-amber-500/10 transition cursor-pointer shrink-0"
                title={expandirAjudaVercel ? 'Recolher instruções' : 'Expandir instruções'}
              >
                {expandirAjudaVercel ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            {expandirAjudaVercel && (
              <div className="pt-3 border-t border-amber-500/20 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-amber-500/30 space-y-2">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 text-xs flex items-center justify-center font-black">1</span>
                    <span>Desativar Proteção na Vercel (Recomendado):</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-zinc-300 text-[11px] leading-relaxed pl-1">
                    <li>Acesse o painel da Vercel: <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer" className="text-amber-400 underline font-mono">vercel.com/dashboard</a></li>
                    <li>Clique no projeto do <strong>AutoOS</strong>.</li>
                    <li>No menu superior, vá em <strong>Settings</strong> (Configurações).</li>
                    <li>No menu lateral esquerdo, clique em <strong>Deployment Protection</strong>.</li>
                    <li>Em <strong>Vercel Authentication</strong>, altere para <strong>Disabled</strong> (Desativado).</li>
                    <li>Clique no botão azul <strong>Save</strong>.</li>
                  </ol>
                </div>

                <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-amber-500/30 space-y-2">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-zinc-950 text-xs flex items-center justify-center font-black">2</span>
                    <span>Certifique-se de Usar o Domínio Principal:</span>
                  </div>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    Não envie links que contenham <code>-git-</code> ou códigos aleatórios no endereço (são links de preview protegidos). Envie sempre o seu domínio limpo de produção: <code className="text-amber-400 font-bold">https://auto-os-gold.vercel.app</code>.
                  </p>
                  <div className="pt-1">
                    <p className="text-[11px] text-zinc-400">
                      O sistema já está configurado com a sua URL oficial abaixo!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Configuração da URL Oficial de Produção */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Globe className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Domínio Oficial de Produção do Micro-SaaS</h3>
                  <p className="text-[11px] text-zinc-400">
                    Defina o link público oficial da sua plataforma (configurado para <span className="font-mono text-amber-300 font-bold">https://auto-os-gold.vercel.app</span>).
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-lg font-mono">
                Ativo: {originUrl}
              </span>
            </div>

            <form onSubmit={handleSalvarUrlBase} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="https://auto-os-gold.vercel.app"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
              >
                {salvouUrl ? 'URL Salva com Sucesso!' : 'Salvar URL Oficial'}
              </button>
            </form>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-amber-400" />
              <span>Gerador e Disparador de Acessos para Donos de Lojas</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Selecione qualquer loja cadastrada para gerar o link direto personalizado e disparar as credenciais prontas para o WhatsApp do responsável.
            </p>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Selecione a Loja / Oficina de Destino
                </label>
                <select
                  value={oficinaSelecionadaParaConvite}
                  onChange={(e) => setOficinaSelecionadaParaConvite(e.target.value)}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500"
                >
                  {oficinasDisponiveis.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nome} ({o.plano || 'PRO'})
                    </option>
                  ))}
                </select>

                {oficinaAlvo && (
                  <div className="mt-3 p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1 text-xs text-zinc-400">
                    <p>
                      <strong>Responsável:</strong> {oficinaAlvo.responsavel_nome || 'Não informado'}
                    </p>
                    <p>
                      <strong>Contato:</strong> {oficinaAlvo.whatsapp || oficinaAlvo.telefone || 'Sem telefone'}
                    </p>
                    <p>
                      <strong>Plano:</strong>{' '}
                      <span className="text-amber-400 font-bold">{oficinaAlvo.plano || 'PRO'}</span> (até{' '}
                      {oficinaAlvo.limite_os_mensal || 500} OS/mês)
                    </p>
                    <p>
                      <strong>Admin Cadastrado:</strong> {adminDestaOficina?.nome} ({adminDestaOficina?.email})
                    </p>
                  </div>
                )}
              </div>

              {/* Pré-visualização da Mensagem */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span>Mensagem Pronta para Envio</span>
                  <span className="text-[11px] text-emerald-400 font-medium">
                    Link exclusivo /loja/{oficinaAlvo?.slug || oficinaAlvo?.id} vinculado ao usuário
                  </span>
                </label>
                <textarea
                  readOnly
                  rows={9}
                  value={mensagemProntaWhatsApp}
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 text-xs font-mono focus:outline-none select-all"
                />

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <button
                    type="button"
                    onClick={handleCopiarMensagem}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold border border-zinc-700 transition cursor-pointer"
                  >
                    {copiadoConvite ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiadoConvite ? 'Copiado para Área de Transferência!' : 'Copiar Texto Completo'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleEnviarWhatsApp}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950 transition cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar Diretamente no WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => testarLoginLojista(oficinaAlvo?.id, adminDestaOficina?.email)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white text-xs font-bold border border-amber-500/40 transition cursor-pointer ml-auto"
                    title="Desconecta da sessão master e abre a tela de login como esta loja"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Testar Login Desta Loja</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Dicas de Como Funciona o Micro-SaaS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="font-bold text-white text-sm">Cadastre a Loja e o Admin</h3>
              <p className="text-xs text-zinc-400">
                Na aba <strong>Lojas & Oficinas</strong>, clique em <em>+ Nova Oficina (SaaS)</em>. Informe os dados da loja, plano e o e-mail/senha do administrador inicial.
              </p>
            </div>

            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="font-bold text-white text-sm">Envie o Link Exclusivo</h3>
              <p className="text-xs text-zinc-400">
                Cada loja recebe uma rota própria (<code className="text-amber-400">/loja/slug</code>) e token vinculado ao usuário. Tentativas com outro usuário ou loja são negadas!
              </p>
            </div>

            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="font-bold text-white text-sm">Acesso Master a Qualquer Momento</h3>
              <p className="text-xs text-zinc-400">
                Você como dono da plataforma pode clicar em <strong>👑 Admin Geral</strong> a qualquer momento em qualquer oficina para ver todas as lojas e redefinir acessos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 4: Configurações, Link Exclusivo e Alteração do Usuário Master */}
      {abaInterna === 'conta_master' && (
        <div className="space-y-5 max-w-2xl">
          {/* Card do Link Específico da Administração Geral (/admin) */}
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/20 border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white">
                  Link Específico de Acesso à Administração Geral
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Rota exclusiva (<code className="text-amber-300 font-mono">/admin</code>) que aceita somente usuários{' '}
                  <strong className="text-amber-300">SUPERADMIN</strong>. Contas comuns de lojas não conseguem entrar por este link.
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                    Link Oficial de Produção
                  </span>
                  <code className="text-xs font-mono text-zinc-100 break-all">{linkAdminGeralOficial}</code>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopiarLinkMaster('producao', linkAdminGeralOficial)}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white text-xs font-bold border border-amber-500/40 transition cursor-pointer shrink-0"
                >
                  {copiadoLinkMaster === 'producao' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiadoLinkMaster === 'producao' ? 'Copiado!' : 'Copiar Link'}</span>
                </button>
              </div>

              {linkAdminGeralAtual !== linkAdminGeralOficial && (
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">
                      Link do Ambiente Atual
                    </span>
                    <code className="text-xs font-mono text-zinc-100 break-all">{linkAdminGeralAtual}</code>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopiarLinkMaster('atual', linkAdminGeralAtual)}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold border border-zinc-700 transition cursor-pointer shrink-0"
                  >
                    {copiadoLinkMaster === 'atual' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiadoLinkMaster === 'atual' ? 'Copiado!' : 'Copiar Link'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex items-start gap-3.5 border-b border-zinc-800 pb-4">
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Key className="w-5 h-5" />
              </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Alterar Usuário Master da Administração Geral
                </h2>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  SUPERADMIN
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Altere o e-mail de login, nome, telefone ou redefina a senha de acesso ao Portal Master do sistema.
              </p>
            </div>
          </div>

          {erroMaster && (
            <div className="p-3 bg-red-950/70 border border-red-800 rounded-xl flex items-start gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{erroMaster}</span>
            </div>
          )}

          {sucessoMaster && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-800 rounded-xl flex items-start gap-2.5 text-xs text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{sucessoMaster}</span>
            </div>
          )}

          <form onSubmit={handleSalvarContaMaster} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Nome do Administrador Geral <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-zinc-500 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={masterNome}
                    onChange={(e) => setMasterNome(e.target.value)}
                    placeholder="Administrador Geral (Master)"
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  E-mail de Login Master <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={masterEmail}
                    onChange={(e) => setMasterEmail(e.target.value)}
                    placeholder="maxagencia@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Telefone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={masterTelefone}
                    onChange={(e) => setMasterTelefone(formatPhone(e.target.value))}
                    placeholder="(11) 99999-9999"
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Alterar Senha de Acesso Master
                </span>
                <span className="text-[11px] text-zinc-400">
                  Deixe em branco para manter a senha atual
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      type={mostrarNovaSenha ? 'text' : 'password'}
                      value={masterNovaSenha}
                      onChange={(e) => setMasterNovaSenha(e.target.value)}
                      placeholder="Digite a nova senha (mín. 4 dígitos)"
                      className="w-full pl-3 pr-10 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 cursor-pointer"
                      title={mostrarNovaSenha ? 'Ocultar senha' : 'Exibir senha'}
                    >
                      {mostrarNovaSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      type={mostrarConfirmarSenha ? 'text' : 'password'}
                      value={masterConfirmarSenha}
                      onChange={(e) => setMasterConfirmarSenha(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="w-full pl-3 pr-10 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 cursor-pointer"
                      title={mostrarConfirmarSenha ? 'Ocultar senha' : 'Exibir senha'}
                    >
                      {mostrarConfirmarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3 flex-wrap">
              <div className="text-[11px] text-zinc-400">
                ID da Conta: <code className="text-zinc-300">{contaMasterAtual?.id || 'admin_master'}</code>
              </div>

              <button
                type="submit"
                disabled={salvandoMaster}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-950/40 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {salvandoMaster ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando Alterações...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Salvar Credenciais Master</span>
                  </>
                )}
              </button>
            </div>
          </form>
          </div>
        </div>
      )}
    </div>
  );
};

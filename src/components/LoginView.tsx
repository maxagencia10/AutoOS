import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Lock,
  Mail,
  Key,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Building2,
  Users,
  Sparkles,
  Crown,
  Check,
  Store,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Usuario } from '../types';

interface LoginViewProps {
  onLoginSucesso?: (usuario: Usuario) => void;
  onIrParaAdminGeral?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSucesso, onIrParaAdminGeral }) => {
  const {
    loginUsuario,
    usuariosDisponiveis,
    oficinasDisponiveis,
    oficinaAtiva,
    selecionarOficina,
  } = useAuth();

  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucessoMsg, setSucessoMsg] = useState('');

  // Identifica parâmetros da URL (?oficina=ID, ?email=EMAIL, ?login=1)
  const [oficinaUrlNome, setOficinaUrlNome] = useState<string | null>(null);
  const [oficinaUrlPlano, setOficinaUrlPlano] = useState<string | null>(null);
  const [isAcessoLojistaConvite, setIsAcessoLojistaConvite] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlOficina = params.get('oficina') || params.get('oficina_id') || params.get('loja');
      const urlEmail = params.get('email') || params.get('usuario') || params.get('user');

      if (urlEmail) {
        setIdentificador(decodeURIComponent(urlEmail));
      }

      if (urlOficina) {
        setIsAcessoLojistaConvite(true);
        const ofAlvo = oficinasDisponiveis.find(
          (o) => o.id === urlOficina || o.id.toLowerCase() === urlOficina.toLowerCase()
        );
        if (ofAlvo) {
          setOficinaUrlNome(ofAlvo.nome);
          setOficinaUrlPlano(ofAlvo.plano || 'PRO');
          selecionarOficina(ofAlvo.id);
        }
      }
    }
  }, [oficinasDisponiveis]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identificador.trim()) {
      setErro('Informe seu e-mail ou nome de usuário cadastrado.');
      return;
    }

    setCarregando(true);
    setErro('');
    setSucessoMsg('');

    try {
      const res = await loginUsuario(identificador, senha);
      if (res.sucesso && res.usuario) {
        const user = res.usuario;
        setSucessoMsg(`Bem-vindo, ${user.nome || 'Lojista'}! Entrando no sistema...`);
        setTimeout(() => {
          if (onLoginSucesso) onLoginSucesso(user);
        }, 500);
      } else {
        setErro(res.mensagem || 'Credenciais inválidas. Verifique seu e-mail e senha.');
      }
    } catch (err: any) {
      setErro(err.message || 'Erro ao processar login.');
    } finally {
      setCarregando(false);
    }
  };

  const selecionarUsuarioAtalho = (email: string, senhaPadrao?: string, oficinaId?: string) => {
    setIdentificador(email);
    if (senhaPadrao) setSenha(senhaPadrao);
    if (oficinaId) {
      selecionarOficina(oficinaId);
    }
    setErro('');
  };

  // Identifica a oficina atual para exibição
  const oficinaExibida =
    oficinaAtiva ||
    (oficinaUrlNome ? { nome: oficinaUrlNome, plano: oficinaUrlPlano || 'PRO' } : null);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center px-4 py-8 font-sans antialiased">
      <div className="w-full max-w-md space-y-6">
        
        {/* Marca & Logo AutoOS */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 shadow-xl shadow-red-950 border border-red-500/30 mb-1">
            <Wrench className="w-7 h-7 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-white font-mono">
              AUTO<span className="text-red-500">OS</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700">
              Área de Login
            </span>
          </div>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Acesso ao sistema de gestão e Ordens de Serviço automotivas.
          </p>
        </div>

        {/* Card do Formulário de Login */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-5">
          
          {/* Banner de Loja / Oficina de Destino (quando o link vem de WhatsApp ou do painel) */}
          {oficinaExibida?.nome && (
            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Store className="w-4 h-4 text-red-400 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] uppercase font-bold text-red-400 block tracking-wider">
                    Acesso à Loja
                  </span>
                  <span className="text-xs font-bold text-white truncate block">
                    {oficinaExibida.nome}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-zinc-900 text-zinc-300 rounded border border-zinc-700 shrink-0">
                {oficinaExibida.plano || 'PRO'}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {erro && (
              <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl flex items-start gap-2.5 text-xs text-red-200 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Erro ao entrar</p>
                  <p className="text-red-300/90 mt-0.5">{erro}</p>
                </div>
              </div>
            )}

            {sucessoMsg && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl flex items-center gap-2.5 text-xs text-emerald-200 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <p className="font-medium">{sucessoMsg}</p>
              </div>
            )}

            {/* E-mail / Identificador */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>E-mail do Administrador ou Usuário</span>
                <span className="text-[11px] text-zinc-500 font-normal">Enviado no WhatsApp</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus={!identificador}
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  placeholder="admin@sualoja.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition placeholder:text-zinc-600"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>Senha de Acesso</span>
                <span className="text-[11px] text-zinc-500 font-normal">Senha inicial enviada</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  required
                  autoFocus={!!identificador}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition placeholder:text-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  title={mostrarSenha ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={carregando}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-red-950 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border border-red-500"
            >
              {carregando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Entrar e Abrir Cadastro da Loja</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Dica para primeiro acesso */}
          <div className="text-[11px] text-zinc-400 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800 text-center space-y-1">
            <p className="font-semibold text-zinc-300">
              Primeiro acesso à sua oficina?
            </p>
            <p className="text-zinc-500 leading-relaxed">
              Utilize o e-mail e a senha temporária enviados pelo WhatsApp. Após o login, você poderá confirmar seus dados e definir sua senha pessoal.
            </p>
          </div>

          {/* Atalho de Usuários Cadastrados para Teste Rápido */}
          {(() => {
            const usuariosFiltrados = isAcessoLojistaConvite && oficinaAtiva
              ? usuariosDisponiveis.filter((u) => u.oficina_id === oficinaAtiva.id && u.perfil !== 'SUPERADMIN')
              : usuariosDisponiveis;

            if (usuariosFiltrados.length === 0) return null;

            return (
              <div className="pt-2 border-t border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    {isAcessoLojistaConvite ? 'Usuários desta oficina:' : 'Usuários criados (clique para testar):'}
                  </span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto scrollbar-thin">
                  {usuariosFiltrados.map((u) => {
                    const of = oficinasDisponiveis.find((o) => o.id === u.oficina_id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => selecionarUsuarioAtalho(u.email, u.senha || 'auto123', u.oficina_id)}
                        className="w-full text-left p-2 rounded-lg bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition flex items-center justify-between group cursor-pointer text-xs"
                      >
                        <div className="truncate mr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-zinc-200 group-hover:text-white">
                              {u.nome}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                u.perfil === 'SUPERADMIN'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : u.perfil === 'ADMINISTRADOR'
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : 'bg-zinc-700 text-zinc-300'
                              }`}
                            >
                              {u.perfil}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 truncate">
                            {u.email} {of ? `• ${of.nome}` : ''}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-red-400 group-hover:text-red-300 shrink-0">
                          Usar
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Botão de Retorno ao Portal Master / Administrador Geral Micro-SaaS */}
          {onIrParaAdminGeral && !isAcessoLojistaConvite && (
            <div className="pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={onIrParaAdminGeral}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 hover:from-amber-500/20 hover:to-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Portal Master • Administração Geral Micro-SaaS</span>
              </button>
            </div>
          )}
        </div>

        {/* Rodapé Informativo */}
        <div className="text-center text-[11px] text-zinc-500 space-y-1">
          <p>AutoOS • Plataforma Multi-Lojas para Oficinas Mecânicas</p>
          <p className="text-zinc-600">PostgreSQL WASM local com persistência segura no navegador</p>
        </div>

      </div>
    </div>
  );
};

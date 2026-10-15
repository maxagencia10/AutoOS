import React, { useState } from 'react';
import {
  Crown,
  Lock,
  Mail,
  Key,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  Building2,
  Users,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AdminLoginModalProps {
  aberto: boolean;
  onFechar: () => void;
  onSucesso: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  aberto,
  onFechar,
  onSucesso,
}) => {
  const { loginAdminGeral, usuariosDisponiveis, oficinasDisponiveis } = useAuth();
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucessoMsg, setSucessoMsg] = useState('');

  if (!aberto) return null;

  // Filtra administradores registrados para ajudar o dono caso ele esqueça o e-mail
  const adminsRegistrados = usuariosDisponiveis.filter(
    (u) => u.perfil === 'SUPERADMIN' || u.perfil === 'ADMINISTRADOR'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identificador.trim()) {
      setErro('Por favor, informe seu e-mail de administrador ou usuário.');
      return;
    }

    setCarregando(true);
    setErro('');
    setSucessoMsg('');

    try {
      const res = await loginAdminGeral(identificador, senha);
      if (res.sucesso) {
        setSucessoMsg('Autenticação concedida com sucesso! Redirecionando para a Administração Geral...');
        setTimeout(() => {
          onSucesso();
          onFechar();
        }, 600);
      } else {
        setErro(res.mensagem || 'Credenciais inválidas. Verifique seu e-mail e senha.');
      }
    } catch (err: any) {
      setErro(err.message || 'Erro ao conectar como Administrador Geral.');
    } finally {
      setCarregando(false);
    }
  };

  const selecionarAdminRapido = (email: string, senhaPadrao?: string) => {
    setIdentificador(email);
    if (senhaPadrao) {
      setSenha(senhaPadrao);
    }
    setErro('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho com Gradiente Elegante */}
        <div className="relative bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/40 p-6 border-b border-zinc-800">
          <button
            onClick={onFechar}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-zinc-950 shadow-lg shadow-amber-950/50 border border-amber-400/40 shrink-0">
              <Crown className="w-6 h-6 text-zinc-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Acesso Master Micro-SaaS
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
                Área do Administrador Geral
              </h2>
              <p className="text-xs text-zinc-400">
                Acesse o painel central para gerenciar todas as lojas, oficinas e acessos da plataforma.
              </p>
            </div>
          </div>
        </div>

        {/* Corpo do Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {erro && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl flex items-start gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Falha na Autenticação</p>
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

          {/* Campo Identificador / E-mail */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
              <span>E-mail do Administrador ou Usuário</span>
              <span className="text-[11px] text-zinc-500 font-normal">Ex: admin@suaempresa.com</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                placeholder="Digite o e-mail ou nome cadastrado"
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
              />
            </div>
          </div>

          {/* Campo Senha */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
              <span>Senha de Acesso</span>
              <span className="text-[11px] text-zinc-500 font-normal">Senha definida no cadastro</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Sua senha secreta"
                className="w-full pl-9 pr-10 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
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

          {/* Botão de Entrar */}
          <button
            type="submit"
            disabled={carregando}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-zinc-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-950/40 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {carregando ? (
              <span>Autenticando Acesso...</span>
            ) : (
              <>
                <Crown className="w-4 h-4" />
                <span>Entrar na Administração Geral (Micro-SaaS)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Seleção Rápida de Administrador Encontrado no Sistema */}
          {adminsRegistrados.length > 0 && (
            <div className="pt-3 border-t border-zinc-800">
              <p className="text-[11px] font-semibold text-zinc-400 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Administradores Cadastrados no Banco:</span>
              </p>
              <div className="space-y-1.5 max-h-36 overflow-y-auto scrollbar-thin">
                {adminsRegistrados.map((u) => {
                  const of = oficinasDisponiveis.find((o) => o.id === u.oficina_id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => selecionarAdminRapido(u.email, u.senha || 'auto123')}
                      className="w-full text-left p-2 rounded-lg bg-zinc-950/70 hover:bg-zinc-800/80 border border-zinc-800 hover:border-amber-500/40 transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="truncate mr-2">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="text-xs font-semibold text-zinc-200 group-hover:text-amber-300">
                            {u.nome}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                            {u.perfil}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 truncate pl-5">
                          {u.email} {of ? `• ${of.nome}` : ''}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-amber-400/80 group-hover:text-amber-300 shrink-0">
                        Usar este
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="text-[11px] text-zinc-400 text-center bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-800/60">
            Dica: Se você acabou de criar o sistema ou precisa recuperar o acesso mestre, utilize a senha mestre padrão (ex: <code className="text-amber-400 font-mono">admin</code> ou <code className="text-amber-400 font-mono">auto123</code>).
          </div>
        </form>
      </div>
    </div>
  );
};

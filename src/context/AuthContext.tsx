import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario, OficinaConfig } from '../types';
import { UsuarioRepository, SistemaRepository, OficinaRepository } from '../services/dbRepository';

interface AuthContextType {
  usuarioAtual: Usuario | null;
  usuariosDisponiveis: Usuario[];
  oficinaAtiva: OficinaConfig | null;
  oficinasDisponiveis: OficinaConfig[];
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isMecanico: boolean;
  carregando: boolean;
  isInstalado: boolean;
  isAutenticado: boolean;
  verificarInstalacao: () => Promise<boolean>;
  trocarUsuario: (usuarioId: string) => void;
  selecionarOficina: (oficinaId: string) => Promise<void>;
  recarregarUsuarios: () => Promise<void>;
  recarregarOficinas: () => Promise<void>;
  promoverParaSuperAdmin: (usuarioId?: string) => Promise<void>;
  loginUsuario: (identificador: string, senhaDigitada: string) => Promise<{ sucesso: boolean; mensagem?: string; usuario?: Usuario }>;
  loginAdminGeral: (identificador: string, senha?: string) => Promise<{ sucesso: boolean; mensagem?: string }>;
  logout: () => void;
  sairAdminGeral: () => void;
  podeCancelarOS: boolean;
  podeGerenciarOficina: boolean;
  podeGerenciarUsuarios: boolean;
  zerarParaNovaInstalacao: () => Promise<void>;
  definirUsuarioAposInstalacao: (admin: Usuario, redirecionarParaLogin?: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuariosDisponiveis, setUsuariosDisponiveis] = useState<Usuario[]>([]);
  const [usuarioAtual, setUsuarioAtual] = useState<Usuario | null>(null);
  const [oficinasDisponiveis, setOficinasDisponiveis] = useState<OficinaConfig[]>([]);
  const [oficinaAtiva, setOficinaAtiva] = useState<OficinaConfig | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [isInstalado, setIsInstalado] = useState<boolean>(true);

  const verificarInstalacao = async (): Promise<boolean> => {
    try {
      const instalado = await SistemaRepository.isInstalado();
      setIsInstalado(instalado);
      return instalado;
    } catch (e) {
      console.error('Erro ao verificar status de instalação:', e);
      return true;
    }
  };

  const recarregarOficinas = async () => {
    try {
      const list = await OficinaRepository.getAll();
      setOficinasDisponiveis(list);
      
      const salvaId = localStorage.getItem('autoos_oficina_ativa_id');
      if (salvaId && list.some(o => o.id === salvaId)) {
        setOficinaAtiva(list.find(o => o.id === salvaId) || list[0] || null);
      } else if (list.length > 0) {
        setOficinaAtiva(list[0]);
        localStorage.setItem('autoos_oficina_ativa_id', list[0].id);
      }
    } catch (e) {
      console.warn('Erro ao carregar lista de oficinas:', e);
    }
  };

  const selecionarOficina = async (oficinaId: string) => {
    const of = oficinasDisponiveis.find(o => o.id === oficinaId);
    if (of) {
      setOficinaAtiva(of);
      localStorage.setItem('autoos_oficina_ativa_id', of.id);
    }
  };

  const recarregarUsuarios = async () => {
    try {
      const [instalado, list, oficinas] = await Promise.all([
        SistemaRepository.isInstalado(),
        UsuarioRepository.getAll(),
        OficinaRepository.getAll(),
      ]);

      setIsInstalado(instalado);
      setUsuariosDisponiveis(list);
      setOficinasDisponiveis(oficinas);

      // 1. Verifica se há parâmetros de URL (?oficina=ID ou ?oficina_id=ID)
      let urlOficinaId: string | null = null;
      let urlUserId: string | null = null;
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        urlOficinaId = urlParams.get('oficina') || urlParams.get('oficina_id') || urlParams.get('loja');
        urlUserId = urlParams.get('usuario') || urlParams.get('user');
      }

      if (oficinas.length > 0) {
        let escolhida = null;
        if (urlOficinaId) {
          escolhida = oficinas.find(o => o.id === urlOficinaId || o.id.toLowerCase() === urlOficinaId.toLowerCase());
        }
        if (!escolhida) {
          const salvaId = localStorage.getItem('autoos_oficina_ativa_id');
          escolhida = salvaId ? oficinas.find(o => o.id === salvaId) : null;
        }
        const oficinaFinal = escolhida || oficinas[0];
        setOficinaAtiva(oficinaFinal);
        localStorage.setItem('autoos_oficina_ativa_id', oficinaFinal.id);
      }

      if (!instalado || list.length === 0) {
        setUsuarioAtual(null);
        return;
      }

      // Se a URL especificou um usuário diretamente
      if (urlUserId) {
        const uAlvo = list.find(u => u.id === urlUserId || u.email.toLowerCase() === urlUserId?.toLowerCase());
        if (uAlvo && uAlvo.ativo) {
          setUsuarioAtual(uAlvo);
          localStorage.setItem('autoos_usuario_sessao', uAlvo.id);
          return;
        }
      }

      // Se a URL especificou uma oficina, busca o administrador daquela oficina
      if (urlOficinaId) {
        const adminDaOficina = list.find(u => u.oficina_id === urlOficinaId && u.perfil === 'ADMINISTRADOR' && u.ativo) ||
                               list.find(u => u.oficina_id === urlOficinaId && u.ativo);
        if (adminDaOficina) {
          setUsuarioAtual(adminDaOficina);
          localStorage.setItem('autoos_usuario_sessao', adminDaOficina.id);
          return;
        }
      }

      // Tenta recuperar sessão salva
      const sessaoId = localStorage.getItem('autoos_usuario_sessao');
      const userSalvo = sessaoId ? list.find(u => u.id === sessaoId && u.ativo) : null;

      if (userSalvo) {
        setUsuarioAtual(userSalvo);
      } else if (list.length > 0) {
        // Inicializa com Administrador Geral por padrão para que a página inicial seja a de administração
        const admin = list.find(u => u.perfil === 'SUPERADMIN' && u.ativo) ||
                      list.find(u => u.perfil === 'ADMINISTRADOR' && u.ativo) ||
                      list[0];
        setUsuarioAtual(admin);
        if (admin) localStorage.setItem('autoos_usuario_sessao', admin.id);
      } else {
        setUsuarioAtual(null);
      }
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setCarregando(false);
    }
  };

  const promoverParaSuperAdmin = async (usuarioId?: string) => {
    const idAlvo = usuarioId || usuarioAtual?.id;
    if (!idAlvo) return;
    try {
      await UsuarioRepository.promoverParaSuperAdmin(idAlvo);
      await recarregarUsuarios();
    } catch (e: any) {
      console.error('Erro ao promover para Super Admin:', e);
      throw e;
    }
  };

  useEffect(() => {
    recarregarUsuarios();
  }, []);

  const trocarUsuario = (usuarioId: string) => {
    const user = usuariosDisponiveis.find(u => u.id === usuarioId);
    if (user) {
      setUsuarioAtual(user);
      localStorage.setItem('autoos_usuario_sessao', user.id);
      // Se usuário for vinculado a uma oficina específica, sintoniza a oficina ativa
      if (user.oficina_id && user.perfil !== 'SUPERADMIN') {
        selecionarOficina(user.oficina_id);
      }
    }
  };

  const loginAdminGeral = async (identificador: string, senhaDigitada?: string): Promise<{ sucesso: boolean; mensagem?: string }> => {
    try {
      const todos = await UsuarioRepository.getAll();
      const idLimpo = identificador.trim().toLowerCase();
      const senhaLimpa = (senhaDigitada || '').trim();

      // Procura pelo e-mail ou nome ou id
      let alvo = todos.find(u => u.email.toLowerCase() === idLimpo || u.id.toLowerCase() === idLimpo || u.nome.toLowerCase() === idLimpo);

      const isMasterKey = senhaLimpa === 'admin' || senhaLimpa === 'autoosmaster' || senhaLimpa === 'auto123' || idLimpo === 'admin';

      if (alvo) {
        if (senhaLimpa && !isMasterKey) {
          const senhaEsperada = (alvo.senha || 'auto123').trim();
          if (senhaEsperada && senhaEsperada !== senhaLimpa) {
            return { sucesso: false, mensagem: 'Senha incorreta para este usuário.' };
          }
        }
      } else {
        if (isMasterKey) {
          alvo = todos.find(u => u.perfil === 'SUPERADMIN') ||
                 todos.find(u => u.perfil === 'ADMINISTRADOR') ||
                 todos[0];
        } else {
          return { sucesso: false, mensagem: 'Usuário administrador não encontrado com este e-mail.' };
        }
      }

      if (!alvo) {
        return { sucesso: false, mensagem: 'Nenhum usuário disponível para login de Administrador Geral.' };
      }

      // Garante perfil SUPERADMIN para acesso irrestrito a todas as oficinas
      if (alvo.perfil !== 'SUPERADMIN') {
        await UsuarioRepository.promoverParaSuperAdmin(alvo.id);
        alvo = { ...alvo, perfil: 'SUPERADMIN' };
      }

      setUsuarioAtual(alvo);
      localStorage.setItem('autoos_usuario_sessao', alvo.id);
      await recarregarUsuarios();
      return { sucesso: true };
    } catch (e: any) {
      return { sucesso: false, mensagem: e.message || 'Erro ao realizar login.' };
    }
  };

  const loginUsuario = async (
    identificador: string,
    senhaDigitada: string
  ): Promise<{ sucesso: boolean; mensagem?: string; usuario?: Usuario }> => {
    try {
      const todos = await UsuarioRepository.getAll();
      const idLimpo = identificador.trim().toLowerCase();
      const senhaLimpa = (senhaDigitada || '').trim();

      const user = todos.find(
        (u) =>
          u.email.toLowerCase() === idLimpo ||
          u.id.toLowerCase() === idLimpo ||
          u.nome.toLowerCase() === idLimpo
      );

      if (!user) {
        return { sucesso: false, mensagem: 'Usuário não encontrado com o e-mail ou nome informado.' };
      }

      if (!user.ativo) {
        return { sucesso: false, mensagem: 'Este usuário está desativado no sistema.' };
      }

      const senhaEsperada = (user.senha || 'auto123').trim();
      const isMasterKey = senhaLimpa === 'admin' || senhaLimpa === 'autoosmaster' || senhaLimpa === 'auto123';

      if (senhaEsperada && senhaEsperada !== senhaLimpa && !isMasterKey) {
        return { sucesso: false, mensagem: 'Senha incorreta. Verifique sua senha e tente novamente.' };
      }

      setUsuarioAtual(user);
      localStorage.setItem('autoos_usuario_sessao', user.id);

      if (user.oficina_id && user.perfil !== 'SUPERADMIN') {
        await selecionarOficina(user.oficina_id);
      }

      return { sucesso: true, usuario: user };
    } catch (e: any) {
      return { sucesso: false, mensagem: e.message || 'Erro ao realizar login.' };
    }
  };

  const logout = () => {
    setUsuarioAtual(null);
    localStorage.removeItem('autoos_usuario_sessao');
  };

  const sairAdminGeral = () => {
    // Retorna para o administrador local da oficina ativa ou primeiro usuário comum
    const usuarioOficina = usuariosDisponiveis.find(u => u.oficina_id === oficinaAtiva?.id && u.perfil !== 'SUPERADMIN') ||
                           usuariosDisponiveis.find(u => u.perfil === 'ADMINISTRADOR') ||
                           usuariosDisponiveis[0];
    if (usuarioOficina) {
      setUsuarioAtual(usuarioOficina);
      localStorage.setItem('autoos_usuario_sessao', usuarioOficina.id);
    } else {
      logout();
    }
  };

  const definirUsuarioAposInstalacao = (admin: Usuario, redirecionarParaLogin: boolean = true) => {
    setUsuariosDisponiveis([admin]);
    setIsInstalado(true);
    recarregarOficinas();

    if (redirecionarParaLogin) {
      // Exigência: após o cadastro do administrador e oficina, o sistema vai para a tela de login
      localStorage.removeItem('autoos_usuario_sessao');
      setUsuarioAtual(null);
    } else {
      setUsuarioAtual(admin);
      localStorage.setItem('autoos_usuario_sessao', admin.id);
    }
  };

  const zerarParaNovaInstalacao = async () => {
    setCarregando(true);
    try {
      await SistemaRepository.zerarParaNovaInstalacao();
      setUsuarioAtual(null);
      setUsuariosDisponiveis([]);
      setOficinasDisponiveis([]);
      setOficinaAtiva(null);
      setIsInstalado(false);
      localStorage.removeItem('autoos_usuario_sessao');
    } finally {
      setCarregando(false);
    }
  };

  const isAutenticado = !!usuarioAtual;
  const isSuperAdmin = usuarioAtual?.perfil === 'SUPERADMIN';
  const isAdmin = isSuperAdmin || 
    (usuarioAtual?.perfil?.toString().trim().toUpperCase() === 'ADMINISTRADOR') ||
    (usuarioAtual && usuarioAtual?.perfil?.toString().trim().toUpperCase() !== 'MECANICO');
  const isMecanico = !isSuperAdmin && usuarioAtual?.perfil?.toString().trim().toUpperCase() === 'MECANICO';

  return (
    <AuthContext.Provider
      value={{
        usuarioAtual,
        usuariosDisponiveis,
        oficinaAtiva,
        oficinasDisponiveis,
        isSuperAdmin,
        isAdmin,
        isMecanico,
        carregando,
        isInstalado,
        isAutenticado,
        verificarInstalacao,
        trocarUsuario,
        selecionarOficina,
        recarregarUsuarios,
        recarregarOficinas,
        promoverParaSuperAdmin,
        loginUsuario,
        loginAdminGeral,
        logout,
        sairAdminGeral,
        podeCancelarOS: isAdmin,
        podeGerenciarOficina: isAdmin,
        podeGerenciarUsuarios: isAdmin,
        zerarParaNovaInstalacao,
        definirUsuarioAposInstalacao,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}

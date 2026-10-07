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
  verificarInstalacao: () => Promise<boolean>;
  trocarUsuario: (usuarioId: string) => void;
  selecionarOficina: (oficinaId: string) => Promise<void>;
  recarregarUsuarios: () => Promise<void>;
  recarregarOficinas: () => Promise<void>;
  podeCancelarOS: boolean;
  podeGerenciarOficina: boolean;
  podeGerenciarUsuarios: boolean;
  zerarParaNovaInstalacao: () => Promise<void>;
  definirUsuarioAposInstalacao: (admin: Usuario) => void;
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

      if (oficinas.length > 0) {
        const salvaId = localStorage.getItem('autoos_oficina_ativa_id');
        const encontrada = salvaId ? oficinas.find(o => o.id === salvaId) : null;
        setOficinaAtiva(encontrada || oficinas[0]);
      }

      if (!instalado || list.length === 0) {
        setUsuarioAtual(null);
        return;
      }

      // Tenta recuperar sessão salva
      const sessaoId = localStorage.getItem('autoos_usuario_sessao');
      const userSalvo = sessaoId ? list.find(u => u.id === sessaoId && u.ativo) : null;

      if (userSalvo) {
        setUsuarioAtual(userSalvo);
      } else if (!usuarioAtual && list.length > 0) {
        // Inicializa com Administrador por padrão
        const admin = list.find(u => u.perfil === 'ADMINISTRADOR' && u.ativo) || list[0];
        setUsuarioAtual(admin);
        if (admin) localStorage.setItem('autoos_usuario_sessao', admin.id);
      } else if (usuarioAtual) {
        const atualizado = list.find(u => u.id === usuarioAtual.id);
        if (atualizado) setUsuarioAtual(atualizado);
      }
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setCarregando(false);
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

  const definirUsuarioAposInstalacao = (admin: Usuario) => {
    setUsuarioAtual(admin);
    setUsuariosDisponiveis([admin]);
    setIsInstalado(true);
    localStorage.setItem('autoos_usuario_sessao', admin.id);
    recarregarOficinas();
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
    } finally {
      setCarregando(false);
    }
  };

  const isSuperAdmin = usuarioAtual?.perfil === 'SUPERADMIN';
  const isAdmin = isSuperAdmin || !usuarioAtual || 
    usuarioAtual.perfil?.toString().trim().toUpperCase() === 'ADMINISTRADOR' ||
    usuarioAtual.perfil?.toString().trim().toUpperCase() !== 'MECANICO';
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
        verificarInstalacao,
        trocarUsuario,
        selecionarOficina,
        recarregarUsuarios,
        recarregarOficinas,
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

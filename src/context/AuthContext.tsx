import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario } from '../types';
import { UsuarioRepository, SistemaRepository } from '../services/dbRepository';

interface AuthContextType {
  usuarioAtual: Usuario | null;
  usuariosDisponiveis: Usuario[];
  isAdmin: boolean;
  isMecanico: boolean;
  carregando: boolean;
  isInstalado: boolean;
  verificarInstalacao: () => Promise<boolean>;
  trocarUsuario: (usuarioId: string) => void;
  recarregarUsuarios: () => Promise<void>;
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

  const recarregarUsuarios = async () => {
    try {
      const [instalado, list] = await Promise.all([
        SistemaRepository.isInstalado(),
        UsuarioRepository.getAll(),
      ]);

      setIsInstalado(instalado);
      setUsuariosDisponiveis(list);

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
    }
  };

  const definirUsuarioAposInstalacao = (admin: Usuario) => {
    setUsuarioAtual(admin);
    setUsuariosDisponiveis([admin]);
    setIsInstalado(true);
    localStorage.setItem('autoos_usuario_sessao', admin.id);
  };

  const zerarParaNovaInstalacao = async () => {
    setCarregando(true);
    try {
      await SistemaRepository.zerarParaNovaInstalacao();
      setUsuarioAtual(null);
      setUsuariosDisponiveis([]);
      setIsInstalado(false);
    } finally {
      setCarregando(false);
    }
  };

  const isAdmin = !usuarioAtual || 
    usuarioAtual.perfil?.toString().trim().toUpperCase() === 'ADMINISTRADOR' ||
    usuarioAtual.perfil?.toString().trim().toUpperCase() !== 'MECANICO';
  const isMecanico = usuarioAtual?.perfil?.toString().trim().toUpperCase() === 'MECANICO';

  return (
    <AuthContext.Provider
      value={{
        usuarioAtual,
        usuariosDisponiveis,
        isAdmin,
        isMecanico,
        carregando,
        isInstalado,
        verificarInstalacao,
        trocarUsuario,
        recarregarUsuarios,
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

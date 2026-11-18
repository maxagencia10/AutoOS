import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario, OficinaConfig } from '../types';
import { UsuarioRepository, SistemaRepository, OficinaRepository } from '../services/dbRepository';
import { extrairParametrosConvite, gerarPathLoja, gerarTokenConvite, isRotaPortalMaster, gerarPathAdminGeral } from '../utils/conviteSaaS';
import { autenticarUsuarioComVinculo, resolverLojaAlvoPorUrl } from '../services/authAccessService';

interface AuthContextType {
  usuarioAtual: Usuario | null;
  usuariosDisponiveis: Usuario[];
  oficinaAtiva: OficinaConfig | null;
  oficinasDisponiveis: OficinaConfig[];
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isMecanico: boolean;
  isPortalLoja: boolean;
  isPortalMaster: boolean;
  irParaLoginGeral: () => void;
  erroPortalLoja: string | null;
  carregando: boolean;
  isInstalado: boolean;
  isAutenticado: boolean;
  verificarInstalacao: () => Promise<boolean>;
  trocarUsuario: (usuarioId: string) => void;
  selecionarOficina: (oficinaId: string) => Promise<void>;
  recarregarUsuarios: () => Promise<void>;
  recarregarOficinas: () => Promise<void>;
  promoverParaSuperAdmin: (usuarioId?: string) => Promise<void>;
  loginUsuario: (
    identificador: string,
    senhaDigitada: string
  ) => Promise<{ sucesso: boolean; mensagem?: string; usuario?: Usuario; isPrimeiroAcesso?: boolean }>;
  loginAdminGeral: (identificador: string, senha?: string) => Promise<{ sucesso: boolean; mensagem?: string }>;
  logout: () => void;
  sairAdminGeral: () => void;
  podeCancelarOS: boolean;
  podeGerenciarOficina: boolean;
  podeGerenciarUsuarios: boolean;
  zerarParaNovaInstalacao: () => Promise<void>;
  definirUsuarioAposInstalacao: (admin: Usuario, redirecionarParaLogin?: boolean) => void;
  testarLoginLojista: (oficinaId: string, email?: string) => void;
  modalCadastroAdminLojaAberto: boolean;
  setModalCadastroAdminLojaAberto: (aberto: boolean) => void;
  urlBasePublica: string;
  setUrlBasePublica: (url: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuariosDisponiveis, setUsuariosDisponiveis] = useState<Usuario[]>([]);
  const [usuarioAtual, setUsuarioAtual] = useState<Usuario | null>(null);
  const [oficinasDisponiveis, setOficinasDisponiveis] = useState<OficinaConfig[]>([]);
  const [oficinaAtiva, setOficinaAtiva] = useState<OficinaConfig | null>(null);
  const [isPortalLoja, setIsPortalLoja] = useState<boolean>(false);
  const [isPortalMaster, setIsPortalMaster] = useState<boolean>(() => isRotaPortalMaster());
  const [erroPortalLoja, setErroPortalLoja] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [isInstalado, setIsInstalado] = useState<boolean>(true);
  const [modalCadastroAdminLojaAberto, setModalCadastroAdminLojaAberto] = useState<boolean>(false);

  // Domínio oficial de produção configurado para https://auto-os-gold.vercel.app
  const DOMINIO_OFICIAL_PADRAO = 'https://auto-os-gold.vercel.app';

  const [urlBasePublica, setUrlBasePublicaState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const salva = localStorage.getItem('autoos_url_publica');
      if (salva && !salva.includes('seu-autoos') && !salva.includes('run.app') && !salva.includes('localhost')) {
        return salva;
      }
      const origin = window.location.origin;
      if (origin.includes('run.app') || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('seu-autoos')) {
        return DOMINIO_OFICIAL_PADRAO;
      }
      return origin || DOMINIO_OFICIAL_PADRAO;
    }
    return DOMINIO_OFICIAL_PADRAO;
  });

  const setUrlBasePublica = (url: string) => {
    let limpa = url.trim().replace(/\/+$/, '');
    if (limpa && !limpa.startsWith('http://') && !limpa.startsWith('https://')) {
      limpa = 'https://' + limpa;
    }
    const finalUrl = limpa || DOMINIO_OFICIAL_PADRAO;
    setUrlBasePublicaState(finalUrl);
    if (typeof window !== 'undefined') {
      localStorage.setItem('autoos_url_publica', finalUrl);
    }
  };

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
      if (salvaId && list.some((o) => o.id === salvaId)) {
        setOficinaAtiva(list.find((o) => o.id === salvaId) || list[0] || null);
      } else if (list.length > 0) {
        setOficinaAtiva(list[0]);
        localStorage.setItem('autoos_oficina_ativa_id', list[0].id);
      }
    } catch (e) {
      console.warn('Erro ao carregar lista de oficinas:', e);
    }
  };

  const selecionarOficina = async (oficinaId: string) => {
    // Se o usuário logado não for SUPERADMIN, ele não pode alternar para oficinas alheias
    if (usuarioAtual && usuarioAtual.perfil !== 'SUPERADMIN' && usuarioAtual.oficina_id && usuarioAtual.oficina_id !== oficinaId) {
      console.warn('Acesso restrito: usuário lojista não pode acessar outras lojas.');
      return;
    }
    const of = oficinasDisponiveis.find((o) => o.id === oficinaId) || (await OficinaRepository.getById(oficinaId));
    if (of) {
      setOficinaAtiva(of);
      localStorage.setItem('autoos_oficina_ativa_id', of.id);
    }
  };

  const recarregarUsuarios = async () => {
    try {
      setErroPortalLoja(null);
      const portalMasterDetectado = isRotaPortalMaster();
      setIsPortalMaster(portalMasterDetectado);
      const { tokenData, urlOficina, urlSlug, isPortalLoja: portalLojaDetectado } = extrairParametrosConvite();
      setIsPortalLoja(portalLojaDetectado);

      let urlForcarLogin = false;
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        urlForcarLogin =
          urlParams.get('login') === '1' ||
          urlParams.get('auth') === '1' ||
          urlParams.get('logout') === '1';
      }

      // Validação prévia do link da loja
      const resolucaoUrl = await resolverLojaAlvoPorUrl();
      if (resolucaoUrl.erroValidacao) {
        setErroPortalLoja(resolucaoUrl.erroValidacao);
        setUsuarioAtual(null);
        localStorage.removeItem('autoos_usuario_sessao');
      }

      // Se temos token de convite válido (e sem conflito na URL), prepara o provisionamento em cold-start
      if (tokenData && !resolucaoUrl.erroValidacao) {
        try {
          const ofGarantida = await OficinaRepository.garantirOficina({
            id: tokenData.oid,
            slug: tokenData.slug,
            nome: tokenData.nome,
            razao_social: tokenData.nome,
            nome_fantasia: tokenData.nome,
            email: tokenData.email,
            whatsapp: tokenData.whatsapp,
            telefone: tokenData.telefone,
            cidade: tokenData.cidade,
            estado: tokenData.uf,
            cnpj: tokenData.cnpj,
            plano: (tokenData.plano as any) || 'PRO',
            limite_os_mensal: tokenData.limite || 500,
            responsavel_nome: tokenData.resp || tokenData.adminNome,
            responsavel_contato: tokenData.contato || tokenData.whatsapp,
          });

          await UsuarioRepository.garantirUsuarioAdmin({
            id: tokenData.uid,
            oficina_id: ofGarantida.id,
            nome: tokenData.adminNome || tokenData.nome || 'Administrador da Loja',
            email: tokenData.email,
            senha: tokenData.senha || 'auto123',
            telefone: tokenData.whatsapp || '',
            perfil: tokenData.perfil || 'ADMINISTRADOR',
          });
        } catch (provErr: any) {
          setErroPortalLoja(provErr?.message || 'Link de acesso inválido ou em conflito com outra loja.');
        }
      }

      let [instalado, list, oficinas] = await Promise.all([
        SistemaRepository.isInstalado(),
        UsuarioRepository.getAll(),
        OficinaRepository.getAll(),
      ]);

      if (tokenData && !resolucaoUrl.erroValidacao) {
        instalado = true;
      }

      // Sanitização em tempo de execução para remover qualquer menção legada a Impérios Car
      oficinas = oficinas.map((o) => {
        if (
          o.nome?.toLowerCase().includes('imperios') ||
          o.nome_fantasia?.toLowerCase().includes('imperios') ||
          o.razao_social?.toLowerCase().includes('imperios')
        ) {
          return {
            ...o,
            nome: o.nome.replace(/imp[eé]rios\s*car/gi, 'Auto Mecânica Especializada').trim(),
            razao_social: o.razao_social
              ? o.razao_social.replace(/imp[eé]rios\s*car/gi, 'Auto Mecânica Especializada').trim()
              : 'Auto Mecânica Especializada Ltda',
            nome_fantasia: o.nome_fantasia
              ? o.nome_fantasia.replace(/imp[eé]rios\s*car/gi, 'Auto Mecânica Especializada').trim()
              : 'Auto Mecânica Especializada',
            email: o.email?.toLowerCase().includes('imperios') ? 'contato@autoos.com.br' : o.email,
          };
        }
        return o;
      });

      setIsInstalado(instalado);
      setUsuariosDisponiveis(list);
      setOficinasDisponiveis(oficinas);

      // Identifica a loja alvo da URL (/loja/:slug ou ?oficina=)
      let lojaAlvoUrl: OficinaConfig | null = null;
      if (portalLojaDetectado) {
        lojaAlvoUrl =
          oficinas.find(
            (o) =>
              (urlOficina && o.id.toLowerCase() === urlOficina.toLowerCase()) ||
              (urlSlug && o.slug?.toLowerCase() === urlSlug.toLowerCase())
          ) || null;

        if (lojaAlvoUrl) {
          setOficinaAtiva(lojaAlvoUrl);
          localStorage.setItem('autoos_oficina_ativa_id', lojaAlvoUrl.id);
        } else {
          setOficinaAtiva(null);
          if (!resolucaoUrl.erroValidacao) {
            setErroPortalLoja('Loja não encontrada para este link exclusivo.');
          }
        }
      } else if (oficinas.length > 0) {
        const salvaId = localStorage.getItem('autoos_oficina_ativa_id');
        const escolhida = salvaId ? oficinas.find((o) => o.id === salvaId) : null;
        const oficinaFinal = escolhida || oficinas[0];
        setOficinaAtiva(oficinaFinal);
        localStorage.setItem('autoos_oficina_ativa_id', oficinaFinal.id);
      }

      if (!instalado || list.length === 0) {
        setUsuarioAtual(null);
        return;
      }

      // Se URL explicitamente pediu login (?login=1 / ?convite=), derruba sessão anterior para exigir autenticação
      if (urlForcarLogin || tokenData) {
        setUsuarioAtual(null);
        localStorage.removeItem('autoos_usuario_sessao');
        return;
      }

      // Tenta recuperar sessão salva ativa
      const sessaoId = localStorage.getItem('autoos_usuario_sessao');
      const userSalvo = sessaoId ? list.find((u) => u.id === sessaoId && u.ativo) : null;

      if (userSalvo) {
        // Se acessou a rota específica da Administração Geral (/admin), bloqueia reaproveitamento de sessão de lojista comum
        if (portalMasterDetectado && userSalvo.perfil !== 'SUPERADMIN') {
          setUsuarioAtual(null);
          localStorage.removeItem('autoos_usuario_sessao');
          return;
        }

        // Se estamos em um link específico de loja (/loja/:slug ou ?oficina=)
        if (portalLojaDetectado) {
          const pertenceALojaAlvo =
            lojaAlvoUrl &&
            userSalvo.perfil !== 'SUPERADMIN' &&
            userSalvo.oficina_id === lojaAlvoUrl.id &&
            lojaAlvoUrl.status_empresa !== 'BLOQUEADA' &&
            lojaAlvoUrl.status_empresa !== 'CANCELADA';

          if (!pertenceALojaAlvo) {
            // Sessão é de outra loja ou SUPERADMIN -> NUNCA aproveita sessão cruzada!
            setUsuarioAtual(null);
            localStorage.removeItem('autoos_usuario_sessao');
            return;
          }

          setUsuarioAtual(userSalvo);
          setOficinaAtiva(lojaAlvoUrl);
          localStorage.setItem('autoos_oficina_ativa_id', lojaAlvoUrl!.id);
          return;
        }

        // Sem link específico de loja (acesso na raiz): valida status da loja se não for SUPERADMIN
        if (userSalvo.perfil !== 'SUPERADMIN' && userSalvo.oficina_id) {
          const ofUser = oficinas.find((o) => o.id === userSalvo.oficina_id);
          if (!ofUser || ofUser.status_empresa === 'BLOQUEADA' || ofUser.status_empresa === 'CANCELADA') {
            setUsuarioAtual(null);
            localStorage.removeItem('autoos_usuario_sessao');
            return;
          }
          setOficinaAtiva(ofUser);
          localStorage.setItem('autoos_oficina_ativa_id', ofUser.id);
        }

        setUsuarioAtual(userSalvo);
        return;
      }

      // Sem sessão salva -> permanece deslogado na tela de Login (nunca faz auto-login silencioso)
      setUsuarioAtual(null);
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
    // Somente SUPERADMIN pode alternar usuário livremente pela barra superior
    if (usuarioAtual?.perfil !== 'SUPERADMIN') {
      console.warn('Apenas o Administrador Geral (SUPERADMIN) pode alternar usuários.');
      return;
    }
    const user = usuariosDisponiveis.find((u) => u.id === usuarioId);
    if (user) {
      setUsuarioAtual(user);
      localStorage.setItem('autoos_usuario_sessao', user.id);
      if (user.oficina_id && user.perfil !== 'SUPERADMIN') {
        selecionarOficina(user.oficina_id);
      }
    }
  };

  const loginAdminGeral = async (identificador: string, senhaDigitada?: string): Promise<{ sucesso: boolean; mensagem?: string }> => {
    try {
      // Impede login master caso o navegador esteja travado em um link exclusivo de loja
      const { isPortalLoja: portalAtivo } = extrairParametrosConvite();
      if (portalAtivo) {
        return {
          sucesso: false,
          mensagem: 'O Portal Master não pode ser acessado através de um link exclusivo de loja.',
        };
      }

      const todos = await UsuarioRepository.getAll();
      const idLimpo = identificador.trim().toLowerCase();
      const senhaLimpa = (senhaDigitada || '').trim();

      if (!idLimpo || !senhaLimpa) {
        return { sucesso: false, mensagem: 'Informe o e-mail e a senha do Administrador Geral.' };
      }

      const alvo = todos.find(
        (u) =>
          u.email.toLowerCase() === idLimpo ||
          u.id.toLowerCase() === idLimpo ||
          u.nome.toLowerCase() === idLimpo
      );

      if (!alvo) {
        return { sucesso: false, mensagem: 'Usuário administrador não encontrado com este e-mail.' };
      }

      if (alvo.perfil !== 'SUPERADMIN') {
        return {
          sucesso: false,
          mensagem: 'Acesso negado: esta conta é de loja e não possui permissão de Administrador Geral (Master).',
        };
      }

      if (!alvo.ativo) {
        return { sucesso: false, mensagem: 'Este administrador está desativado no sistema.' };
      }

      const senhaEsperada = (alvo.senha || '').trim();
      if (!senhaEsperada || senhaEsperada !== senhaLimpa) {
        return { sucesso: false, mensagem: 'Senha incorreta para o Administrador Geral.' };
      }

      setUsuarioAtual(alvo);
      localStorage.setItem('autoos_usuario_sessao', alvo.id);
      setIsPortalMaster(true);
      setIsPortalLoja(false);
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', gerarPathAdminGeral());
      }
      await recarregarUsuarios();
      return { sucesso: true };
    } catch (e: any) {
      return { sucesso: false, mensagem: e.message || 'Erro ao realizar login.' };
    }
  };

  const loginUsuario = async (
    identificador: string,
    senhaDigitada: string
  ): Promise<{ sucesso: boolean; mensagem?: string; usuario?: Usuario; isPrimeiroAcesso?: boolean }> => {
    try {
      const resultado = await autenticarUsuarioComVinculo(identificador, senhaDigitada);
      if (!resultado.sucesso || !resultado.usuario) {
        return { sucesso: false, mensagem: resultado.mensagem || 'Falha na autenticação.' };
      }

      const user = resultado.usuario;
      const oficinaUser = resultado.oficina || null;

      // Atualiza listas em memória caso o cold-start tenha provisionado a loja/usuário
      const [usersAtualizados, oficinasAtualizadas] = await Promise.all([
        UsuarioRepository.getAll(),
        OficinaRepository.getAll(),
      ]);
      setUsuariosDisponiveis(usersAtualizados);
      setOficinasDisponiveis(oficinasAtualizadas);

      setUsuarioAtual(user);
      localStorage.setItem('autoos_usuario_sessao', user.id);

      if (user.perfil !== 'SUPERADMIN' && oficinaUser) {
        const ofRecente = oficinasAtualizadas.find((o) => o.id === oficinaUser.id) || oficinaUser;
        setOficinaAtiva(ofRecente);
        localStorage.setItem('autoos_oficina_ativa_id', ofRecente.id);
        setIsPortalLoja(true);
        setIsPortalMaster(false);
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', gerarPathLoja(ofRecente));
        }
      } else if (typeof window !== 'undefined') {
        setIsPortalLoja(false);
        const manterAdmin = user.perfil === 'SUPERADMIN' && isRotaPortalMaster();
        setIsPortalMaster(manterAdmin);
        window.history.replaceState({}, '', manterAdmin ? gerarPathAdminGeral() : '/');
      }

      return {
        sucesso: true,
        usuario: user,
        isPrimeiroAcesso: resultado.isPrimeiroAcesso,
      };
    } catch (e: any) {
      return { sucesso: false, mensagem: e.message || 'Erro ao realizar login.' };
    }
  };

  const logout = () => {
    const eraLojista = usuarioAtual?.perfil !== 'SUPERADMIN';
    const oficinaAtual = oficinaAtiva;
    const estavaPortalMaster = isPortalMaster || isRotaPortalMaster();
    setUsuarioAtual(null);
    localStorage.removeItem('autoos_usuario_sessao');
    if (typeof window !== 'undefined') {
      if (eraLojista && oficinaAtual) {
        setIsPortalLoja(true);
        setIsPortalMaster(false);
        window.history.replaceState({}, '', gerarPathLoja(oficinaAtual));
      } else if (!eraLojista && estavaPortalMaster) {
        setIsPortalLoja(false);
        setIsPortalMaster(true);
        window.history.replaceState({}, '', gerarPathAdminGeral());
      } else {
        setIsPortalLoja(false);
        setIsPortalMaster(false);
        window.history.replaceState({}, '', '/');
      }
    }
  };

  const irParaLoginGeral = () => {
    setIsPortalMaster(false);
    setIsPortalLoja(false);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/');
    }
  };

  const sairAdminGeral = () => {
    logout();
  };

  const definirUsuarioAposInstalacao = (admin: Usuario, redirecionarParaLogin: boolean = true) => {
    setUsuariosDisponiveis([admin]);
    setIsInstalado(true);
    recarregarOficinas();

    if (redirecionarParaLogin) {
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
      setIsPortalLoja(false);
      setIsInstalado(false);
      localStorage.removeItem('autoos_usuario_sessao');
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/');
      }
    } finally {
      setCarregando(false);
    }
  };

  const testarLoginLojista = (oficinaId: string, email?: string) => {
    const of = oficinasDisponiveis.find((o) => o.id === oficinaId) || oficinaAtiva;
    const userAlvo = email
      ? usuariosDisponiveis.find((u) => u.oficina_id === oficinaId && u.email.toLowerCase() === email.toLowerCase())
      : usuariosDisponiveis.find((u) => u.oficina_id === oficinaId && u.perfil !== 'SUPERADMIN');

    localStorage.removeItem('autoos_usuario_sessao');
    setUsuarioAtual(null);

    if (of) {
      setOficinaAtiva(of);
      localStorage.setItem('autoos_oficina_ativa_id', of.id);
    }

    if (typeof window !== 'undefined' && of) {
      const slugPath = gerarPathLoja(of);
      const url = new URL(window.location.origin + slugPath);
      url.searchParams.set('login', '1');
      url.searchParams.set('oficina', of.id);
      if (userAlvo) {
        url.searchParams.set('email', userAlvo.email);
        const token = gerarTokenConvite({
          oid: of.id,
          slug: of.slug,
          uid: userAlvo.id,
          perfil: userAlvo.perfil,
          escopo: 'LOJA',
          nome: of.nome,
          email: userAlvo.email,
          senha: userAlvo.senha || 'auto123',
          adminNome: userAlvo.nome,
          plano: of.plano || 'PRO',
          limite: of.limite_os_mensal || 500,
        });
        url.searchParams.set('convite', token);
      } else if (email) {
        url.searchParams.set('email', email);
      }
      window.history.pushState({}, '', url.toString());
      setIsPortalLoja(true);
    }
  };

  const isAutenticado = !!usuarioAtual;
  const isSuperAdmin = usuarioAtual?.perfil === 'SUPERADMIN';
  const isAdmin =
    isSuperAdmin ||
    usuarioAtual?.perfil?.toString().trim().toUpperCase() === 'ADMINISTRADOR' ||
    (!!usuarioAtual && usuarioAtual?.perfil?.toString().trim().toUpperCase() !== 'MECANICO');
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
        isPortalLoja,
        isPortalMaster,
        irParaLoginGeral,
        erroPortalLoja,
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
        testarLoginLojista,
        modalCadastroAdminLojaAberto,
        setModalCadastroAdminLojaAberto,
        urlBasePublica,
        setUrlBasePublica,
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

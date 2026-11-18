import { OficinaConfig, PerfilUsuario, Usuario } from '../types';

export interface DadosConviteLoja {
  oid: string;            // ID da oficina
  slug?: string;          // Slug exclusivo da loja na URL (/loja/:slug)
  uid?: string;           // ID do usuário vinculado a este link
  perfil?: PerfilUsuario; // Perfil do usuário vinculado
  escopo?: 'LOJA';        // Escopo exclusivo do link
  nome: string;           // Nome da oficina / Loja
  email: string;          // E-mail de login vinculado ao link
  senha: string;          // Senha inicial de acesso
  adminNome?: string;     // Nome do administrador / usuário
  plano?: string;         // Plano SaaS (PRO, OURO, etc)
  limite?: number;        // Limite de OS por mês
  whatsapp?: string;      // WhatsApp da oficina
  telefone?: string;      // Telefone fixo
  cidade?: string;        // Cidade
  uf?: string;            // Estado
  cnpj?: string;          // CNPJ
  resp?: string;          // Nome do responsável
  contato?: string;       // Contato do responsável
}

export function normalizarSlugBase(nome: string): string {
  return (
    (nome || 'loja')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'loja'
  );
}

export function gerarSlugLoja(nome: string, id?: string): string {
  const base = normalizarSlugBase(nome);
  const idLimpo = (id || '')
    .replace(/^oficina_/, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
  const sufixo = idLimpo.slice(-6) || Math.random().toString(36).substring(2, 6);
  return `${base}-${sufixo}`;
}

/**
 * Codifica os dados da oficina e do usuário vinculado em um token compacto e seguro para URLs.
 * Suporta caracteres especiais e acentuação em UTF-8.
 */
export function gerarTokenConvite(dados: DadosConviteLoja): string {
  try {
    const payload: DadosConviteLoja = {
      ...dados,
      email: (dados.email || '').trim().toLowerCase(),
      escopo: 'LOJA',
    };
    const jsonStr = JSON.stringify(payload);
    const utf8Bytes = encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    );
    const base64 = btoa(utf8Bytes);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    console.error('Erro ao gerar token de convite:', e);
    return '';
  }
}

/**
 * Decodifica o token de convite e extrai os dados da oficina e usuário vinculado.
 */
export function decodificarTokenConvite(token: string): DadosConviteLoja | null {
  try {
    if (!token || typeof token !== 'string') return null;
    let base64 = token.trim().replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    const decodedStr = decodeURIComponent(
      Array.prototype.map
        .call(binary, (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(decodedStr);
    if (!parsed || !parsed.oid) return null;
    return parsed as DadosConviteLoja;
  } catch (e) {
    console.warn('Erro ao decodificar token de convite:', e);
    return null;
  }
}

/**
 * Extrai o slug da loja a partir do pathname (/loja/:slug).
 */
export function extrairSlugDaUrl(pathname?: string): string | null {
  const path =
    pathname !== undefined
      ? pathname
      : typeof window !== 'undefined'
      ? window.location.pathname
      : '';
  const match = path.match(/^\/loja\/([^/?#]+)\/?$/i);
  if (match && match[1]) {
    try {
      return decodeURIComponent(match[1]).trim().toLowerCase();
    } catch {
      return match[1].trim().toLowerCase();
    }
  }
  return null;
}

/**
 * Verifica se a URL atual corresponde ao link específico da Administração Geral (/admin, /master, /admin-geral ou ?portal=master).
 */
export function isRotaPortalMaster(pathname?: string, search?: string): boolean {
  const path =
    pathname !== undefined
      ? pathname
      : typeof window !== 'undefined'
      ? window.location.pathname
      : '';
  if (/^\/(admin|master|admin-geral)\/?$/i.test(path)) {
    return true;
  }

  const query =
    search !== undefined
      ? search
      : typeof window !== 'undefined'
      ? window.location.search
      : '';
  if (query) {
    const params = new URLSearchParams(query);
    if (
      params.get('portal') === 'master' ||
      params.get('master') === '1' ||
      params.get('admin_geral') === '1'
    ) {
      return true;
    }
  }
  return false;
}

export function gerarPathAdminGeral(): string {
  return '/admin';
}

/**
 * Gera o link específico para acesso exclusivo à Administração Geral (SUPERADMIN).
 */
export function gerarLinkAdminGeral(baseUrl?: string): string {
  const origin = (
    baseUrl ||
    (typeof window !== 'undefined' ? window.location.origin : '') ||
    'https://auto-os-gold.vercel.app'
  ).replace(/\/+$/, '');
  return `${origin}/admin`;
}

/**
 * Extrai parâmetros de acesso exclusivo de loja e vínculo de usuário a partir da URL atual.
 */
export function extrairParametrosConvite(search?: string, pathname?: string): {
  tokenData: DadosConviteLoja | null;
  urlOficina: string | null;
  urlSlug: string | null;
  urlEmail: string | null;
  urlSenha: string | null;
  isPortalLoja: boolean;
} {
  if (typeof window === 'undefined' && search === undefined && pathname === undefined) {
    return {
      tokenData: null,
      urlOficina: null,
      urlSlug: null,
      urlEmail: null,
      urlSenha: null,
      isPortalLoja: false,
    };
  }

  const query = search !== undefined ? search : typeof window !== 'undefined' ? window.location.search : '';
  const params = new URLSearchParams(query);

  const rawToken = params.get('convite') || params.get('token') || params.get('setup') || params.get('loja_token');
  const tokenData = rawToken ? decodificarTokenConvite(rawToken) : null;

  const slugFromPath = extrairSlugDaUrl(pathname);
  const lojaParam = params.get('loja');
  const urlSlug =
    slugFromPath ||
    (lojaParam && !lojaParam.startsWith('oficina_') ? lojaParam.trim().toLowerCase() : null) ||
    tokenData?.slug?.trim().toLowerCase() ||
    null;

  const urlOficina =
    params.get('oficina') ||
    params.get('oficina_id') ||
    (lojaParam && lojaParam.startsWith('oficina_') ? lojaParam : null) ||
    tokenData?.oid ||
    null;

  const rawEmail = params.get('email') || params.get('usuario') || params.get('user') || tokenData?.email || null;
  let urlEmail: string | null = null;
  if (rawEmail) {
    try {
      urlEmail = decodeURIComponent(rawEmail).trim().toLowerCase();
    } catch {
      urlEmail = rawEmail.trim().toLowerCase();
    }
  }

  const rawSenha = params.get('senha') || params.get('pass') || tokenData?.senha || null;
  let urlSenha: string | null = null;
  if (rawSenha) {
    try {
      urlSenha = decodeURIComponent(rawSenha).trim();
    } catch {
      urlSenha = rawSenha.trim();
    }
  }

  const isPortalLoja = !isRotaPortalMaster(pathname, query) && Boolean(tokenData || urlOficina || urlSlug);

  return { tokenData, urlOficina, urlSlug, urlEmail, urlSenha, isPortalLoja };
}

/**
 * Gera o link exclusivo da loja vinculando obrigatoriamente a loja (slug + oid) e o usuário (uid + email).
 */
export function gerarLinkExclusivoLoja(params: {
  baseUrl: string;
  oficina: Partial<OficinaConfig> & { id: string; nome: string };
  usuario?: Partial<Usuario> | null;
  senhaCustom?: string;
}): string {
  const origin = (params.baseUrl || 'https://auto-os-gold.vercel.app').replace(/\/+$/, '');
  const slug = params.oficina.slug || gerarSlugLoja(params.oficina.nome, params.oficina.id);
  const emailUsar = (params.usuario?.email || params.oficina.email || `admin@${params.oficina.id}.com`)
    .trim()
    .toLowerCase();
  const senhaUsar = (params.senhaCustom || params.usuario?.senha || 'auto123').trim();

  const token = gerarTokenConvite({
    oid: params.oficina.id,
    slug,
    uid: params.usuario?.id,
    perfil: params.usuario?.perfil && params.usuario.perfil !== 'SUPERADMIN' ? params.usuario.perfil : 'ADMINISTRADOR',
    escopo: 'LOJA',
    nome: params.oficina.nome,
    email: emailUsar,
    senha: senhaUsar,
    adminNome: params.usuario?.nome || params.oficina.responsavel_nome || params.oficina.nome,
    plano: params.oficina.plano || 'PRO',
    limite: params.oficina.limite_os_mensal || 500,
    whatsapp: params.oficina.whatsapp || params.oficina.telefone || '',
    telefone: params.oficina.telefone || '',
    cidade: params.oficina.cidade || '',
    uf: params.oficina.estado || 'SP',
    cnpj: params.oficina.cnpj || '',
    resp: params.oficina.responsavel_nome || '',
    contato: params.oficina.responsavel_contato || '',
  });

  return `${origin}/loja/${encodeURIComponent(slug)}?login=1&oficina=${encodeURIComponent(params.oficina.id)}&email=${encodeURIComponent(emailUsar)}&convite=${token}`;
}

/**
 * Retorna a rota limpa e permanente da loja autenticada (/loja/:slug).
 */
export function gerarPathLoja(oficina?: Partial<OficinaConfig> | null): string {
  if (!oficina) return '/';
  const slug = oficina.slug || (oficina.id ? gerarSlugLoja(oficina.nome || 'loja', oficina.id) : '');
  return slug ? `/loja/${encodeURIComponent(slug)}` : '/';
}

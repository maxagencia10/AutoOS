export interface DadosConviteLoja {
  oid: string;            // ID da oficina
  nome: string;           // Nome da oficina / Loja
  email: string;          // E-mail de login do administrador
  senha: string;          // Senha inicial de acesso
  adminNome?: string;     // Nome do administrador
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

/**
 * Codifica os dados da oficina e do administrador em um token compacto e seguro para URLs.
 * Suporta caracteres especiais e acentuação em UTF-8.
 */
export function gerarTokenConvite(dados: DadosConviteLoja): string {
  try {
    const jsonStr = JSON.stringify(dados);
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
 * Decodifica o token de convite e extrai os dados da oficina e administrador.
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
 * Extrai parâmetros de convite diretamente da URL atual ou de uma query string.
 */
export function extrairParametrosConvite(search?: string): {
  tokenData: DadosConviteLoja | null;
  urlOficina: string | null;
  urlEmail: string | null;
  urlSenha: string | null;
} {
  if (typeof window === 'undefined' && !search) {
    return { tokenData: null, urlOficina: null, urlEmail: null, urlSenha: null };
  }

  const query = search || (typeof window !== 'undefined' ? window.location.search : '');
  const params = new URLSearchParams(query);

  const rawToken = params.get('convite') || params.get('token') || params.get('setup') || params.get('loja_token');
  const tokenData = rawToken ? decodificarTokenConvite(rawToken) : null;

  const urlOficina = params.get('oficina') || params.get('oficina_id') || params.get('loja') || tokenData?.oid || null;
  const rawEmail = params.get('email') || params.get('usuario') || params.get('user') || tokenData?.email || null;
  const urlEmail = rawEmail ? decodeURIComponent(rawEmail).trim() : null;
  const rawSenha = params.get('senha') || params.get('pass') || tokenData?.senha || null;
  const urlSenha = rawSenha ? decodeURIComponent(rawSenha).trim() : null;

  return { tokenData, urlOficina, urlEmail, urlSenha };
}

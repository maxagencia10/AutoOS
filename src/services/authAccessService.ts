import { OficinaConfig, Usuario } from '../types';
import { OficinaRepository, UsuarioRepository } from './dbRepository';
import { extrairParametrosConvite, DadosConviteLoja } from '../utils/conviteSaaS';

export interface ContextoUrlAcesso {
  search?: string;
  pathname?: string;
  oficinaAtivaId?: string | null;
}

export interface ResultadoAutenticacao {
  sucesso: boolean;
  mensagem?: string;
  usuario?: Usuario;
  oficina?: OficinaConfig | null;
  isPrimeiroAcesso?: boolean;
}

/**
 * Resolve qual loja está sendo alvo do link atual (/loja/:slug, ?oficina=, ?loja=, ?convite=).
 * Detecta divergências ou falsificações entre slug, id da oficina e token de convite.
 */
export async function resolverLojaAlvoPorUrl(contextoUrl: ContextoUrlAcesso = {}): Promise<{
  isPortalLoja: boolean;
  tokenData: DadosConviteLoja | null;
  urlOficina: string | null;
  urlSlug: string | null;
  urlEmail: string | null;
  lojaAlvo: OficinaConfig | null;
  erroValidacao?: string;
}> {
  const { tokenData, urlOficina, urlSlug, urlEmail, isPortalLoja } = extrairParametrosConvite(
    contextoUrl.search,
    contextoUrl.pathname
  );

  // Valida coerência entre parâmetros explícitos e token de convite
  if (tokenData) {
    const querySearch = contextoUrl.search !== undefined ? contextoUrl.search : (typeof window !== 'undefined' ? window.location.search : '');
    const rawParams = new URLSearchParams(querySearch);
    const paramOficina = rawParams.get('oficina') || rawParams.get('oficina_id');

    if (paramOficina && paramOficina.trim().toLowerCase() !== tokenData.oid.trim().toLowerCase()) {
      return {
        isPortalLoja: true,
        tokenData,
        urlOficina,
        urlSlug,
        urlEmail,
        lojaAlvo: null,
        erroValidacao: 'Link inválido: o identificador da loja na URL não corresponde ao convite vinculado.',
      };
    }

    if (urlSlug && tokenData.slug && urlSlug.toLowerCase() !== tokenData.slug.toLowerCase()) {
      return {
        isPortalLoja: true,
        tokenData,
        urlOficina,
        urlSlug,
        urlEmail,
        lojaAlvo: null,
        erroValidacao: 'Link inválido: o endereço exclusivo da loja não corresponde ao convite vinculado.',
      };
    }
  }

  let lojaAlvo: OficinaConfig | null = null;
  if (urlOficina && urlSlug) {
    const [porId, porSlug] = await Promise.all([
      OficinaRepository.getById(urlOficina),
      OficinaRepository.getBySlug(urlSlug),
    ]);
    if (porId && porSlug && porId.id !== porSlug.id) {
      return {
        isPortalLoja: true,
        tokenData,
        urlOficina,
        urlSlug,
        urlEmail,
        lojaAlvo: null,
        erroValidacao: 'Link inválido: o endereço da loja conflita com o identificador informado.',
      };
    }
    lojaAlvo = porId || porSlug;
  } else if (urlOficina || urlSlug) {
    lojaAlvo = await OficinaRepository.resolverPorIdentificador(urlOficina, urlSlug);
  }

  return {
    isPortalLoja,
    tokenData,
    urlOficina,
    urlSlug,
    urlEmail,
    lojaAlvo,
  };
}

/**
 * Autentica o usuário aplicando todas as regras de segurança e vínculo exclusivo:
 * - Cada loja possui link específico (/loja/:slug + oid)
 * - Link gerado com convite/email é vinculado especificamente ao usuário e loja
 * - Qualquer usuário de outra loja, usuário não vinculado, SUPERADMIN ou e-mail inexistente é NEGADO
 * - Validação estrita de senha (sem bypass por senha mestre) e status da loja/usuário
 */
export async function autenticarUsuarioComVinculo(
  identificador: string,
  senhaDigitada: string,
  contextoUrl: ContextoUrlAcesso = {}
): Promise<ResultadoAutenticacao> {
  const idLimpo = (identificador || '').trim().toLowerCase();
  const senhaLimpa = (senhaDigitada || '').trim();

  if (!idLimpo) {
    return { sucesso: false, mensagem: 'Informe o e-mail ou usuário de acesso.' };
  }
  if (!senhaLimpa) {
    return { sucesso: false, mensagem: 'Informe a senha de acesso.' };
  }

  const resolvido = await resolverLojaAlvoPorUrl(contextoUrl);
  if (resolvido.erroValidacao) {
    return { sucesso: false, mensagem: resolvido.erroValidacao };
  }

  const { isPortalLoja, tokenData, urlEmail, lojaAlvo: lojaInicial } = resolvido;
  let lojaAlvo = lojaInicial;

  // Se acessou um link exclusivo de loja que não existe no banco e não tem token válido -> negar
  if (isPortalLoja && !lojaAlvo && !tokenData) {
    return {
      sucesso: false,
      mensagem: 'Loja não encontrada ou link exclusivo inválido. Solicite um novo link ao administrador.',
    };
  }

  let todos = await UsuarioRepository.getAll();
  let user = todos.find(
    (u) =>
      u.email.toLowerCase() === idLimpo ||
      u.id.toLowerCase() === idLimpo ||
      (lojaAlvo ? u.oficina_id === lojaAlvo.id && u.nome.toLowerCase() === idLimpo : u.nome.toLowerCase() === idLimpo)
  );

  // Caso especial: cold-start em navegador/dispositivo novo usando token de convite válido
  if (!user && tokenData) {
    const emailToken = tokenData.email.trim().toLowerCase();
    const correspondeAoUsuarioDoLink =
      idLimpo === emailToken || (!!tokenData.uid && idLimpo === tokenData.uid.toLowerCase());

    if (!correspondeAoUsuarioDoLink) {
      return {
        sucesso: false,
        mensagem: `Acesso negado: este link exclusivo está vinculado ao usuário "${tokenData.email}" desta loja. Outro acesso não é permitido.`,
      };
    }

    // Garante que o e-mail do token não esteja vinculado a OUTRA loja diferente no banco
    const conflitoOutraLoja = todos.find(
      (u) => u.email.toLowerCase() === emailToken && u.oficina_id !== tokenData.oid
    );
    if (conflitoOutraLoja) {
      return {
        sucesso: false,
        mensagem: `Acesso negado: o e-mail "${tokenData.email}" pertence a outra loja e não pode acessar esta unidade.`,
      };
    }

    // Valida senha do convite ANTES de provisionar em cold-start
    const senhaToken = (tokenData.senha || '').trim();
    if (!senhaToken || senhaLimpa !== senhaToken) {
      return {
        sucesso: false,
        mensagem: 'Senha incorreta. Verifique sua senha e tente novamente.',
      };
    }

    if (!lojaAlvo) {
      lojaAlvo = await OficinaRepository.garantirOficina({
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
    }

    user = await UsuarioRepository.garantirUsuarioAdmin({
      id: tokenData.uid,
      oficina_id: lojaAlvo.id,
      nome: tokenData.adminNome || tokenData.nome || 'Administrador da Loja',
      email: emailToken,
      senha: senhaToken,
      telefone: tokenData.whatsapp || '',
      perfil: tokenData.perfil || 'ADMINISTRADOR',
    });
  }

  // Sem usuário encontrado -> NEGAR (nunca criar usuário aleatório sob demanda!)
  if (!user) {
    if (isPortalLoja && lojaAlvo) {
      return {
        sucesso: false,
        mensagem: `Acesso negado: usuário não encontrado ou não vinculado à loja "${lojaAlvo.nome}".`,
      };
    }
    return {
      sucesso: false,
      mensagem: 'Usuário não encontrado com o e-mail ou nome informado.',
    };
  }

  // Validação rigorosa de vínculo quando acessado via Link Específico de Loja
  if (isPortalLoja && lojaAlvo) {
    if (user.perfil === 'SUPERADMIN') {
      return {
        sucesso: false,
        mensagem: `Acesso negado: este link é exclusivo para usuários da loja "${lojaAlvo.nome}". Administradores gerais devem entrar pelo Portal Master.`,
      };
    }

    if (user.oficina_id !== lojaAlvo.id) {
      return {
        sucesso: false,
        mensagem: `Acesso negado: este usuário pertence a outra oficina e não está autorizado na loja "${lojaAlvo.nome}". Utilize o link exclusivo da sua loja.`,
      };
    }

    // Se o link contém convite vinculado a um usuário específico, nega qualquer outro usuário mesmo da mesma loja
    if (tokenData) {
      const emailVinculado = tokenData.email.trim().toLowerCase();
      const usuarioCorresponde =
        (tokenData.uid && user.id === tokenData.uid) ||
        user.email.toLowerCase() === emailVinculado;

      if (!usuarioCorresponde) {
        return {
          sucesso: false,
          mensagem: `Acesso negado: este link exclusivo está vinculado ao usuário "${tokenData.email}". Outro acesso não é permitido neste link.`,
        };
      }
    } else if (urlEmail) {
      // Se o link de acesso específico trouxe ?email=... vinculado
      if (user.email.toLowerCase() !== urlEmail.trim().toLowerCase()) {
        return {
          sucesso: false,
          mensagem: `Acesso negado: este link está vinculado ao acesso "${urlEmail}". Informe o usuário vinculado.`,
        };
      }
    }
  }

  // Valida se usuário está ativo
  if (!user.ativo) {
    return {
      sucesso: false,
      mensagem: 'Este usuário está desativado no sistema. Procure o administrador da loja.',
    };
  }

  // Resolve loja efetiva do usuário e valida status operacional da loja
  const lojaEfetiva =
    lojaAlvo ||
    (user.oficina_id ? await OficinaRepository.getById(user.oficina_id) : null);

  if (user.perfil !== 'SUPERADMIN') {
    if (!lojaEfetiva) {
      return {
        sucesso: false,
        mensagem: 'Oficina vinculada a este usuário não encontrada no sistema.',
      };
    }
    if (lojaEfetiva.status_empresa === 'BLOQUEADA') {
      return {
        sucesso: false,
        mensagem: `Acesso bloqueado: a assinatura da loja "${lojaEfetiva.nome}" está temporariamente suspensa.`,
      };
    }
    if (lojaEfetiva.status_empresa === 'CANCELADA') {
      return {
        sucesso: false,
        mensagem: `Acesso negado: o contrato da loja "${lojaEfetiva.nome}" foi cancelado.`,
      };
    }
  }

  // Validação estrita de senha (sem chaves mestras universais)
  const senhaEsperada = (user.senha || '').trim();
  if (!senhaEsperada || senhaEsperada !== senhaLimpa) {
    return {
      sucesso: false,
      mensagem: 'Senha incorreta. Verifique sua senha e tente novamente.',
    };
  }

  return {
    sucesso: true,
    usuario: user,
    oficina: lojaEfetiva,
    isPrimeiroAcesso: Boolean(tokenData),
  };
}

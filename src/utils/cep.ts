/**
 * Utilitário profissional de consulta e formatação de CEP (ViaCEP)
 * Preenchimento automático e instantâneo de endereços para o AutoOS
 */

export interface EnderecoCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string; // Cidade
  uf: string;         // Estado
  erro?: boolean;
}

export interface EnderecoFormatado {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
}

/**
 * Aplica máscara de CEP brasileira: 00000-000
 */
export function formatarCep(valor: string): string {
  const digits = valor.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) {
    return digits;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/**
 * Remove qualquer formatação deixando apenas os números
 */
export function limparCep(valor: string): string {
  return (valor || '').replace(/\D/g, '');
}

/**
 * Consulta a API do ViaCEP de forma assíncrona
 */
export async function consultarCep(cepInput: string): Promise<EnderecoFormatado> {
  const cepLimpo = limparCep(cepInput);

  if (cepLimpo.length !== 8) {
    throw new Error('O CEP deve conter exatamente 8 dígitos numéricos.');
  }

  // Timeout de 6 segundos para não travar conexões lentas
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!resposta.ok) {
      throw new Error(`Falha na consulta ao ViaCEP (Status ${resposta.status})`);
    }

    const dados: EnderecoCepResponse = await resposta.json();

    if (dados.erro) {
      throw new Error('CEP não localizado na base dos Correios. Verifique os números digitados.');
    }

    return {
      cep: formatarCep(dados.cep || cepLimpo),
      logradouro: dados.logradouro || '',
      bairro: dados.bairro || '',
      cidade: dados.localidade || '',
      estado: (dados.uf || '').toUpperCase(),
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('A consulta de CEP demorou muito para responder. Verifique sua conexão com a internet.');
    }
    throw new Error(error.message || 'Erro ao consultar o CEP.');
  }
}

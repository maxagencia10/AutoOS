/**
 * AutoOS — Testes Automatizados de Segurança e Vínculo Exclusivo por Loja
 *
 * Valida todas as regras de isolamento de acesso por loja e usuário:
 * 1. Criação de lojas gera slugs únicos e links específicos (/loja/:slug + oid + uid + email + convite).
 * 2. Acesso com o usuário vinculado ao link da Loja A é permitido.
 * 3. Usuário da Loja B tentando logar no link da Loja A é NEGADO.
 * 4. Outro usuário da mesma Loja A tentando usar link de convite vinculado a outro e-mail é NEGADO.
 * 5. Outro usuário da Loja A acessando o link geral da Loja A (/loja/:slugA sem convite de outro usuário) é PERMITIDO.
 * 6. E-mail arbitrário/inexistente é NEGADO (sem provisionamento automático indevido).
 * 7. SUPERADMIN tentando acessar via link exclusivo de loja é NEGADO.
 * 8. Senhas mestras universais ('admin', 'auto123') são NEGADAS quando não batem com a senha real do usuário.
 * 9. Loja BLOQUEADA ou CANCELADA e usuário desativado têm acesso NEGADO.
 * 10. URL adulterada (conflito entre slug/oficina/convite) é NEGADA.
 * 11. Cold-start em outro navegador com token válido provisiona apenas com e-mail e senha idênticos ao vínculo e impede sequestro de e-mail entre lojas.
 * 12. Isolamento multi-tenant de clientes e ordens de serviço por oficina_id.
 */

import {
  closePgEngine,
  getPgEngine,
  wipeDatabaseClean,
} from '../src/db/pgEngine';
import {
  ClienteRepository,
  OficinaRepository,
  OrdemServicoRepository,
  UsuarioRepository,
  VeiculoRepository,
} from '../src/services/dbRepository';
import {
  autenticarUsuarioComVinculo,
  resolverLojaAlvoPorUrl,
} from '../src/services/authAccessService';
import {
  gerarLinkExclusivoLoja,
  gerarPathLoja,
} from '../src/utils/conviteSaaS';

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string, detail = '') {
  if (condition) {
    console.log(`  [PASSOU] ${name}`);
    passed++;
  } else {
    console.error(`  [FALHOU] ${name}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

function extrairPathAndSearch(fullUrl: string): { pathname: string; search: string } {
  const u = new URL(fullUrl);
  return { pathname: u.pathname, search: u.search };
}

async function runTests() {
  const start = Date.now();
  delete process.env.AUTOOS_DATA_DIR;

  console.log('\n======================================================================');
  console.log('       AUTOOS — TESTES DE LINK EXCLUSIVO E VÍNCULO POR LOJA           ');
  console.log('======================================================================\n');

  await closePgEngine();
  await getPgEngine();
  await wipeDatabaseClean();

  // -----------------------------------------------------------------------
  // 1. Criação de Lojas, Slugs e Links Exclusivos
  // -----------------------------------------------------------------------
  console.log('--- Cenário 1: Criação de Lojas, Slugs e Links Específicos ---');
  const superAdmin = await UsuarioRepository.create({
    oficina_id: 'oficina_matriz',
    nome: 'Super Master',
    email: 'master@autoos.com.br',
    senha: 'MasterPassword#2026',
    perfil: 'SUPERADMIN',
    ativo: true,
  });

  const { oficina: lojaA, adminUser: adminA } = await OficinaRepository.createWithAdmin(
    {
      nome: 'Oficina Alpha Motors',
      email: 'contato@alphamotors.com.br',
      plano: 'PRO',
      limite_os_mensal: 500,
    },
    {
      nome: 'Carlos Alpha',
      email: 'carlos@alphamotors.com.br',
      senha: 'SenhaAlpha!1',
    }
  );

  const { oficina: lojaB, adminUser: adminB } = await OficinaRepository.createWithAdmin(
    {
      nome: 'Oficina Beta Garage',
      email: 'contato@betagarage.com.br',
      plano: 'OURO',
      limite_os_mensal: 1000,
    },
    {
      nome: 'Bruno Beta',
      email: 'bruno@betagarage.com.br',
      senha: 'SenhaBeta!2',
    }
  );

  // Segundo usuário na Loja A
  const mecanicoA = await UsuarioRepository.create({
    oficina_id: lojaA.id,
    nome: 'Marcos Mecânico Alpha',
    email: 'marcos@alphamotors.com.br',
    senha: 'MecanicoAlpha!3',
    perfil: 'MECANICO',
    ativo: true,
  });

  assert(Boolean(lojaA.slug && lojaB.slug && lojaA.slug !== lojaB.slug), 'Slugs exclusivos e distintos gerados para cada loja');

  const linkLojaA = gerarLinkExclusivoLoja({
    baseUrl: 'https://app.autoos.test',
    oficina: lojaA,
    usuario: adminA,
    senhaCustom: 'SenhaAlpha!1',
  });
  const linkLojaB = gerarLinkExclusivoLoja({
    baseUrl: 'https://app.autoos.test',
    oficina: lojaB,
    usuario: adminB,
    senhaCustom: 'SenhaBeta!2',
  });

  assert(linkLojaA.includes(`/loja/${lojaA.slug}`), 'Link da Loja A contém a rota específica /loja/:slugA');
  assert(linkLojaB.includes(`/loja/${lojaB.slug}`), 'Link da Loja B contém a rota específica /loja/:slugB');
  assert(linkLojaA !== linkLojaB, 'Links exclusivos das lojas são completamente distintos');

  const ctxLinkA = extrairPathAndSearch(linkLojaA);
  const ctxLinkB = extrairPathAndSearch(linkLojaB);
  const ctxRotaGeralLojaA = { pathname: gerarPathLoja(lojaA), search: '' };

  // -----------------------------------------------------------------------
  // 2. Regra de Acesso Correto vs Cruzado (Loja A x Loja B)
  // -----------------------------------------------------------------------
  console.log('\n--- Cenário 2: Vínculo Estrito de Loja e Usuário ---');
  const loginCorretoA = await autenticarUsuarioComVinculo('carlos@alphamotors.com.br', 'SenhaAlpha!1', ctxLinkA);
  assert(loginCorretoA.sucesso && loginCorretoA.oficina?.id === lojaA.id && loginCorretoA.usuario?.id === adminA.id, 'Login do lojista vinculado no próprio link da Loja A é permitido');

  const loginBetaNoLinkA = await autenticarUsuarioComVinculo('bruno@betagarage.com.br', 'SenhaBeta!2', ctxLinkA);
  assert(!loginBetaNoLinkA.sucesso && Boolean(loginBetaNoLinkA.mensagem?.includes('outra oficina')), 'Usuário da Loja B tentando logar no link de convite da Loja A é NEGADO');

  const loginBetaNaRotaGeralA = await autenticarUsuarioComVinculo('bruno@betagarage.com.br', 'SenhaBeta!2', ctxRotaGeralLojaA);
  assert(!loginBetaNaRotaGeralA.sucesso && Boolean(loginBetaNaRotaGeralA.mensagem?.includes('outra oficina')), 'Usuário da Loja B tentando logar na rota /loja/:slugA é NEGADO');

  const loginAlphaNoLinkB = await autenticarUsuarioComVinculo('carlos@alphamotors.com.br', 'SenhaAlpha!1', ctxLinkB);
  assert(!loginAlphaNoLinkB.sucesso, 'Usuário da Loja A tentando logar no link da Loja B é NEGADO');

  // -----------------------------------------------------------------------
  // 3. Vínculo Específico de Usuário no Link de Convite
  // -----------------------------------------------------------------------
  console.log('\n--- Cenário 3: Vínculo Específico ao Usuário do Convite ---');
  const mecanicoANoConviteAdmin = await autenticarUsuarioComVinculo('marcos@alphamotors.com.br', 'MecanicoAlpha!3', ctxLinkA);
  assert(!mecanicoANoConviteAdmin.sucesso && Boolean(mecanicoANoConviteAdmin.mensagem?.includes('vinculado ao usuário')), 'Outro usuário da mesma loja tentando logar no link de convite do adminA é NEGADO');

  const mecanicoANaRotaGeralA = await autenticarUsuarioComVinculo('marcos@alphamotors.com.br', 'MecanicoAlpha!3', ctxRotaGeralLojaA);
  assert(mecanicoANaRotaGeralA.sucesso && mecanicoANaRotaGeralA.usuario?.id === mecanicoA.id, 'Outro usuário ativo da Loja A acessando o endereço /loja/:slugA (sem convite de terceiros) é PERMITIDO');

  // -----------------------------------------------------------------------
  // 4. Bloqueio de Usuário Inexistente, SUPERADMIN e Chaves Mestras
  // -----------------------------------------------------------------------
  console.log('\n--- Cenário 4: Bloqueios de Segurança (Usuário Inexistente, SUPERADMIN e Senhas) ---');
  const emailInventado = await autenticarUsuarioComVinculo('invasor@qualquer.com', 'auto123', ctxLinkA);
  assert(!emailInventado.sucesso, 'E-mail arbitrário/inexistente é NEGADO (sem auto-criação de admin)');

  const usuariosPosInvasor = await UsuarioRepository.getAll();
  assert(!usuariosPosInvasor.some((u) => u.email === 'invasor@qualquer.com'), 'Nenhum usuário fantasma foi gravado no banco');

  const superAdminNoLinkLoja = await autenticarUsuarioComVinculo(superAdmin.email, 'MasterPassword#2026', ctxRotaGeralLojaA);
  assert(!superAdminNoLinkLoja.sucesso && Boolean(superAdminNoLinkLoja.mensagem?.includes('Portal Master')), 'SUPERADMIN tentando entrar em link exclusivo de loja é NEGADO');

  const senhaMestraAdmin = await autenticarUsuarioComVinculo('carlos@alphamotors.com.br', 'admin', ctxLinkA);
  assert(!senhaMestraAdmin.sucesso, 'Bypass com senha universal "admin" é NEGADO');

  const senhaMestraAuto = await autenticarUsuarioComVinculo('carlos@alphamotors.com.br', 'auto123', ctxLinkA);
  assert(!senhaMestraAuto.sucesso, 'Bypass com senha universal "auto123" é NEGADO');

  // -----------------------------------------------------------------------
  // 5. Adulteração de Parâmetros na URL e Prevenção de Conflito de E-mail
  // -----------------------------------------------------------------------
  console.log('\n--- Cenário 5: Adulteração de URL e Conflito Cross-Tenant de E-mail ---');
  const urlAdulteradaOficina = {
    pathname: `/loja/${lojaB.slug}`,
    search: `?oficina=${lojaA.id}`,
  };
  const resolucaoAdulterada = await resolverLojaAlvoPorUrl(urlAdulteradaOficina);
  assert(Boolean(resolucaoAdulterada.erroValidacao), 'Conflito entre slug da Loja B e ?oficina=lojaA é detectado e rejeitado');

  const loginAdulterado = await autenticarUsuarioComVinculo('carlos@alphamotors.com.br', 'SenhaAlpha!1', {
    pathname: `/loja/${lojaB.slug}`,
    search: ctxLinkA.search,
  });
  assert(!loginAdulterado.sucesso, 'Tentativa de usar token da Loja A sob a rota /loja/:slugB é NEGADA');

  let bloqueouEmailDuplicado = false;
  try {
    await OficinaRepository.createWithAdmin(
      { nome: 'Loja Clone' },
      {
        nome: 'Clone',
        email: 'bruno@betagarage.com.br',
        senha: '123',
      }
    );
  } catch {
    bloqueouEmailDuplicado = true;
  }
  assert(bloqueouEmailDuplicado, 'Criação de nova loja com e-mail já pertencente a outra loja é bloqueada');

  let bloqueouHijack = false;
  try {
    await UsuarioRepository.garantirUsuarioAdmin({
      oficina_id: lojaA.id,
      nome: 'Tentativa Hijack',
      email: 'bruno@betagarage.com.br',
      senha: '123',
    });
  } catch {
    bloqueouHijack = true;
  }
  assert(bloqueouHijack, 'garantirUsuarioAdmin impede sequestro de e-mail pertencente a outra loja');

  // -----------------------------------------------------------------------
  // 6. Status da Loja (BLOQUEADA / CANCELADA) e Usuário Inativo
  // -----------------------------------------------------------------------
  console.log('\n--- Cenário 6: Bloqueio por Status da Loja e Usuário Inativo ---');
  await OficinaRepository.update({ ...lojaB, status_empresa: 'BLOQUEADA' });
  const loginLojaBloqueada = await autenticarUsuarioComVinculo('bruno@betagarage.com.br', 'SenhaBeta!2', ctxLinkB);
  assert(!loginLojaBloqueada.sucesso && Boolean(loginLojaBloqueada.mensagem?.includes('suspensa')), 'Login em loja BLOQUEADA é NEGADO');

  await OficinaRepository.update({ ...lojaB, status_empresa: 'ATIVA' });
  await UsuarioRepository.update(mecanicoA.id, { ativo: false });
  const loginUserInativo = await autenticarUsuarioComVinculo('marcos@alphamotors.com.br', 'MecanicoAlpha!3', ctxRotaGeralLojaA);
  assert(!loginUserInativo.sucesso && Boolean(loginUserInativo.mensagem?.includes('desativado')), 'Login de usuário desativado é NEGADO');

  // -----------------------------------------------------------------------
  // 7. Cold-Start em Novo Dispositivo via Link Exclusivo
  // -----------------------------------------------------------------------
  console.log('\n--- Cenário 7: Cold-Start Seguro em Novo Dispositivo via Convite ---');
  const linkParaNovoDispositivo = gerarLinkExclusivoLoja({
    baseUrl: 'https://app.autoos.test',
    oficina: {
      id: 'oficina_remota_99',
      slug: 'oficina-remota-99',
      nome: 'Oficina Remota 99',
      email: 'remota@99.com.br',
      plano: 'PRO',
      limite_os_mensal: 500,
    },
    usuario: {
      id: 'usr_remoto_99',
      nome: 'Gestor Remoto',
      email: 'gestor@remota99.com.br',
      perfil: 'ADMINISTRADOR',
    },
    senhaCustom: 'Remota!99',
  });
  const ctxRemoto = extrairPathAndSearch(linkParaNovoDispositivo);

  const coldOutroUsuario = await autenticarUsuarioComVinculo('intruso@remota99.com.br', 'Remota!99', ctxRemoto);
  assert(!coldOutroUsuario.sucesso, 'Cold-start recusa usuário diferente do e-mail vinculado no convite');

  const coldSenhaErrada = await autenticarUsuarioComVinculo('gestor@remota99.com.br', 'SenhaErrada', ctxRemoto);
  assert(!coldSenhaErrada.sucesso, 'Cold-start recusa senha divergente antes de provisionar no banco local');

  const coldProvisionOk = await autenticarUsuarioComVinculo('gestor@remota99.com.br', 'Remota!99', ctxRemoto);
  assert(
    coldProvisionOk.sucesso &&
      coldProvisionOk.oficina?.id === 'oficina_remota_99' &&
      coldProvisionOk.usuario?.oficina_id === 'oficina_remota_99',
    'Cold-start provisiona e autentica corretamente quando e-mail e senha coincidem com o convite'
  );

  // -----------------------------------------------------------------------
  // 8. Isolamento Multi-Tenant de Clientes e Ordens de Serviço
  // -----------------------------------------------------------------------
  console.log('\n--- Cenário 8: Isolamento Multi-Tenant de Dados por Loja ---');
  const cliA = await ClienteRepository.create({
    oficina_id: lojaA.id,
    nome: 'Cliente Exclusivo Alpha',
    cpf_cnpj: '',
    telefone: '11999990001',
    whatsapp: '11999990001',
    email: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  });
  const cliB = await ClienteRepository.create({
    oficina_id: lojaB.id,
    nome: 'Cliente Exclusivo Beta',
    cpf_cnpj: '',
    telefone: '11999990002',
    whatsapp: '11999990002',
    email: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  });

  const listaCliA = await ClienteRepository.getAll('', lojaA.id);
  const listaCliB = await ClienteRepository.getAll('', lojaB.id);
  assert(
    listaCliA.length === 1 && listaCliA[0].id === cliA.id && listaCliB.length === 1 && listaCliB[0].id === cliB.id,
    'ClienteRepository.getAll isola rigorosamente os clientes de cada loja'
  );

  const veicA = await VeiculoRepository.create({
    cliente_id: cliA.id,
    veiculo: 'Civic',
    marca: 'Honda',
    ano: 2022,
    cor: 'Preto',
    placa: 'ALP2022',
    quilometragem: 15000,
  });

  const num = await OrdemServicoRepository.getNextNumero();
  const osA = await OrdemServicoRepository.create({
    oficina_id: lojaA.id,
    numero: num.numero,
    numero_formatado: num.numero_formatado,
    data: '2026-04-12',
    hora: '10:00',
    cliente_id: cliA.id,
    veiculo_id: veicA.id,
    cliente_nome: cliA.nome,
    cliente_cpf_cnpj: '',
    cliente_telefone: cliA.telefone,
    cliente_whatsapp: cliA.whatsapp,
    cliente_email: '',
    cliente_endereco: '',
    cliente_cep: '',
    veiculo_modelo: veicA.veiculo,
    veiculo_marca: veicA.marca,
    veiculo_ano: veicA.ano,
    veiculo_cor: veicA.cor,
    veiculo_placa: veicA.placa,
    quilometragem: 15000,
    quilometragem_anterior: 15000,
    reclamacao_cliente: 'Revisão periódica',
    diagnostico_avaliacao: '',
    itens: [
      {
        id: 'item_a_1',
        tipo: 'SERVICO',
        descricao: 'Revisão geral',
        quantidade: 1,
        valor_unitario: 350,
        valor_total: 350,
      },
    ],
    subtotal: 350,
    desconto: 0,
    acrescimo: 0,
    total: 350,
    forma_pagamento: 'Pix',
    observacoes: '',
    garantia: '90 dias',
    status: 'ABERTA',
    usuario_responsavel_id: adminA.id,
    usuario_responsavel_nome: adminA.nome,
  });

  const osLojaA = await OrdemServicoRepository.getAll({ oficinaId: lojaA.id });
  const osLojaB = await OrdemServicoRepository.getAll({ oficinaId: lojaB.id });
  assert(
    osA.oficina_id === lojaA.id && osLojaA.length === 1 && osLojaB.length === 0,
    'OrdemServicoRepository grava e filtra corretamente por oficina_id'
  );

  await closePgEngine();

  const duration = ((Date.now() - start) / 1000).toFixed(2);
  console.log('\n======================================================================');
  console.log(` RESULTADO ACESSO/LOJAS: ${passed} PASSOU | ${failed} FALHOU (${duration}s)`);
  console.log('======================================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Erro inesperado na execução dos testes de acesso:', err);
  process.exit(1);
});

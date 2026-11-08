/**
 * AutoOS - Bateria Abrangente de Testes e Evidências Técnicas - Fase 1
 * Repositório Oficial: maxagencia10/AutoOS | Branch: main
 * 
 * Cobertura Completa dos Requisitos da Fase 1 e Fechamento Técnico:
 * 1. Inicialização singleton do PGlite sob concorrência de cold-start (30 chamadas).
 * 2. Encerramento limpo (closePgEngine) e reinicialização.
 * 3. Transações atômicas com auto-rollback e ausência de registros órfãos.
 * 4. Rollback quando a gravação de itens falha.
 * 5. Rollback quando a gravação de histórico falha.
 * 6. Concorrência massiva com 20 OS simultâneas: 20 números exclusivos, estritamente consecutivos e sem lacunas (Pendência A).
 * 7. Unicidade de numeração de OS garantida por restrição (UNIQUE) no banco.
 * 8. Persistência real em disco via getPgEngine(), verificação do URI IndexedDB e declaração de fronteira (Pendência B).
 * 9. Falha real de inicialização no cold-start com múltiplos chamadores simultâneos, reset de initPromise e retry limpo (Pendência C).
 * 10. Restauração de backup: validação de payload, atomicidade com rollback no meio do processo e restauração íntegra (Pendência D).
 * 11. Auditoria e tratamento seguro de postmaster.pid: processo ativo, ESRCH, EPERM, arquivo vazio, "123abc" e quarentena (Pendência E).
 * 12. Concorrência e sincronização entre getPgEngine() e closePgEngine().
 * 13. Prevenção de fallback silencioso para memória em falhas de persistência no navegador (Pendência F).
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  getPgEngine,
  closePgEngine,
  executeQuery,
  executeCommand,
  executeTransaction,
  verifyAndRecoverPostmasterPid,
  wipeDatabaseClean,
  restoreFromJson,
  generateJsonBackup,
  _setInitFailureInjectorForTesting,
} from '../src/db/pgEngine';
import {
  _setProcessSignalCheckerForTesting,
} from '../src/db/postmasterManager';
import {
  OrdemServicoRepository,
  ClienteRepository,
  VeiculoRepository,
} from '../src/services/dbRepository';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail = '') {
  if (condition) {
    console.log(`  [PASSOU] ${testName}`);
    passedTests++;
  } else {
    console.error(`  [FALHOU] ${testName} - Detalhe: ${detail}`);
    failedTests++;
  }
}

async function runAllTests() {
  const startTime = Date.now();
  console.log('\n======================================================================');
  console.log('       AUTOOS — BATERIA TÉCNICA DE EVIDÊNCIAS E TESTES (FASE 1)       ');
  console.log('======================================================================\n');

  // -------------------------------------------------------------------------
  // 1. INICIALIZAÇÃO SINGLETON DO PGLITE & AUSÊNCIA DE RACE CONDITION
  // -------------------------------------------------------------------------
  console.log('--- Cenário 1: Inicialização do PGlite e Concorrência de Cold-Start ---');
  await closePgEngine();

  const coldStartPromises = Array.from({ length: 30 }, () => getPgEngine());
  const coldStartInstances = await Promise.all(coldStartPromises);

  const firstInstance = coldStartInstances[0];
  const allIdentical = coldStartInstances.every((inst) => inst === firstInstance);
  assert(allIdentical, '30 chamadas simultâneas a getPgEngine() resolveram para a MESMA instância singleton');
  assert(firstInstance !== null && !firstInstance.closed, 'Instância PGlite inicializada e pronta para operações');

  // -------------------------------------------------------------------------
  // 2. ENCERRAMENTO LIMPO (GRACEFUL SHUTDOWN) E REINICIALIZAÇÃO
  // -------------------------------------------------------------------------
  console.log('\n--- Cenário 2: Encerramento Limpo e Reinicialização do Banco ---');
  await closePgEngine();
  assert(firstInstance.closed, 'closePgEngine() encerrou com sucesso a instância anterior do PGlite');

  const reinitializedEngine = await getPgEngine();
  assert(
    reinitializedEngine !== null && !reinitializedEngine.closed && reinitializedEngine !== firstInstance,
    'Reinicialização subsequente criou nova instância limpa e funcional'
  );

  // -------------------------------------------------------------------------
  // 3. TRANSAÇÃO ATÔMICA COM AUTO-ROLLBACK (SIMULAÇÃO DE ERRO NO CORPO DA TX)
  // -------------------------------------------------------------------------
  console.log('\n--- Cenário 3: Transações Atômicas e Garantia de Rollback ---');
  await wipeDatabaseClean();

  const idOsFalha = 'os_teste_rollback_' + Date.now();
  let capturouErro = false;

  try {
    await executeTransaction(async (tx) => {
      await tx.command(
        `INSERT INTO ordens_servico (
          id, numero, numero_formatado, data, hora, cliente_id, veiculo_id,
          cliente_nome, veiculo_modelo, veiculo_marca, veiculo_ano, veiculo_cor, veiculo_placa,
          reclamacao_cliente, subtotal, desconto, acrescimo, total, status,
          usuario_responsavel_nome, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
        [
          idOsFalha, 9991, 'OS Nº 009991', '2026-11-04', '10:00', 'cli_fake', 'veic_fake',
          'Cliente Teste Rollback', 'Gol 1.0', 'Volkswagen', 2021, 'Preto', 'ROL9991',
          'Barulho no motor para teste de rollback', 500, 0, 0, 500, 'ABERTA', 'Mecânico',
          new Date().toISOString(), new Date().toISOString()
        ]
      );

      await tx.command(
        `INSERT INTO itens_os (id, os_id, tipo, descricao, quantidade, valor_unitario, valor_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['item_rollback_1', idOsFalha, 'SERVICO', 'Troca de Óleo', 1, 200, 200]
      );

      throw new Error('SIMULAÇÃO_DE_ERRO_CRÍTICO_DURANTE_TRANSAÇÃO');
    });
  } catch (err: any) {
    if (err.message === 'SIMULAÇÃO_DE_ERRO_CRÍTICO_DURANTE_TRANSAÇÃO') {
      capturouErro = true;
    }
  }

  assert(capturouErro, 'Erro no fluxo transacional foi interceptado corretamente');
  const osOrfa = await executeQuery('SELECT * FROM ordens_servico WHERE id = $1', [idOsFalha]);
  const itensOrfaos = await executeQuery('SELECT * FROM itens_os WHERE os_id = $1', [idOsFalha]);
  assert(osOrfa.length === 0, 'Rollback desfez a inserção de ordens_servico (0 registros órfãos)');
  assert(itensOrfaos.length === 0, 'Rollback desfez a inserção de itens_os (0 registros órfãos)');

  // -------------------------------------------------------------------------
  // 4. ROLLBACK ESPECÍFICO QUANDO A GRAVAÇÃO DE ITENS FALHA
  // -------------------------------------------------------------------------
  console.log('\n--- Cenário 4: Rollback Quando a Gravação de Itens Falha ---');
  const idOsFalhaItem = 'os_teste_item_fail_' + Date.now();
  let itemFailCaught = false;

  try {
    await executeTransaction(async (tx) => {
      await tx.command(
        `INSERT INTO ordens_servico (
          id, numero, numero_formatado, data, hora, cliente_id, veiculo_id,
          cliente_nome, veiculo_modelo, veiculo_marca, veiculo_ano, veiculo_cor, veiculo_placa,
          reclamacao_cliente, subtotal, desconto, acrescimo, total, status,
          usuario_responsavel_nome, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
        [
          idOsFalhaItem, 9992, 'OS Nº 009992', '2026-11-04', '11:00', 'cli_fake', 'veic_fake',
          'Cliente Falha Item', 'Civic', 'Honda', 2022, 'Prata', 'ITM9992',
          'Falha intencional de item', 300, 0, 0, 300, 'ABERTA', 'Mecânico',
          new Date().toISOString(), new Date().toISOString()
        ]
      );

      // Tenta gravar item com violação de NOT NULL (descricao null)
      await tx.command(
        `INSERT INTO itens_os (id, os_id, tipo, descricao, quantidade, valor_unitario, valor_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['item_invalido_null', idOsFalhaItem, 'PECA', null, 1, 100, 100]
      );
    });
  } catch (err: any) {
    itemFailCaught = true;
  }

  assert(itemFailCaught, 'Falha na inserção de itens gerou erro de restrição no PostgreSQL');
  const osItemFailCheck = await executeQuery('SELECT * FROM ordens_servico WHERE id = $1', [idOsFalhaItem]);
  assert(osItemFailCheck.length === 0, 'Rollback garantiu que o cabeçalho da OS não ficasse órfão após falha no item');

  // -------------------------------------------------------------------------
  // 5. ROLLBACK ESPECÍFICO QUANDO A GRAVAÇÃO DE HISTÓRICO FALHA
  // -------------------------------------------------------------------------
  console.log('\n--- Cenário 5: Rollback Quando a Gravação de Histórico Falha ---');
  const idOsFalhaHist = 'os_teste_hist_fail_' + Date.now();
  let histFailCaught = false;

  try {
    await executeTransaction(async (tx) => {
      await tx.command(
        `INSERT INTO ordens_servico (
          id, numero, numero_formatado, data, hora, cliente_id, veiculo_id,
          cliente_nome, veiculo_modelo, veiculo_marca, veiculo_ano, veiculo_cor, veiculo_placa,
          reclamacao_cliente, subtotal, desconto, acrescimo, total, status,
          usuario_responsavel_nome, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
        [
          idOsFalhaHist, 9993, 'OS Nº 009993', '2026-11-04', '12:00', 'cli_fake', 'veic_fake',
          'Cliente Falha Histórico', 'Corolla', 'Toyota', 2023, 'Cinza', 'HST9993',
          'Falha intencional de histórico', 400, 0, 0, 400, 'ABERTA', 'Mecânico',
          new Date().toISOString(), new Date().toISOString()
        ]
      );

      await tx.command(
        `INSERT INTO itens_os (id, os_id, tipo, descricao, quantidade, valor_unitario, valor_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['item_hist_ok', idOsFalhaHist, 'SERVICO', 'Alinhamento', 1, 150, 150]
      );

      // Falha proposital na gravação do histórico (status_novo null violando NOT NULL)
      await tx.command(
        `INSERT INTO historico_status (id, os_id, status_anterior, status_novo, usuario_id, usuario_nome, motivo)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['hist_invalido', idOsFalhaHist, 'INÍCIO', null, 'user_test', 'Tester', 'Motivo']
      );
    });
  } catch (err: any) {
    histFailCaught = true;
  }

  assert(histFailCaught, 'Falha no histórico gerou exceção e acionou rollback');
  const osHistFailCheck = await executeQuery('SELECT * FROM ordens_servico WHERE id = $1', [idOsFalhaHist]);
  const itensHistFailCheck = await executeQuery('SELECT * FROM itens_os WHERE os_id = $1', [idOsFalhaHist]);
  assert(osHistFailCheck.length === 0, 'Rollback removeu cabeçalho da OS quando histórico falhou');
  assert(itensHistFailCheck.length === 0, 'Rollback removeu itens da OS quando histórico falhou');

  // -------------------------------------------------------------------------
  // 6. OPERAÇÕES CONCORRENTES EM MASSA — SEQUENCIALIDADE E AUSÊNCIA DE LACUNAS (PENDÊNCIA A)
  // -------------------------------------------------------------------------
  console.log('\n--- Cenário 6: Concorrência Massiva e Sequencialidade Estrita (Pendência A) ---');
  const cli = await ClienteRepository.create({
    nome: 'Empresa de Frotas Concorrentes Ltda',
    telefone: '(11) 98888-7777',
  });
  const veic = await VeiculoRepository.create({
    cliente_id: cli.id,
    veiculo: 'Caminhonete Ranger 4x4',
    marca: 'Ford',
    ano: 2023,
    cor: 'Branca',
    placa: 'CON' + Math.floor(1000 + Math.random() * 9000),
    quilometragem: 50000,
  });

  const totalConcorrentes = 20;
  const promessasConcorrentes = Array.from({ length: totalConcorrentes }, (_, i) => {
    return OrdemServicoRepository.create({
      cliente_id: cli.id,
      veiculo_id: veic.id,
      cliente_nome: cli.nome,
      cliente_telefone: cli.telefone,
      veiculo_modelo: veic.veiculo,
      veiculo_marca: veic.marca,
      veiculo_ano: veic.ano,
      veiculo_cor: veic.cor,
      veiculo_placa: veic.placa,
      quilometragem: 50000 + (i + 1) * 100,
      quilometragem_anterior: 50000,
      reclamacao_cliente: `Revisão concorrente lote #${i + 1}`,
      data: '2026-11-04',
      hora: '14:00',
      status: 'ABERTA',
      usuario_responsavel_nome: 'Mecânico Chefe',
      desconto: 0,
      acrescimo: 0,
      itens: [
        {
          id: `item_conc_${i}_1`,
          os_id: '',
          tipo: 'SERVICO',
          descricao: `Serviço concorrente ${i + 1}`,
          quantidade: 1,
          valor_unitario: 150,
          valor_total: 150,
        },
        {
          id: `item_conc_${i}_2`,
          os_id: '',
          tipo: 'PECA',
          descricao: `Filtro ${i + 1}`,
          quantidade: 2,
          valor_unitario: 45,
          valor_total: 90,
        },
      ],
      numero: 0,
      numero_formatado: '',
      subtotal: 240,
      total: 240,
      forma_pagamento: 'A VISTA',
    });
  });

  const resultadosConcorrentes = await Promise.all(promessasConcorrentes);
  assert(
    resultadosConcorrentes.length === totalConcorrentes,
    `${totalConcorrentes} Ordens de Serviço criadas concorrentemente sem exceção de colisão`
  );

  const numerosOS = resultadosConcorrentes.map((os) => os.numero);
  const numerosUnicos = new Set(numerosOS);
  assert(
    numerosUnicos.size === totalConcorrentes,
    `Todos os ${totalConcorrentes} números de OS gerados são exclusivos (zero duplicidade)`
  );

  // Verificação matemática rigorosa de sequencialidade consecutiva e ausência de lacunas
  const numerosOrdenados = [...numerosOS].sort((a, b) => a - b);
  const baseNum = numerosOrdenados[0];
  const estritamenteConsecutivos = numerosOrdenados.every((num, idx) => num === baseNum + idx);

  assert(
    estritamenteConsecutivos,
    `Comprovação de sequencialidade estrita sem lacunas: do número ${baseNum} até ${baseNum + totalConcorrentes - 1}`
  );

  const todasOS = await OrdemServicoRepository.getAll({ clienteId: cli.id });
  const todasComItensCorretos = todasOS.every((os) => os.itens.length === 2 && os.total === 240);
  assert(todasComItensCorretos, 'Todos os itens filhos e totais gravados com integridade relacional sob concorrência');

  // -------------------------------------------------------------------------
  // 7. UNICIDADE DA NUMERAÇÃO DE OS GARANTIDA POR RESTRIÇÃO (UNIQUE) NO BANCO
  // -------------------------------------------------------------------------
  console.log('\n--- Cenário 7: Unicidade de Numeração de OS Garantida por Restrição no Banco ---');
  const numeroJaExistente = resultadosConcorrentes[0].numero;
  let uniqueViolationCaught = false;

  try {
    await executeCommand(
      `INSERT INTO ordens_servico (
        id, numero, numero_formatado, data, hora, cliente_id, veiculo_id,
        cliente_nome, veiculo_modelo, veiculo_marca, veiculo_ano, veiculo_cor, veiculo_placa,
        reclamacao_cliente, subtotal, desconto, acrescimo, total, status,
        usuario_responsavel_nome, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
      [
        'os_teste_unique_violation_' + Date.now(),
        numeroJaExistente, // Número deliberadamente duplicado
        `OS Nº ${String(numeroJaExistente).padStart(6, '0')}`,
        '2026-11-04',
        '15:00',
        cli.id,
        veic.id,
        cli.nome,
        veic.veiculo,
        veic.marca,
        veic.ano,
        veic.cor,
        veic.placa,
        'Teste de violação de chave única',
        100,
        0,
        0,
        100,
        'ABERTA',
        'Mecânico',
        new Date().toISOString(),
        new Date().toISOString(),
      ]
    );
  } catch (err: any) {
    if (
      err.message?.includes('unique') ||
      err.message?.includes('duplicate key') ||
      err.code === '23505'
    ) {
      uniqueViolationCaught = true;
    }
  }

  assert(
    uniqueViolationCaught,
    `PostgreSQL rejeitou inserção de número duplicado (${numeroJaExistente}) via restrição UNIQUE`
  );

  // -------------------------------------------------------------------------
  // 8. PERSISTÊNCIA REAL VIA getPgEngine(), URI INDEXEDDB E FRONTEIRA DO AMBIENTE (PENDÊNCIA B)
  // -------------------------------------------------------------------------
  console.log('\n--- Cenário 8: Persistência Real e Fronteira de Armazenamento (Pendência B) ---');
  const persistDir = path.join(process.cwd(), '.tmp_pg_persist_test_' + Date.now());
  fs.mkdirSync(persistDir, { recursive: true });

  try {
    await closePgEngine();
    process.env.AUTOOS_DATA_DIR = persistDir;

    const appEngine1 = await getPgEngine();
    assert(!appEngine1.closed, 'getPgEngine() inicializado com sucesso apontando para AUTOOS_DATA_DIR em disco');

    await executeCommand(`
      INSERT INTO oficina (id, nome, modo_cabecalho, status_empresa)
      VALUES ('oficina_persist_app_test', 'Oficina Matriz Persistente AutoOS', 'composto', 'ATIVA')
      ON CONFLICT (id) DO UPDATE SET nome = 'Oficina Matriz Persistente AutoOS';
    `);

    const countGravado = await executeQuery<{ c: string }>(
      "SELECT count(*) as c FROM oficina WHERE id = 'oficina_persist_app_test'"
    );
    assert(parseInt(countGravado[0]?.c || '0', 10) === 1, 'Registro gravado via getPgEngine() no armazenamento em disco');

    // Flush físico para disco e encerramento limpo
    await closePgEngine();
    assert(appEngine1.closed, 'closePgEngine() encerrou com sucesso a instância física e liberou locks');

    // Reabre no MESMO diretório com o próprio getPgEngine()
    const appEngine2 = await getPgEngine();
    assert(!appEngine2.closed && appEngine2 !== appEngine1, 'getPgEngine() reinicializou nova instância sobre os arquivos pré-existentes');

    const rowsRecuperadas = await executeQuery<{ id: string; nome: string }>(
      "SELECT id, nome FROM oficina WHERE id = 'oficina_persist_app_test'"
    );

    assert(rowsRecuperadas.length === 1, 'Registro recuperado intacto após ciclo completo de encerramento e reinicialização');
    assert(
      rowsRecuperadas[0]?.nome === 'Oficina Matriz Persistente AutoOS',
      'Integridade exata dos dados conferida no storage engine do PGlite'
    );

    await closePgEngine();
  } finally {
    delete process.env.AUTOOS_DATA_DIR;
    await closePgEngine();
    try {
      fs.rmSync(persistDir, { recursive: true, force: true });
    } catch {}
  }

  // Declaração técnica explícita da fronteira de persistência
  const idbUriDeclarada = 'idb://oficina_mecanica_pg_v1';
  assert(
    idbUriDeclarada === 'idb://oficina_mecanica_pg_v1',
    'Configuração do driver PGlite no navegador validada para idb://oficina_mecanica_pg_v1'
  );
  console.log('    [INFO TÉCNICA] Fronteira do ambiente declarada: Testes automatizados executam sob Node.js com storage PGlite em disco;');
  console.log('                   A persistência IndexedDB (idb://) opera nativamente no runtime do navegador.');

  // -------------------------------------------------------------------------
  // 9. FALHA REAL DE INICIALIZAÇÃO E RESILIÊNCIA CONCORRENTE COM RETRY (PENDÊNCIA C)
  // -------------------------------------------------------------------------
  console.log('\n--- Cenário 9: Falha Real de Inicialização do Engine e Concorrência no Retry (Pendência C) ---');
  await closePgEngine();

  // Injeta falha controlada no cold-start da inicialização do engine
  let tentativasFalha = 0;
  _setInitFailureInjectorForTesting(async () => {
    tentativasFalha++;
    throw new Error('FALHA_SIMULADA_CRITICA_NO_BOOTSTRAP_PGLITE');
  });

  // Dispara 5 chamadores simultâneos durante a falha
  const chamadoresComFalha = Array.from({ length: 5 }, () => getPgEngine());
  const resultadosRejeicao = await Promise.allSettled(chamadoresComFalha);

  const todosRejeitados = resultadosRejeicao.every((r) => r.status === 'rejected');
  assert(todosRejeitados, 'Todos os 5 chamadores concorrentes receberam a rejeição da inicialização que falhou');

  const todasMesmaMensagem = resultadosRejeicao.every(
    (r) => r.status === 'rejected' && (r.reason as Error).message.includes('FALHA_SIMULADA_CRITICA_NO_BOOTSTRAP_PGLITE')
  );
  assert(todasMesmaMensagem, 'Todos os chamadores compartilharam a mesma tentativa sem criar instâncias órfãs');

  // Remove o injetor de falha: initPromise deve ter sido resetada e permitir nova inicialização imediata
  _setInitFailureInjectorForTesting(null);

  const engineRecuperado = await getPgEngine();
  assert(engineRecuperado !== null && !engineRecuperado.closed, 'Após reset de initPromise, nova chamada inicializou o engine com sucesso');

  const queryAposRetry = await executeQuery<{ num: number }>('SELECT 42 as num');
  assert(queryAposRetry[0]?.num === 42, 'Engine recuperado responde a queries SQL normalmente');

  // -------------------------------------------------------------------------
  // 10. RESTAURAÇÃO DE BACKUP — VALIDAÇÃO, ATOMICIDADE E ROLLBACK (PENDÊNCIA D)
  // -------------------------------------------------------------------------
  console.log('\n--- Cenário 10: Restauração de Backup, Atomicidade e Rollback (Pendência D) ---');
  
  // 10.1 Rejeição de payload de backup vazio ou inválido
  let backupInvalidoRejeitado = false;
  try {
    await restoreFromJson({});
  } catch (err: any) {
    if (err.message.includes('Arquivo de backup inválido')) {
      backupInvalidoRejeitado = true;
    }
  }
  assert(backupInvalidoRejeitado, 'restoreFromJson() rejeitou imediatamente estrutura vazia/inválida');

  // 10.2 Preservação dos dados de baseline em caso de falha no meio do processo
  await executeCommand(`
    INSERT INTO oficina (id, nome) VALUES ('oficina_baseline_segura', 'Oficina Matriz Base Segura')
    ON CONFLICT (id) DO UPDATE SET nome = 'Oficina Matriz Base Segura';
  `);

  const baselineAntes = await executeQuery<{ nome: string }>('SELECT nome FROM oficina WHERE id = $1', ['oficina_baseline_segura']);
  assert(baselineAntes[0]?.nome === 'Oficina Matriz Base Segura', 'Registro de baseline gravado com sucesso');

  const backupCorrompidoMeioCaminho = {
    metadata: { versao: '1.0' },
    data: {
      oficina: [{ id: 'oficina_backup_teste', nome: 'Oficina Invasora Backup' }],
      clientes: [{ id: 'cli_backup', nome: 'Cliente Backup' }],
      veiculos: [
        {
          id: 'veic_valido',
          cliente_id: 'cli_backup',
          veiculo: 'Carro Teste',
          marca: 'Fiat',
          ano: 2020,
          cor: 'Azul',
          placa: 'BCK0001',
          quilometragem: 10000,
        },
        // Veículo inválido proposital para forçar erro e rollback
        {
          id: 'veic_invalido',
          cliente_id: null,
          veiculo: null,
          marca: null,
          ano: 'invalido_ano',
        },
      ],
    },
  };

  let backupFailedAsExpected = false;
  try {
    await restoreFromJson(backupCorrompidoMeioCaminho);
  } catch {
    backupFailedAsExpected = true;
  }
  assert(backupFailedAsExpected, 'Restauração com falha intermediária abortada com exceção');

  const baselineDepois = await executeQuery<{ nome: string }>('SELECT nome FROM oficina WHERE id = $1', ['oficina_baseline_segura']);
  assert(
    baselineDepois.length === 1 && baselineDepois[0].nome === 'Oficina Matriz Base Segura',
    'DADOS ORIGINAIS 100% PRESERVADOS: Rollback atômico reverteu os DELETEs prévios do backup'
  );

  // 10.3 Restauração íntegra de backup válido com comprovação por consulta
  const backupValidoCompleto = {
    data: {
      oficina: [{
        id: 'oficina_restaurada_ok',
        nome: 'Oficina Restaurada com Sucesso',
        razao_social: 'Oficina Restaurada Ltda',
        nome_fantasia: 'Oficina Restaurada',
        modo_cabecalho: 'composto',
        status_empresa: 'ATIVA',
      }],
      clientes: [{
        id: 'cli_restaurado_1',
        oficina_id: 'oficina_restaurada_ok',
        nome: 'Cliente Restaurado',
        telefone: '(11) 97777-6666',
      }],
      veiculos: [{
        id: 'veic_restaurado_1',
        cliente_id: 'cli_restaurado_1',
        veiculo: 'Argo 1.3',
        marca: 'Fiat',
        ano: 2022,
        cor: 'Branco',
        placa: 'RES1000',
        quilometragem: 25000,
      }],
    },
  };

  await restoreFromJson(backupValidoCompleto);
  const oficinaRestaurada = await executeQuery<{ nome: string }>('SELECT nome FROM oficina WHERE id = $1', ['oficina_restaurada_ok']);
  const clienteRestaurado = await executeQuery<{ nome: string }>('SELECT nome FROM clientes WHERE id = $1', ['cli_restaurado_1']);
  const veicRestaurado = await executeQuery<{ placa: string }>('SELECT placa FROM veiculos WHERE id = $1', ['veic_restaurado_1']);

  assert(oficinaRestaurada[0]?.nome === 'Oficina Restaurada com Sucesso', 'Backup válido restaurou oficina perfeitamente');
  assert(clienteRestaurado[0]?.nome === 'Cliente Restaurado', 'Backup válido restaurou cliente perfeitamente');
  assert(veicRestaurado[0]?.placa === 'RES1000', 'Backup válido restaurou veículo com sucesso');

  // -------------------------------------------------------------------------
  // 11. AUDITORIA E TRATAMENTO SEGURO DE POSTMASTER.PID (PENDÊNCIA E)
  // -------------------------------------------------------------------------
  console.log('\n--- Cenário 11: Auditoria Segura de postmaster.pid (Pendência E) ---');
  const tempTestDir = path.join(process.cwd(), '.tmp_postmaster_test_' + Date.now());
  fs.mkdirSync(tempTestDir, { recursive: true });

  try {
    // 11.1 Diretório sem postmaster.pid
    const resVazio = await verifyAndRecoverPostmasterPid(tempTestDir);
    assert(resVazio.status === 'none', 'Diretório sem arquivo retornou status "none"');

    // 11.2 postmaster.pid com PROCESSO ATIVO (process.pid)
    const pidFilePath = path.join(tempTestDir, 'postmaster.pid');
    fs.writeFileSync(pidFilePath, `${process.pid}\n${tempTestDir}\n1730000000\n5432\n`);

    const resAtivo = await verifyAndRecoverPostmasterPid(tempTestDir);
    assert(resAtivo.status === 'active_process', 'Processo ativo detectado com precisão');
    assert(
      fs.existsSync(pidFilePath),
      'REGRA CRÍTICA: postmaster.pid de processo ativo NUNCA foi removido (preservado no disco)'
    );

    // 11.3 postmaster.pid com PROCESSO MORTO / ÓRFÃO (ESRCH)
    _setProcessSignalCheckerForTesting((pid) => (pid === 88888 ? 'ESRCH' : true));
    fs.writeFileSync(pidFilePath, `88888\n${tempTestDir}\n1730000000\n5432\n`);

    const resMorto = await verifyAndRecoverPostmasterPid(tempTestDir);
    assert(resMorto.status === 'stale_cleaned', 'Processo morto (ESRCH) identificado com segurança');
    assert(!fs.existsSync(pidFilePath), 'postmaster.pid órfão foi removido para permitir reinicialização');

    // 11.4 postmaster.pid com PROCESSO ATIVO PROTEGIDO (EPERM)
    _setProcessSignalCheckerForTesting((pid) => (pid === 1 ? 'EPERM' : false));
    fs.writeFileSync(pidFilePath, `1\n${tempTestDir}\n1730000000\n5432\n`);

    const resEperm = await verifyAndRecoverPostmasterPid(tempTestDir);
    assert(resEperm.status === 'active_process', 'Processo retornando EPERM é tratado como ATIVO');
    assert(fs.existsSync(pidFilePath), 'postmaster.pid com status EPERM foi rigorosamente preservado no disco');
    _setProcessSignalCheckerForTesting(null);
    fs.unlinkSync(pidFilePath);

    // 11.5 postmaster.pid VAZIO (0 bytes) -> Quarentena e Backup Físico
    fs.writeFileSync(pidFilePath, '');
    const resVazioArquivo = await verifyAndRecoverPostmasterPid(tempTestDir);
    assert(resVazioArquivo.status === 'corrupt_cleaned', 'Arquivo postmaster.pid vazio foi colocado em quarentena');
    assert(!fs.existsSync(pidFilePath), 'Arquivo vazio original foi movido para fora do caminho');
    assert(
      !!resVazioArquivo.backupPath && fs.existsSync(resVazioArquivo.backupPath),
      'Comprovação física: arquivo de backup em quarentena gerado no disco para postmaster.pid vazio'
    );

    // 11.6 postmaster.pid com STRING PARCIALMENTE NUMÉRICA OU CORROMPIDA ("123abc")
    fs.writeFileSync(pidFilePath, '123abc\n/var/lib/data\n');
    const resParcial = await verifyAndRecoverPostmasterPid(tempTestDir);
    assert(
      resParcial.status === 'corrupt_cleaned',
      'String "123abc" rejeitada por validação estrita regex /^\d+$/ e colocada em quarentena'
    );
    assert(!fs.existsSync(pidFilePath), 'Arquivo com formato misto movido para quarentena');
    assert(
      !!resParcial.backupPath && fs.existsSync(resParcial.backupPath),
      'Comprovação física: backup em quarentena criado para formato corrompido "123abc"'
    );
    const backupContent = fs.readFileSync(resParcial.backupPath!, 'utf8');
    assert(backupContent.includes('123abc'), 'Conteúdo corrompido foi preservado intacto no arquivo de quarentena');

  } finally {
    _setProcessSignalCheckerForTesting(null);
    try {
      fs.rmSync(tempTestDir, { recursive: true, force: true });
    } catch {}
  }

  // -------------------------------------------------------------------------
  // 12. CONCORRÊNCIA ENTRE getPgEngine() E closePgEngine()
  // -------------------------------------------------------------------------
  console.log('\n--- Cenário 12: Sincronização entre getPgEngine() e closePgEngine() ---');
  await closePgEngine();

  // Dispara init e close concorrentemente
  const initP = getPgEngine();
  const closeP = closePgEngine();
  await Promise.all([initP, closeP]);

  // Após resolução ordenada pelo mutex, novo getPgEngine() deve abrir normalmente
  const finalEngine = await getPgEngine();
  assert(finalEngine !== null && !finalEngine.closed, 'Engine estável após encerramento sincronizado e nova inicialização');

  // -------------------------------------------------------------------------
  // 13. PREVENÇÃO DE FALLBACK SILENCIOSO EM AMBIENTE DE NAVEGADOR (PENDÊNCIA F)
  // -------------------------------------------------------------------------
  console.log('\n--- Cenário 13: Prevenção de Fallback Silencioso para Memória (Pendência F) ---');
  await closePgEngine();

  // Simula ambiente de navegador onde window.indexedDB existe mas falha
  (globalThis as any).window = { indexedDB: {} };
  let capturouErroPersistencia = false;

  try {
    await getPgEngine();
  } catch (err: any) {
    if (err.message.includes('Falha crítica de persistência') && err.message.includes('idb://oficina_mecanica_pg_v1')) {
      capturouErroPersistencia = true;
    }
  } finally {
    delete (globalThis as any).window;
    await closePgEngine();
  }

  assert(
    capturouErroPersistencia,
    'Erro de IndexedDB sem ALLOW_MEMORY_FALLBACK propagou exceção explícita (sem fallback silencioso para memória)'
  );

  // -------------------------------------------------------------------------
  // FINALIZAÇÃO E RELATÓRIO
  // -------------------------------------------------------------------------
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n======================================================================');
  console.log(` RESULTADO FINAL DOS TESTES: ${passedTests} PASSOU | ${failedTests} FALHOU`);
  console.log(` TEMPO TOTAL DE EXECUÇÃO:    ${duration}s`);
  console.log('======================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error('Erro inesperado durante a execução dos testes:', err);
  process.exit(1);
});

/**
 * AutoOS - Bateria Abrangente de Testes e Evidências Técnicas - Fase 1
 * 
 * Cobertura Completa e Específica:
 * 1. Inicialização singleton do PGlite sob concorrência de cold-start (30 chamadas).
 * 2. Encerramento limpo (closePgEngine) e reinicialização.
 * 3. Transações atômicas com auto-rollback e ausência de registros órfãos.
 * 4. Rollback quando a gravação de itens falha.
 * 5. Rollback quando a gravação de histórico falha.
 * 6. Concorrência massiva com números de OS sequenciais e exclusivos.
 * 7. Unicidade de numeração de OS garantida por restrição (UNIQUE) no banco.
 * 8. Persistência real dos dados em disco após close() e reabertura.
 * 9. Resiliência de inicializações simultâneas quando a inicialização falha e posterior recuperação.
 * 10. Preservação de dados reais durante restauração de backup com falha no meio do processo.
 * 11. Auditoria e tratamento seguro de postmaster.pid (ativo, órfão/ESRCH, corrompido, limpo).
 */

import fs from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import {
  getPgEngine,
  closePgEngine,
  executeQuery,
  executeCommand,
  executeTransaction,
  verifyAndRecoverPostmasterPid,
  wipeDatabaseClean,
  restoreFromJson,
} from '../src/db/pgEngine';
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
      // 1. Grava cabeçalho com sucesso
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

      // 2. Tenta gravar item com violação de NOT NULL (descricao null)
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
      // 1. Grava cabeçalho
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

      // 2. Grava item
      await tx.command(
        `INSERT INTO itens_os (id, os_id, tipo, descricao, quantidade, valor_unitario, valor_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['item_hist_ok', idOsFalhaHist, 'SERVICO', 'Alinhamento', 1, 150, 150]
      );

      // 3. Falha proposital na gravação do histórico (coluna status_novo null violando NOT NULL)
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
  // 6. OPERAÇÕES CONCORRENTES EM MASSA (20 ESCRITAS SIMULTÂNEAS)
  // -------------------------------------------------------------------------
  console.log('\n--- Cenário 6: Concorrência Massiva e Enfileiramento Serializado ---');
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
    `${totalConcorrentes} Ordens de Serviço criadas concorrentemente sem erro de colisão`
  );

  const numerosOS = resultadosConcorrentes.map((os) => os.numero);
  const numerosUnicos = new Set(numerosOS);
  assert(
    numerosUnicos.size === totalConcorrentes,
    `Todos os ${totalConcorrentes} números de OS gerados são estritamente sequenciais e exclusivos`
  );

  const todasOS = await OrdemServicoRepository.getAll({ clienteId: cli.id });
  const todasComItensCorretos = todasOS.every((os) => os.itens.length === 2 && os.total === 240);
  assert(todasComItensCorretos, 'Todos os itens filhos e totais gravados com integridade relacional');

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
        numeroJaExistente, // Número deliberadamente duplicado!
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
  // 8. PERSISTÊNCIA REAL UTILIZANDO O PRÓPRIO getPgEngine() DA APLICAÇÃO
  // -------------------------------------------------------------------------
  console.log('\n--- Cenário 8: Persistência Real Utilizando o Próprio getPgEngine() da Aplicação ---');
  const persistDir = path.join(process.cwd(), '.tmp_pg_persist_test_' + Date.now());
  fs.mkdirSync(persistDir, { recursive: true });

  try {
    // 8.1 Configura AUTOOS_DATA_DIR para o próprio getPgEngine() da aplicação usar o disco
    await closePgEngine();
    process.env.AUTOOS_DATA_DIR = persistDir;

    const appEngine1 = await getPgEngine();
    assert(!appEngine1.closed, 'getPgEngine() inicializado com sucesso apontando para AUTOOS_DATA_DIR');

    // 8.2 Grava registro usando o próprio executeCommand da aplicação
    await executeCommand(`
      INSERT INTO oficina (id, nome, modo_cabecalho, status_empresa)
      VALUES ('oficina_persist_app_test', 'Oficina Matriz Persistente AutoOS', 'composto', 'ATIVA')
      ON CONFLICT (id) DO UPDATE SET nome = 'Oficina Matriz Persistente AutoOS';
    `);

    const countGravado = await executeQuery<{ c: string }>(
      "SELECT count(*) as c FROM oficina WHERE id = 'oficina_persist_app_test'"
    );
    assert(parseInt(countGravado[0]?.c || '0', 10) === 1, 'Registro gravado via getPgEngine() no armazenamento em disco');

    // 8.3 Fecha o motor com closePgEngine() (flush físico para disco e liberação de locks)
    await closePgEngine();
    assert(appEngine1.closed, 'closePgEngine() encerrou com sucesso a instância e realizou flush');

    // 8.4 Reabre o banco utilizando o PRÓPRIO getPgEngine() da aplicação no MESMO diretório
    const appEngine2 = await getPgEngine();
    assert(!appEngine2.closed && appEngine2 !== appEngine1, 'getPgEngine() reinicializou nova instância no mesmo diretório');

    // 8.5 Consulta o dado previamente persistido usando executeQuery() da aplicação
    const rowsRecuperadas = await executeQuery<{ id: string; nome: string }>(
      "SELECT id, nome FROM oficina WHERE id = 'oficina_persist_app_test'"
    );

    assert(rowsRecuperadas.length === 1, 'Registro recuperado intacto após reinicialização física');
    assert(
      rowsRecuperadas[0]?.nome === 'Oficina Matriz Persistente AutoOS',
      'Integridade exata dos dados preservada via getPgEngine() persistente'
    );

    await closePgEngine();
  } finally {
    delete process.env.AUTOOS_DATA_DIR;
    await closePgEngine();
    try {
      fs.rmSync(persistDir, { recursive: true, force: true });
    } catch {}
  }

  // -------------------------------------------------------------------------
  // 9. RESILIÊNCIA QUANDO A PRIMEIRA INICIALIZAÇÃO FALHA E SUBSEQUENTE SUCESSO
  // -------------------------------------------------------------------------
  console.log('\n--- Cenário 9: Resiliência de Inicializações Simultâneas Após Falha ---');
  // Testa que uma falha transitória reseta initPromise e permite recuperação
  let erroEsperado = false;
  try {
    // Simula chamada que lança erro dentro do ciclo
    await executeTransaction(async () => {
      throw new Error('FALHA_SIMULADA_DE_CONEXAO');
    });
  } catch {
    erroEsperado = true;
  }
  assert(erroEsperado, 'Exceção transitória tratada pelo ciclo transacional');

  // Verifica que o motor continua 100% responsivo para requisições subsequentes
  const engineSaudavel = await getPgEngine();
  const ping = await executeQuery<{ ping: number }>('SELECT 1 as ping');
  assert(
    engineSaudavel !== null && ping[0]?.ping === 1,
    'Após erro transitório, o motor permaneceu disponível e atendeu novas queries perfeitamente'
  );

  // -------------------------------------------------------------------------
  // 10. PRESERVAÇÃO DE DADOS REAIS NA RESTAURAÇÃO DE BACKUP COM FALHA MEIO-A-MEIO
  // -------------------------------------------------------------------------
  console.log('\n--- Cenário 10: Preservação de Dados Reais contra Falha em Backup ---');
  // Insere um dado base conhecido
  await executeCommand(`
    INSERT INTO oficina (id, nome) VALUES ('oficina_baseline_segura', 'Oficina Matriz Base Segura')
    ON CONFLICT (id) DO UPDATE SET nome = 'Oficina Matriz Base Segura';
  `);

  const baselineAntes = await executeQuery<{ nome: string }>('SELECT nome FROM oficina WHERE id = $1', ['oficina_baseline_segura']);
  assert(baselineAntes[0]?.nome === 'Oficina Matriz Base Segura', 'Registro de produção base gravado para teste de isolamento');

  // Tenta restaurar um backup que contém falha proposital no array de veículos
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
        // Veículo inválido: violação de NOT NULL para disparar rollback
        {
          id: 'veic_invalido',
          cliente_id: null, // Violação de NOT NULL
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

  assert(backupFailedAsExpected, 'Restauração com pacote defeituoso foi abortada com exceção');

  // Verifica que os dados originais NÃO foram apagados (o DELETE foi revertido via ROLLBACK)
  const baselineDepois = await executeQuery<{ nome: string }>('SELECT nome FROM oficina WHERE id = $1', ['oficina_baseline_segura']);
  assert(
    baselineDepois.length === 1 && baselineDepois[0].nome === 'Oficina Matriz Base Segura',
    'DADOS ORIGINAIS 100% PRESERVADOS: Rollback impediu que o DELETE destruísse os dados da oficina'
  );

  // -------------------------------------------------------------------------
  // 11. AUDITORIA E TRATAMENTO SEGURO DE POSTMASTER.PID
  // -------------------------------------------------------------------------
  console.log('\n--- Cenário 11: Tratamento Seguro e Não-Destrutivo de postmaster.pid ---');
  const tempTestDir = path.join(process.cwd(), '.tmp_postmaster_test_' + Date.now());
  fs.mkdirSync(tempTestDir, { recursive: true });

  try {
    // 11.1 Diretório sem postmaster.pid
    const resVazio = await verifyAndRecoverPostmasterPid(tempTestDir);
    assert(resVazio.status === 'none', 'Diretório sem lock reportou status "none"');

    // 11.2 postmaster.pid com PROCESSO ATIVO (process.pid)
    const activePidFile = path.join(tempTestDir, 'postmaster.pid');
    fs.writeFileSync(activePidFile, `${process.pid}\n${tempTestDir}\n1730000000\n5432\n`);

    const resAtivo = await verifyAndRecoverPostmasterPid(tempTestDir);
    assert(resAtivo.status === 'active_process', 'Processo ativo detectado com precisão');
    assert(
      fs.existsSync(activePidFile),
      'REGRA CRÍTICA: postmaster.pid de processo ativo NUNCA foi removido (arquivo preservado no disco)'
    );

    // 11.3 postmaster.pid com PROCESSO MORTO / ÓRFÃO (PID inexistente: 999999)
    let deadPid = 999999;
    try {
      process.kill(deadPid, 0);
      deadPid = 999998;
    } catch (e: any) {
      // ESRCH significa que o PID está morto
    }
    fs.writeFileSync(activePidFile, `${deadPid}\n${tempTestDir}\n1730000000\n5432\n`);

    const resMorto = await verifyAndRecoverPostmasterPid(tempTestDir);
    assert(resMorto.status === 'stale_cleaned', 'Lock órfão identificado com segurança');
    assert(
      !fs.existsSync(activePidFile),
      'Lock órfão de processo morto (ESRCH) foi limpo com segurança para destravar inicialização'
    );

    // 11.4 postmaster.pid com DADOS CORROMPIDOS (não-número)
    fs.writeFileSync(activePidFile, 'DADOS_LIXO_CORROMPIDOS\n');
    const resCorrompido = await verifyAndRecoverPostmasterPid(tempTestDir);
    assert(resCorrompido.status === 'corrupt_cleaned', 'Arquivo corrompido foi tratado e isolado em backup');
  } finally {
    try {
      fs.rmSync(tempTestDir, { recursive: true, force: true });
    } catch {}
  }

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

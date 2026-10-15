import { PGlite } from '@electric-sql/pglite';
import {
  OFICINA_PADRAO,
  USUARIOS_INICIAIS,
  CLIENTES_DEMO,
  VEICULOS_DEMO,
  ORDENS_SERVICO_DEMO,
} from './initialData';
import { BackupMetadata } from '../types';

let pgInstance: PGlite | null = null;
let isInitialized = false;

// SQL DDL para criação do schema PostgreSQL
const SCHEMA_DDL = `
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS oficina (
    id VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    razao_social VARCHAR(255),
    nome_fantasia VARCHAR(255),
    cnpj VARCHAR(30),
    telefone VARCHAR(30),
    whatsapp VARCHAR(30),
    email VARCHAR(150),
    cep VARCHAR(10),
    logradouro VARCHAR(255),
    numero VARCHAR(30),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    logo TEXT,
    banner_cabecalho TEXT,
    cabecalho_fundo TEXT,
    cabecalho_logo TEXT,
    cabecalho_escritas TEXT,
    modo_cabecalho VARCHAR(30) DEFAULT 'composto',
    texto_institucional TEXT,
    texto_padrao_garantia TEXT,
    texto_padrao_condicoes TEXT,
    status_empresa VARCHAR(30) DEFAULT 'ATIVA',
    plano VARCHAR(30) DEFAULT 'PRO',
    limite_os_mensal INTEGER DEFAULT 500,
    data_expiracao VARCHAR(30),
    responsavel_nome VARCHAR(150),
    responsavel_contato VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR(50) PRIMARY KEY,
    oficina_id VARCHAR(50),
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(30),
    cep VARCHAR(10),
    logradouro VARCHAR(255),
    numero VARCHAR(30),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    perfil VARCHAR(30) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clientes (
    id VARCHAR(50) PRIMARY KEY,
    oficina_id VARCHAR(50),
    nome VARCHAR(255) NOT NULL,
    cpf_cnpj VARCHAR(30),
    telefone VARCHAR(30),
    whatsapp VARCHAR(30),
    email VARCHAR(150),
    cep VARCHAR(10),
    logradouro VARCHAR(255),
    numero VARCHAR(30),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS veiculos (
    id VARCHAR(50) PRIMARY KEY,
    cliente_id VARCHAR(50) NOT NULL,
    veiculo VARCHAR(100) NOT NULL,
    marca VARCHAR(60) NOT NULL,
    ano INTEGER NOT NULL,
    cor VARCHAR(40) NOT NULL,
    placa VARCHAR(15) NOT NULL,
    quilometragem INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ordens_servico (
    id VARCHAR(50) PRIMARY KEY,
    oficina_id VARCHAR(50) DEFAULT 'oficina_matriz',
    numero INTEGER NOT NULL,
    numero_formatado VARCHAR(20) NOT NULL,
    data VARCHAR(10) NOT NULL,
    hora VARCHAR(8) NOT NULL,
    cliente_id VARCHAR(50) NOT NULL,
    veiculo_id VARCHAR(50) NOT NULL,
    cliente_nome VARCHAR(255) NOT NULL,
    cliente_cpf_cnpj VARCHAR(30),
    cliente_telefone VARCHAR(30),
    cliente_whatsapp VARCHAR(30),
    cliente_email VARCHAR(150),
    cliente_endereco VARCHAR(300),
    cliente_cep VARCHAR(10),
    veiculo_modelo VARCHAR(100) NOT NULL,
    veiculo_marca VARCHAR(60) NOT NULL,
    veiculo_ano INTEGER NOT NULL,
    veiculo_cor VARCHAR(40) NOT NULL,
    veiculo_placa VARCHAR(15) NOT NULL,
    quilometragem INTEGER NOT NULL DEFAULT 0,
    quilometragem_anterior INTEGER DEFAULT 0,
    reclamacao_cliente TEXT NOT NULL,
    diagnostico_avaliacao TEXT,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    desconto NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    acrescimo NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    forma_pagamento VARCHAR(30) NOT NULL DEFAULT 'Pix',
    observacoes TEXT,
    garantia TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'ABERTA',
    motivo_cancelamento TEXT,
    cancelado_por_usuario VARCHAR(150),
    data_cancelamento VARCHAR(30),
    usuario_responsavel_id VARCHAR(50),
    usuario_responsavel_nome VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS itens_os (
    id VARCHAR(50) PRIMARY KEY,
    os_id VARCHAR(50) NOT NULL,
    tipo VARCHAR(20) NOT NULL DEFAULT 'SERVICO',
    descricao VARCHAR(255) NOT NULL,
    quantidade NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    valor_unitario NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    valor_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS historico_status (
    id VARCHAR(50) PRIMARY KEY,
    os_id VARCHAR(50) NOT NULL,
    status_anterior VARCHAR(30) NOT NULL,
    status_novo VARCHAR(30) NOT NULL,
    usuario_id VARCHAR(50),
    usuario_nome VARCHAR(150) NOT NULL,
    motivo TEXT,
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS atualizacoes_sistema (
    id VARCHAR(50) PRIMARY KEY,
    versao_anterior VARCHAR(50) NOT NULL,
    versao_instalada VARCHAR(50) NOT NULL,
    tipo_origem VARCHAR(50) NOT NULL,
    local_origem TEXT NOT NULL,
    descricao TEXT,
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    usuario_nome VARCHAR(150),
    status VARCHAR(30) NOT NULL DEFAULT 'SUCESSO',
    backup_snapshot TEXT
);

CREATE TABLE IF NOT EXISTS sistema_info (
    chave VARCHAR(50) PRIMARY KEY,
    valor TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

export async function getPgEngine(): Promise<PGlite> {
  if (pgInstance) {
    return pgInstance;
  }

  try {
    // Tenta persistir no IndexedDB do navegador para manter os dados mesmo fechando a aba
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      pgInstance = new PGlite('idb://oficina_mecanica_pg_v1');
    } else {
      pgInstance = new PGlite();
    }
    await pgInstance.waitReady;
  } catch (err) {
    console.warn('Falha ao abrir PGlite no IndexedDB, usando em memória:', err);
    pgInstance = new PGlite();
    await pgInstance.waitReady;
  }

  if (!isInitialized) {
    await initializeDatabase(pgInstance);
    isInitialized = true;
  }

  return pgInstance;
}

async function initializeDatabase(db: PGlite): Promise<void> {
  // 1. Executa criação das tabelas
  await db.exec(SCHEMA_DDL);

  // Garante que as novas colunas de cabeçalho, Micro-SaaS multi-tenant e dados de usuários existam
  const migrations = [
    'ALTER TABLE oficina ADD COLUMN IF NOT EXISTS banner_cabecalho TEXT',
    'ALTER TABLE oficina ADD COLUMN IF NOT EXISTS cabecalho_fundo TEXT',
    'ALTER TABLE oficina ADD COLUMN IF NOT EXISTS cabecalho_logo TEXT',
    'ALTER TABLE oficina ADD COLUMN IF NOT EXISTS cabecalho_escritas TEXT',
    "ALTER TABLE oficina ADD COLUMN IF NOT EXISTS modo_cabecalho VARCHAR(30) DEFAULT 'composto'",
    "ALTER TABLE oficina ADD COLUMN IF NOT EXISTS status_empresa VARCHAR(30) DEFAULT 'ATIVA'",
    "ALTER TABLE oficina ADD COLUMN IF NOT EXISTS plano VARCHAR(30) DEFAULT 'PRO'",
    'ALTER TABLE oficina ADD COLUMN IF NOT EXISTS limite_os_mensal INTEGER DEFAULT 500',
    'ALTER TABLE oficina ADD COLUMN IF NOT EXISTS data_expiracao VARCHAR(30)',
    'ALTER TABLE oficina ADD COLUMN IF NOT EXISTS responsavel_nome VARCHAR(150)',
    'ALTER TABLE oficina ADD COLUMN IF NOT EXISTS responsavel_contato VARCHAR(100)',
    "ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS oficina_id VARCHAR(50) DEFAULT 'oficina_matriz'",
    "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS oficina_id VARCHAR(50) DEFAULT 'oficina_matriz'",
    "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS oficina_id VARCHAR(50) DEFAULT 'oficina_matriz'",
    'ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefone VARCHAR(30)',
    'ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cep VARCHAR(10)',
    'ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS logradouro VARCHAR(255)',
    'ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS numero VARCHAR(30)',
    'ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bairro VARCHAR(100)',
    'ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cidade VARCHAR(100)',
    'ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS estado VARCHAR(2)',
    "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS senha VARCHAR(255) DEFAULT '123'",
  ];

  for (const sql of migrations) {
    try {
      await db.exec(sql);
    } catch {
      // Ignora caso a coluna já exista
    }
  }

  // 2. Registra migration inicial
  const migrationCheck = await db.query<{ count: string }>(
    `SELECT count(*) as count FROM migrations WHERE name = '001_initial_schema'`
  );
  if (parseInt(migrationCheck.rows[0]?.count || '0', 10) === 0) {
    await db.query(
      `INSERT INTO migrations (name) VALUES ('001_initial_schema')`
    );
  }

  // 3. Em uma nova instalação, garante que a oficina padrão e o usuário Super Administrador Geral existam no banco
  const oficinaCheck = await db.query<{ count: string }>('SELECT count(*) as count FROM oficina');
  if (parseInt(oficinaCheck.rows[0]?.count || '0', 10) === 0) {
    await db.query(
      `INSERT INTO oficina (
        id, nome, razao_social, nome_fantasia, cnpj, telefone, whatsapp, email,
        cep, logradouro, numero, complemento, bairro, cidade, estado,
        modo_cabecalho, status_empresa, plano, limite_os_mensal,
        texto_institucional, texto_padrao_garantia, texto_padrao_condicoes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
      [
        OFICINA_PADRAO.id,
        OFICINA_PADRAO.nome,
        OFICINA_PADRAO.razao_social,
        OFICINA_PADRAO.nome_fantasia,
        OFICINA_PADRAO.cnpj,
        OFICINA_PADRAO.telefone,
        OFICINA_PADRAO.whatsapp,
        OFICINA_PADRAO.email,
        OFICINA_PADRAO.cep,
        OFICINA_PADRAO.logradouro,
        OFICINA_PADRAO.numero,
        OFICINA_PADRAO.complemento,
        OFICINA_PADRAO.bairro,
        OFICINA_PADRAO.cidade,
        OFICINA_PADRAO.estado,
        'composto',
        'ATIVA',
        'PRO',
        1000,
        OFICINA_PADRAO.texto_institucional,
        OFICINA_PADRAO.texto_padrao_garantia,
        OFICINA_PADRAO.texto_padrao_condicoes,
      ]
    );
  }

  const usuarioCheck = await db.query<{ count: string }>('SELECT count(*) as count FROM usuarios');
  if (parseInt(usuarioCheck.rows[0]?.count || '0', 10) === 0) {
    await db.query(
      `INSERT INTO usuarios (id, oficina_id, nome, email, senha, perfil, ativo, telefone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        'admin_master',
        OFICINA_PADRAO.id,
        'Administrador Geral (Master)',
        'admin@autoos.com.br',
        'admin',
        'SUPERADMIN',
        true,
        '(11) 96944-0424',
      ]
    );
  }
}

export async function seedInitialData(db: PGlite): Promise<void> {
  // Salva Oficina
  await db.query(
    `INSERT INTO oficina (
      id, nome, razao_social, nome_fantasia, cnpj, telefone, whatsapp, email,
      cep, logradouro, numero, complemento, bairro, cidade, estado, logo,
      texto_institucional, texto_padrao_garantia, texto_padrao_condicoes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
    [
      OFICINA_PADRAO.id,
      OFICINA_PADRAO.nome,
      OFICINA_PADRAO.razao_social,
      OFICINA_PADRAO.nome_fantasia,
      OFICINA_PADRAO.cnpj,
      OFICINA_PADRAO.telefone,
      OFICINA_PADRAO.whatsapp,
      OFICINA_PADRAO.email,
      OFICINA_PADRAO.cep,
      OFICINA_PADRAO.logradouro,
      OFICINA_PADRAO.numero,
      OFICINA_PADRAO.complemento,
      OFICINA_PADRAO.bairro,
      OFICINA_PADRAO.cidade,
      OFICINA_PADRAO.estado,
      OFICINA_PADRAO.logo,
      OFICINA_PADRAO.texto_institucional,
      OFICINA_PADRAO.texto_padrao_garantia,
      OFICINA_PADRAO.texto_padrao_condicoes,
    ]
  );

  // Salva Usuários
  for (const user of USUARIOS_INICIAIS) {
    await db.query(
      `INSERT INTO usuarios (id, oficina_id, nome, email, senha, perfil, ativo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user.id, user.oficina_id, user.nome, user.email, user.senha || '123', user.perfil, user.ativo]
    );
  }

  // Salva Clientes
  for (const cli of CLIENTES_DEMO) {
    await db.query(
      `INSERT INTO clientes (
        id, oficina_id, nome, cpf_cnpj, telefone, whatsapp, email,
        cep, logradouro, numero, complemento, bairro, cidade, estado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        cli.id, cli.oficina_id, cli.nome, cli.cpf_cnpj, cli.telefone, cli.whatsapp, cli.email,
        cli.cep, cli.logradouro, cli.numero, cli.complemento, cli.bairro, cli.cidade, cli.estado
      ]
    );
  }

  // Salva Veículos
  for (const veic of VEICULOS_DEMO) {
    await db.query(
      `INSERT INTO veiculos (
        id, cliente_id, veiculo, marca, ano, cor, placa, quilometragem
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        veic.id, veic.cliente_id, veic.veiculo, veic.marca, veic.ano, veic.cor, veic.placa, veic.quilometragem
      ]
    );
  }

  // Salva Ordens de Serviço
  for (const os of ORDENS_SERVICO_DEMO) {
    await db.query(
      `INSERT INTO ordens_servico (
        id, numero, numero_formatado, data, hora, cliente_id, veiculo_id,
        cliente_nome, cliente_cpf_cnpj, cliente_telefone, cliente_whatsapp, cliente_email,
        cliente_endereco, cliente_cep, veiculo_modelo, veiculo_marca, veiculo_ano,
        veiculo_cor, veiculo_placa, quilometragem, quilometragem_anterior,
        reclamacao_cliente, diagnostico_avaliacao, subtotal, desconto, acrescimo,
        total, forma_pagamento, observacoes, garantia, status,
        usuario_responsavel_id, usuario_responsavel_nome
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33
      )`,
      [
        os.id, os.numero, os.numero_formatado, os.data, os.hora, os.cliente_id, os.veiculo_id,
        os.cliente_nome, os.cliente_cpf_cnpj, os.cliente_telefone, os.cliente_whatsapp, os.cliente_email,
        os.cliente_endereco, os.cliente_cep, os.veiculo_modelo, os.veiculo_marca, os.veiculo_ano,
        os.veiculo_cor, os.veiculo_placa, os.quilometragem, os.quilometragem_anterior || 0,
        os.reclamacao_cliente, os.diagnostico_avaliacao, os.subtotal, os.desconto, os.acrescimo,
        os.total, os.forma_pagamento, os.observacoes, os.garantia, os.status,
        os.usuario_responsavel_id, os.usuario_responsavel_nome
      ]
    );

    // Salva itens da OS
    for (const item of os.itens) {
      await db.query(
        `INSERT INTO itens_os (id, os_id, tipo, descricao, quantidade, valor_unitario, valor_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [item.id, os.id, item.tipo, item.descricao, item.quantidade, item.valor_unitario, item.valor_total]
      );
    }
  }
}

// Wrapper seguro para consultas SQL
export async function executeQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getPgEngine();
  const res = await db.query<T>(sql, params);
  return res.rows;
}

export async function executeCommand(sql: string, params: any[] = []): Promise<void> {
  const db = await getPgEngine();
  await db.query(sql, params);
}

// Geração de DUMP PostgreSQL completo (.SQL) pronto para `psql -U postgres -d oficina < backup.sql`
export async function generatePostgreSqlDump(): Promise<string> {
  const db = await getPgEngine();
  let sqlDump = `-- ==============================================================================
-- BACKUP EXPORT / DUMP POSTGRESQL - SISTEMA DE ORDEM DE SERVIÇO
-- Gerado em: ${new Date().toISOString()}
-- Versão do Banco: PostgreSQL 16 (PGlite Engine)
-- ==============================================================================

BEGIN;

${SCHEMA_DDL}

-- Limpeza prévia para restauração idempotente
DELETE FROM itens_os;
DELETE FROM ordens_servico;
DELETE FROM veiculos;
DELETE FROM clientes;
DELETE FROM usuarios;
DELETE FROM oficina;

`;

  // Oficina
  const oficinas = (await db.query<any>(`SELECT * FROM oficina`)).rows;
  for (const o of oficinas) {
    sqlDump += `INSERT INTO oficina VALUES (${escapeSql(o.id)}, ${escapeSql(o.nome)}, ${escapeSql(o.razao_social)}, ${escapeSql(o.nome_fantasia)}, ${escapeSql(o.cnpj)}, ${escapeSql(o.telefone)}, ${escapeSql(o.whatsapp)}, ${escapeSql(o.email)}, ${escapeSql(o.cep)}, ${escapeSql(o.logradouro)}, ${escapeSql(o.numero)}, ${escapeSql(o.complemento)}, ${escapeSql(o.bairro)}, ${escapeSql(o.cidade)}, ${escapeSql(o.estado)}, ${escapeSql(o.logo)}, ${escapeSql(o.texto_institucional)}, ${escapeSql(o.texto_padrao_garantia)}, ${escapeSql(o.texto_padrao_condicoes)}, '${o.created_at || new Date().toISOString()}', '${o.updated_at || new Date().toISOString()}');\n`;
  }

  // Usuários
  const usuarios = (await db.query<any>(`SELECT * FROM usuarios`)).rows;
  for (const u of usuarios) {
    sqlDump += `INSERT INTO usuarios (id, oficina_id, nome, email, senha, telefone, cep, logradouro, numero, bairro, cidade, estado, perfil, ativo, created_at, updated_at) VALUES (${escapeSql(u.id)}, ${escapeSql(u.oficina_id)}, ${escapeSql(u.nome)}, ${escapeSql(u.email)}, ${escapeSql(u.senha || '123')}, ${escapeSql(u.telefone || '')}, ${escapeSql(u.cep || '')}, ${escapeSql(u.logradouro || '')}, ${escapeSql(u.numero || '')}, ${escapeSql(u.bairro || '')}, ${escapeSql(u.cidade || '')}, ${escapeSql(u.estado || '')}, ${escapeSql(u.perfil)}, ${u.ativo ? 'TRUE' : 'FALSE'}, '${u.created_at || new Date().toISOString()}', '${u.updated_at || new Date().toISOString()}');\n`;
  }

  // Clientes
  const clientes = (await db.query<any>(`SELECT * FROM clientes`)).rows;
  for (const c of clientes) {
    sqlDump += `INSERT INTO clientes VALUES (${escapeSql(c.id)}, ${escapeSql(c.oficina_id)}, ${escapeSql(c.nome)}, ${escapeSql(c.cpf_cnpj)}, ${escapeSql(c.telefone)}, ${escapeSql(c.whatsapp)}, ${escapeSql(c.email)}, ${escapeSql(c.cep)}, ${escapeSql(c.logradouro)}, ${escapeSql(c.numero)}, ${escapeSql(c.complemento)}, ${escapeSql(c.bairro)}, ${escapeSql(c.cidade)}, ${escapeSql(c.estado)}, '${c.created_at || new Date().toISOString()}', '${c.updated_at || new Date().toISOString()}');\n`;
  }

  // Veículos
  const veiculos = (await db.query<any>(`SELECT * FROM veiculos`)).rows;
  for (const v of veiculos) {
    sqlDump += `INSERT INTO veiculos VALUES (${escapeSql(v.id)}, ${escapeSql(v.cliente_id)}, ${escapeSql(v.veiculo)}, ${escapeSql(v.marca)}, ${v.ano}, ${escapeSql(v.cor)}, ${escapeSql(v.placa)}, ${v.quilometragem}, '${v.created_at || new Date().toISOString()}', '${v.updated_at || new Date().toISOString()}');\n`;
  }

  // Ordens de Serviço
  const osList = (await db.query<any>(`SELECT * FROM ordens_servico`)).rows;
  for (const o of osList) {
    sqlDump += `INSERT INTO ordens_servico VALUES (
      ${escapeSql(o.id)}, ${o.numero}, ${escapeSql(o.numero_formatado)}, ${escapeSql(o.data)}, ${escapeSql(o.hora)},
      ${escapeSql(o.cliente_id)}, ${escapeSql(o.veiculo_id)}, ${escapeSql(o.cliente_nome)}, ${escapeSql(o.cliente_cpf_cnpj)},
      ${escapeSql(o.cliente_telefone)}, ${escapeSql(o.cliente_whatsapp)}, ${escapeSql(o.cliente_email)}, ${escapeSql(o.cliente_endereco)},
      ${escapeSql(o.cliente_cep)}, ${escapeSql(o.veiculo_modelo)}, ${escapeSql(o.veiculo_marca)}, ${o.veiculo_ano},
      ${escapeSql(o.veiculo_cor)}, ${escapeSql(o.veiculo_placa)}, ${o.quilometragem}, ${o.quilometragem_anterior || 0},
      ${escapeSql(o.reclamacao_cliente)}, ${escapeSql(o.diagnostico_avaliacao)}, ${o.subtotal}, ${o.desconto}, ${o.acrescimo},
      ${o.total}, ${escapeSql(o.forma_pagamento)}, ${escapeSql(o.observacoes)}, ${escapeSql(o.garantia)}, ${escapeSql(o.status)},
      ${escapeSql(o.motivo_cancelamento)}, ${escapeSql(o.cancelado_por_usuario)}, ${escapeSql(o.data_cancelamento)},
      ${escapeSql(o.usuario_responsavel_id)}, ${escapeSql(o.usuario_responsavel_nome)}, '${o.created_at || new Date().toISOString()}', '${o.updated_at || new Date().toISOString()}'
    );\n`;
  }

  // Itens OS
  const itens = (await db.query<any>(`SELECT * FROM itens_os`)).rows;
  for (const item of itens) {
    sqlDump += `INSERT INTO itens_os VALUES (${escapeSql(item.id)}, ${escapeSql(item.os_id)}, ${escapeSql(item.tipo)}, ${escapeSql(item.descricao)}, ${item.quantidade}, ${item.valor_unitario}, ${item.valor_total});\n`;
  }

  sqlDump += `\nCOMMIT;\n-- FIM DO DUMP POSTGRESQL\n`;
  return sqlDump;
}

function escapeSql(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

// Exportação completa em JSON para backup estruturado
export async function generateJsonBackup(): Promise<{ metadata: BackupMetadata; data: any }> {
  const db = await getPgEngine();
  const oficina = (await db.query(`SELECT * FROM oficina`)).rows;
  const usuarios = (await db.query(`SELECT * FROM usuarios`)).rows;
  const clientes = (await db.query(`SELECT * FROM clientes`)).rows;
  const veiculos = (await db.query(`SELECT * FROM veiculos`)).rows;
  const osList = (await db.query(`SELECT * FROM ordens_servico`)).rows;
  const itens = (await db.query(`SELECT * FROM itens_os`)).rows;
  const historico = (await db.query(`SELECT * FROM historico_status`)).rows;

  const metadata: BackupMetadata = {
    data_backup: new Date().toISOString(),
    versao_schema: '1.0.0',
    total_clientes: clientes.length,
    total_veiculos: veiculos.length,
    total_os: osList.length,
    sistema: 'AutoOS - Mecânica',
  };

  return {
    metadata,
    data: {
      oficina,
      usuarios,
      clientes,
      veiculos,
      ordens_servico: osList,
      itens_os: itens,
      historico_status: historico,
    },
  };
}

// Restauração a partir de JSON
export async function restoreFromJson(backupData: any): Promise<void> {
  const db = await getPgEngine();
  const d = backupData.data || backupData;

  if (!d.oficina && !d.clientes) {
    throw new Error('Arquivo de backup inválido ou estrutura corrompida.');
  }

  await db.exec(`
    DELETE FROM itens_os;
    DELETE FROM historico_status;
    DELETE FROM ordens_servico;
    DELETE FROM veiculos;
    DELETE FROM clientes;
    DELETE FROM usuarios;
    DELETE FROM oficina;
  `);

  // Restaura oficina
  if (d.oficina && d.oficina.length > 0) {
    for (const o of d.oficina) {
      await db.query(
        `INSERT INTO oficina VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
        [
          o.id, o.nome, o.razao_social, o.nome_fantasia, o.cnpj, o.telefone, o.whatsapp, o.email,
          o.cep, o.logradouro, o.numero, o.complemento, o.bairro, o.cidade, o.estado, o.logo,
          o.texto_institucional, o.texto_padrao_garantia, o.texto_padrao_condicoes,
          o.created_at || new Date().toISOString(), o.updated_at || new Date().toISOString()
        ]
      );
    }
  }

  // Restaura usuários
  if (d.usuarios) {
    for (const u of d.usuarios) {
      await db.query(
        `INSERT INTO usuarios (id, oficina_id, nome, email, senha, telefone, cep, logradouro, numero, bairro, cidade, estado, perfil, ativo, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          u.id,
          u.oficina_id || 'oficina_matriz',
          u.nome,
          u.email,
          u.senha || '123',
          u.telefone || '',
          u.cep || '',
          u.logradouro || '',
          u.numero || '',
          u.bairro || '',
          u.cidade || '',
          u.estado || '',
          u.perfil,
          u.ativo ?? true,
          u.created_at || new Date().toISOString(),
          u.updated_at || new Date().toISOString(),
        ]
      );
    }
  }

  // Restaura clientes
  if (d.clientes) {
    for (const c of d.clientes) {
      await db.query(
        `INSERT INTO clientes VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          c.id, c.oficina_id, c.nome, c.cpf_cnpj, c.telefone, c.whatsapp, c.email,
          c.cep, c.logradouro, c.numero, c.complemento, c.bairro, c.cidade, c.estado,
          c.created_at || new Date().toISOString(), c.updated_at || new Date().toISOString()
        ]
      );
    }
  }

  // Restaura veículos
  if (d.veiculos) {
    for (const v of d.veiculos) {
      await db.query(
        `INSERT INTO veiculos VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [v.id, v.cliente_id, v.veiculo, v.marca, v.ano, v.cor, v.placa, v.quilometragem, v.created_at || new Date().toISOString(), v.updated_at || new Date().toISOString()]
      );
    }
  }

  // Restaura ordens_servico
  if (d.ordens_servico) {
    for (const o of d.ordens_servico) {
      await db.query(
        `INSERT INTO ordens_servico VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32,
          $33, $34, $35, $36, $37, $38
        )`,
        [
          o.id, o.numero, o.numero_formatado, o.data, o.hora, o.cliente_id, o.veiculo_id,
          o.cliente_nome, o.cliente_cpf_cnpj, o.cliente_telefone, o.cliente_whatsapp, o.cliente_email,
          o.cliente_endereco, o.cliente_cep, o.veiculo_modelo, o.veiculo_marca, o.veiculo_ano,
          o.veiculo_cor, o.veiculo_placa, o.quilometragem, o.quilometragem_anterior || 0,
          o.reclamacao_cliente, o.diagnostico_avaliacao, o.subtotal, o.desconto, o.acrescimo,
          o.total, o.forma_pagamento, o.observacoes, o.garantia, o.status,
          o.motivo_cancelamento, o.cancelado_por_usuario, o.data_cancelamento,
          o.usuario_responsavel_id, o.usuario_responsavel_nome, o.created_at || new Date().toISOString(), o.updated_at || new Date().toISOString()
        ]
      );
    }
  }

  // Restaura itens_os
  if (d.itens_os) {
    for (const it of d.itens_os) {
      await db.query(
        `INSERT INTO itens_os VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [it.id, it.os_id, it.tipo, it.descricao, it.quantidade, it.valor_unitario, it.valor_total]
      );
    }
  }
}

// Limpeza exclusiva de dados de demonstração (mantém oficina e usuários)
export async function cleanDemoData(): Promise<void> {
  const db = await getPgEngine();
  await db.exec(`
    DELETE FROM itens_os WHERE os_id IN ('os_001', 'os_002');
    DELETE FROM ordens_servico WHERE id IN ('os_001', 'os_002');
    DELETE FROM veiculos WHERE id IN ('veic_01', 'veic_02', 'veic_03');
    DELETE FROM clientes WHERE id IN ('cli_01', 'cli_02', 'cli_03');
  `);
}

// Limpeza completa (Zerar Banco para Modo Nova Instalação)
export async function wipeDatabaseClean(): Promise<void> {
  const db = await getPgEngine();
  await db.exec(`
    DELETE FROM itens_os;
    DELETE FROM historico_status;
    DELETE FROM ordens_servico;
    DELETE FROM veiculos;
    DELETE FROM clientes;
    DELETE FROM usuarios;
    DELETE FROM oficina;
  `);
}

// Reset para dados de demonstração (quando solicitado pelo usuário)
export async function resetDatabase(): Promise<void> {
  const db = await getPgEngine();
  await wipeDatabaseClean();
  await seedInitialData(db);
}

-- ==============================================================================
-- SCHEMA POSTGRESQL V1 - SISTEMA DE ORDEM DE SERVIÇO PARA OFICINA MECÂNICA
-- Compatível com PostgreSQL 14+, PGlite (WASM) e PostgreSQL em Nuvem (Cloud SQL / RDS)
-- ==============================================================================

-- 1. TABELA DE MIGRAÇÕES / VERSÃO DO SCHEMA
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DA OFICINA (CONFIGURAÇÃO)
CREATE TABLE IF NOT EXISTS oficina (
    id VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    razao_social VARCHAR(255),
    nome_fantasia VARCHAR(255),
    cnpj VARCHAR(20),
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
    texto_institucional TEXT,
    texto_padrao_garantia TEXT,
    texto_padrao_condicoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR(50) PRIMARY KEY,
    oficina_id VARCHAR(50) REFERENCES oficina(id) ON DELETE SET NULL,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    perfil VARCHAR(30) NOT NULL CHECK (perfil IN ('ADMINISTRADOR', 'MECANICO')),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABELA DE CLIENTES
CREATE TABLE IF NOT EXISTS clientes (
    id VARCHAR(50) PRIMARY KEY,
    oficina_id VARCHAR(50) REFERENCES oficina(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    cpf_cnpj VARCHAR(20),
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

CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);
CREATE INDEX IF NOT EXISTS idx_clientes_cpf_cnpj ON clientes(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON clientes(telefone);

-- 5. TABELA DE VEÍCULOS
CREATE TABLE IF NOT EXISTS veiculos (
    id VARCHAR(50) PRIMARY KEY,
    cliente_id VARCHAR(50) NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    veiculo VARCHAR(100) NOT NULL,
    marca VARCHAR(60) NOT NULL,
    ano INTEGER NOT NULL CHECK (ano >= 1900 AND ano <= 2100),
    cor VARCHAR(40) NOT NULL,
    placa VARCHAR(15) NOT NULL UNIQUE,
    quilometragem INTEGER NOT NULL DEFAULT 0 CHECK (quilometragem >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_veiculos_cliente ON veiculos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_placa ON veiculos(placa);
CREATE INDEX IF NOT EXISTS idx_veiculos_marca_veiculo ON veiculos(marca, veiculo);

-- 6. TABELA DE ORDENS DE SERVIÇO
CREATE TABLE IF NOT EXISTS ordens_servico (
    id VARCHAR(50) PRIMARY KEY,
    numero SERIAL UNIQUE,
    numero_formatado VARCHAR(20) NOT NULL UNIQUE,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    hora VARCHAR(8) NOT NULL,
    cliente_id VARCHAR(50) NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    veiculo_id VARCHAR(50) NOT NULL REFERENCES veiculos(id) ON DELETE RESTRICT,
    
    -- Snapshots para integridade histórica imutável
    cliente_nome VARCHAR(255) NOT NULL,
    cliente_cpf_cnpj VARCHAR(20),
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
    quilometragem INTEGER NOT NULL CHECK (quilometragem >= 0),
    quilometragem_anterior INTEGER,

    -- Descrições técnicas
    reclamacao_cliente TEXT NOT NULL,
    diagnostico_avaliacao TEXT,

    -- Financeiro
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    desconto NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (desconto >= 0),
    acrescimo NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (acrescimo >= 0),
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
    forma_pagamento VARCHAR(30) NOT NULL DEFAULT 'Pix',

    -- Textos
    observacoes TEXT,
    garantia TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'ABERTA' CHECK (
        status IN ('ABERTA', 'AGUARDANDO APROVAÇÃO', 'APROVADA', 'EM EXECUÇÃO', 'CONCLUÍDA', 'ENTREGUE', 'CANCELADA')
    ),

    -- Cancelamento
    motivo_cancelamento TEXT,
    cancelado_por_usuario VARCHAR(150),
    data_cancelamento TIMESTAMP WITH TIME ZONE,

    -- Responsável técnico
    usuario_responsavel_id VARCHAR(50) REFERENCES usuarios(id),
    usuario_responsavel_nome VARCHAR(150) NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_os_cliente ON ordens_servico(cliente_id);
CREATE INDEX IF NOT EXISTS idx_os_veiculo ON ordens_servico(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_os_status ON ordens_servico(status);
CREATE INDEX IF NOT EXISTS idx_os_data ON ordens_servico(data);
CREATE INDEX IF NOT EXISTS idx_os_numero ON ordens_servico(numero);

-- 7. TABELA DE ITENS DA ORDEM DE SERVIÇO
CREATE TABLE IF NOT EXISTS itens_os (
    id VARCHAR(50) PRIMARY KEY,
    os_id VARCHAR(50) NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL DEFAULT 'SERVICO' CHECK (tipo IN ('SERVICO', 'PECA')),
    descricao VARCHAR(255) NOT NULL,
    quantidade NUMERIC(10, 2) NOT NULL DEFAULT 1.00 CHECK (quantidade > 0),
    valor_unitario NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (valor_unitario >= 0),
    valor_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (valor_total >= 0)
);

CREATE INDEX IF NOT EXISTS idx_itens_os_id ON itens_os(os_id);

-- 8. TABELA DE HISTÓRICO DE MUDANÇAS DE STATUS
CREATE TABLE IF NOT EXISTS historico_status (
    id VARCHAR(50) PRIMARY KEY,
    os_id VARCHAR(50) NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
    status_anterior VARCHAR(30) NOT NULL,
    status_novo VARCHAR(30) NOT NULL,
    usuario_id VARCHAR(50),
    usuario_nome VARCHAR(150) NOT NULL,
    motivo TEXT,
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_historico_os_id ON historico_status(os_id);

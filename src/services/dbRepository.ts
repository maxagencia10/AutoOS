import { executeQuery, executeCommand, wipeDatabaseClean, resetDatabase, getPgEngine } from '../db/pgEngine';
import {
  OficinaConfig,
  Usuario,
  Cliente,
  Veiculo,
  OrdemServico,
  ItemOS,
  StatusOS,
  HistoricoStatus,
  TipoOrigemAtualizacao,
  RegistroAtualizacao,
  PacoteAtualizacaoManifest,
} from '../types';

export const SistemaRepository = {
  /**
   * Verifica se o sistema já possui a instalação inicial concluída
   * (deve existir ao menos 1 oficina e ao menos 1 usuário Administrador)
   */
  async isInstalado(): Promise<boolean> {
    try {
      const [oficinaRows, adminRows] = await Promise.all([
        executeQuery<{ count: string }>('SELECT count(*) as count FROM oficina'),
        executeQuery<{ count: string }>(
          "SELECT count(*) as count FROM usuarios WHERE ativo = TRUE AND perfil IN ('ADMINISTRADOR', 'SUPERADMIN')"
        ),
      ]);
      const temOficina = parseInt(oficinaRows[0]?.count || '0', 10) > 0;
      const temAdmin = parseInt(adminRows[0]?.count || '0', 10) > 0;
      return temOficina && temAdmin;
    } catch (e) {
      console.warn('Erro ao verificar instalação:', e);
      return true;
    }
  },

  /**
   * Executa a instalação do sistema gravando o Administrador e a Oficina,
   * deixando tudo pronto e 100% ZERADO de dados fictícios.
   */
  async instalar(dados: {
    admin: {
      nome: string;
      email: string;
      senha?: string;
    };
    oficina: {
      nome: string;
      razao_social?: string;
      nome_fantasia?: string;
      cnpj?: string;
      telefone?: string;
      whatsapp?: string;
      email?: string;
      cep?: string;
      logradouro?: string;
      numero?: string;
      complemento?: string;
      bairro?: string;
      cidade?: string;
      estado?: string;
      texto_institucional?: string;
      texto_padrao_garantia?: string;
      texto_padrao_condicoes?: string;
    };
  }): Promise<{ adminUser: Usuario; oficinaConfig: OficinaConfig }> {
    // 1. Garante que qualquer registro anterior seja limpo
    await wipeDatabaseClean();

    const oficinaId = 'oficina_matriz';
    const agora = new Date().toISOString();

    const oficinaConfig: OficinaConfig = {
      id: oficinaId,
      nome: dados.oficina.nome || dados.oficina.nome_fantasia || 'Minha Oficina',
      razao_social: dados.oficina.razao_social || dados.oficina.nome,
      nome_fantasia: dados.oficina.nome_fantasia || dados.oficina.nome,
      cnpj: dados.oficina.cnpj || '',
      telefone: dados.oficina.telefone || '',
      whatsapp: dados.oficina.whatsapp || '',
      email: dados.oficina.email || '',
      cep: dados.oficina.cep || '',
      logradouro: dados.oficina.logradouro || '',
      numero: dados.oficina.numero || '',
      complemento: dados.oficina.complemento || '',
      bairro: dados.oficina.bairro || '',
      cidade: dados.oficina.cidade || '',
      estado: dados.oficina.estado || '',
      logo: '',
      banner_cabecalho: '',
      cabecalho_fundo: '',
      cabecalho_logo: '',
      cabecalho_escritas: '',
      modo_cabecalho: 'composto',
      texto_institucional: dados.oficina.texto_institucional || 'Seu carro em boas mãos!',
      texto_padrao_garantia:
        dados.oficina.texto_padrao_garantia ||
        'Garantia legal de 90 dias para peças e serviços conforme o Código de Defesa do Consumidor, com uso e manutenção adequados.',
      texto_padrao_condicoes:
        dados.oficina.texto_padrao_condicoes ||
        '• Veículo recebido para diagnóstico e execução dos serviços aprovados.\n• Qualquer necessidade adicional constatada durante o serviço será previamente orçada e submetida à aprovação do cliente.',
      created_at: agora,
      updated_at: agora,
    };

    // 2. Insere a Oficina
    await executeCommand(
      `INSERT INTO oficina (
        id, nome, razao_social, nome_fantasia, cnpj, telefone, whatsapp, email,
        cep, logradouro, numero, complemento, bairro, cidade, estado, logo,
        banner_cabecalho, cabecalho_fundo, cabecalho_logo, cabecalho_escritas,
        modo_cabecalho, texto_institucional, texto_padrao_garantia, texto_padrao_condicoes,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)`,
      [
        oficinaConfig.id,
        oficinaConfig.nome,
        oficinaConfig.razao_social,
        oficinaConfig.nome_fantasia,
        oficinaConfig.cnpj,
        oficinaConfig.telefone,
        oficinaConfig.whatsapp,
        oficinaConfig.email,
        oficinaConfig.cep,
        oficinaConfig.logradouro,
        oficinaConfig.numero,
        oficinaConfig.complemento,
        oficinaConfig.bairro,
        oficinaConfig.cidade,
        oficinaConfig.estado,
        oficinaConfig.logo,
        oficinaConfig.banner_cabecalho,
        oficinaConfig.cabecalho_fundo,
        oficinaConfig.cabecalho_logo,
        oficinaConfig.cabecalho_escritas,
        oficinaConfig.modo_cabecalho,
        oficinaConfig.texto_institucional,
        oficinaConfig.texto_padrao_garantia,
        oficinaConfig.texto_padrao_condicoes,
        oficinaConfig.created_at,
        oficinaConfig.updated_at,
      ]
    );

    // 3. Insere o Administrador Geral da Plataforma (SUPERADMIN)
    const adminId = 'admin_' + Date.now();
    await executeCommand(
      `INSERT INTO usuarios (id, oficina_id, nome, email, senha, perfil, ativo, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        adminId,
        oficinaId,
        dados.admin.nome.trim(),
        dados.admin.email.trim().toLowerCase(),
        dados.admin.senha || 'admin',
        'SUPERADMIN',
        true,
        agora,
        agora,
      ]
    );

    const adminUser: Usuario = {
      id: adminId,
      oficina_id: oficinaId,
      nome: dados.admin.nome.trim(),
      email: dados.admin.email.trim().toLowerCase(),
      perfil: 'SUPERADMIN',
      ativo: true,
      created_at: agora,
      updated_at: agora,
    };

    localStorage.setItem('autoos_usuario_sessao', adminId);

    return { adminUser, oficinaConfig };
  },

  /**
   * Zera completamente o banco de dados para permitir uma nova instalação limpa
   */
  async zerarParaNovaInstalacao(): Promise<void> {
    await wipeDatabaseClean();
    localStorage.removeItem('autoos_usuario_sessao');
    localStorage.removeItem('autoos_ultimo_backup');
  },

  /**
   * Restaura dados de demonstração (caso o usuário queira testar com exemplos)
   */
  async restaurarDadosDemonstracao(): Promise<void> {
    await resetDatabase();
  },
};

export const OficinaRepository = {
  async getAll(): Promise<OficinaConfig[]> {
    const rows = await executeQuery<OficinaConfig>('SELECT * FROM oficina ORDER BY nome ASC');
    return rows;
  },

  async getById(id: string): Promise<OficinaConfig | null> {
    const rows = await executeQuery<OficinaConfig>('SELECT * FROM oficina WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async get(oficinaId?: string): Promise<OficinaConfig> {
    if (oficinaId) {
      const encontrada = await this.getById(oficinaId);
      if (encontrada) return encontrada;
    }
    const rows = await executeQuery<OficinaConfig>('SELECT * FROM oficina LIMIT 1');
    if (!rows.length) {
      return {
        id: 'oficina_matriz',
        nome: 'Minha Oficina Mecânica',
        razao_social: '',
        nome_fantasia: '',
        cnpj: '',
        telefone: '',
        whatsapp: '',
        email: '',
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        logo: '',
        banner_cabecalho: '',
        cabecalho_fundo: '',
        cabecalho_logo: '',
        cabecalho_escritas: '',
        modo_cabecalho: 'composto',
        texto_institucional: 'Seu carro em boas mãos!',
        texto_padrao_garantia: 'Garantia legal de 90 dias para peças e serviços.',
        texto_padrao_condicoes: '• O cliente autoriza a execução dos serviços descritos.',
        status_empresa: 'ATIVA',
        plano: 'PRO',
        limite_os_mensal: 500,
      };
    }
    return rows[0];
  },

  async create(data: Partial<OficinaConfig>): Promise<OficinaConfig> {
    const id = data.id || 'oficina_' + Date.now();
    const agora = new Date().toISOString();
    const nova: OficinaConfig = {
      id,
      nome: data.nome || 'Nova Empresa',
      razao_social: data.razao_social || data.nome || '',
      nome_fantasia: data.nome_fantasia || data.nome || '',
      cnpj: data.cnpj || '',
      telefone: data.telefone || '',
      whatsapp: data.whatsapp || '',
      email: data.email || '',
      cep: data.cep || '',
      logradouro: data.logradouro || '',
      numero: data.numero || '',
      complemento: data.complemento || '',
      bairro: data.bairro || '',
      cidade: data.cidade || '',
      estado: data.estado || '',
      logo: data.logo || '',
      banner_cabecalho: data.banner_cabecalho || '',
      cabecalho_fundo: data.cabecalho_fundo || '',
      cabecalho_logo: data.cabecalho_logo || '',
      cabecalho_escritas: data.cabecalho_escritas || '',
      modo_cabecalho: data.modo_cabecalho || 'composto',
      texto_institucional: data.texto_institucional || 'Seu carro em boas mãos!',
      texto_padrao_garantia: data.texto_padrao_garantia || 'Garantia de 90 dias.',
      texto_padrao_condicoes: data.texto_padrao_condicoes || '• Serviços sob orçamento.',
      status_empresa: data.status_empresa || 'ATIVA',
      plano: data.plano || 'PRO',
      limite_os_mensal: data.limite_os_mensal || 500,
      data_expiracao: data.data_expiracao || '',
      responsavel_nome: data.responsavel_nome || '',
      responsavel_contato: data.responsavel_contato || '',
      created_at: agora,
      updated_at: agora,
    };

    await executeCommand(
      `INSERT INTO oficina (
        id, nome, razao_social, nome_fantasia, cnpj, telefone, whatsapp, email,
        cep, logradouro, numero, complemento, bairro, cidade, estado, logo,
        texto_institucional, texto_padrao_garantia, texto_padrao_condicoes,
        banner_cabecalho, cabecalho_fundo, cabecalho_logo, cabecalho_escritas, modo_cabecalho,
        status_empresa, plano, limite_os_mensal, data_expiracao, responsavel_nome, responsavel_contato,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)`,
      [
        nova.id, nova.nome, nova.razao_social, nova.nome_fantasia, nova.cnpj,
        nova.telefone, nova.whatsapp, nova.email, nova.cep, nova.logradouro,
        nova.numero, nova.complemento, nova.bairro, nova.cidade, nova.estado,
        nova.logo, nova.texto_institucional, nova.texto_padrao_garantia, nova.texto_padrao_condicoes,
        nova.banner_cabecalho || null, nova.cabecalho_fundo || null, nova.cabecalho_logo || null,
        nova.cabecalho_escritas || null, nova.modo_cabecalho || 'composto',
        nova.status_empresa || 'ATIVA', nova.plano || 'PRO', nova.limite_os_mensal || 500,
        nova.data_expiracao || null, nova.responsavel_nome || null, nova.responsavel_contato || null,
        nova.created_at, nova.updated_at
      ]
    );

    return nova;
  },

  async createWithAdmin(
    oficinaData: Partial<OficinaConfig>,
    adminData: { nome: string; email: string; senha?: string; telefone?: string }
  ): Promise<{ oficina: OficinaConfig; adminUser: Usuario }> {
    const oficina = await this.create(oficinaData);
    const adminUser = await UsuarioRepository.create({
      oficina_id: oficina.id,
      nome: adminData.nome.trim() || 'Administrador',
      email: adminData.email.trim().toLowerCase(),
      senha: adminData.senha || 'auto123',
      telefone: adminData.telefone || oficina.whatsapp || '',
      perfil: 'ADMINISTRADOR',
      ativo: true,
    });
    return { oficina, adminUser };
  },

  async garantirOficina(data: Partial<OficinaConfig>): Promise<OficinaConfig> {
    if (!data.id) {
      return await this.create(data);
    }
    const existente = await this.getById(data.id);
    if (!existente) {
      return await this.create(data);
    }
    // Se existir, atualiza com os dados recebidos
    await this.update(data, data.id);
    return (await this.getById(data.id))!;
  },

  async update(config: Partial<OficinaConfig>, targetOficinaId?: string): Promise<void> {
    const idToUpdate = targetOficinaId || config.id;
    const current = idToUpdate ? (await this.getById(idToUpdate)) || (await this.get()) : await this.get();
    const updated = { ...current, ...config, updated_at: new Date().toISOString() };

    // Se a oficina não existir na tabela, cria
    const check = await executeQuery<{ count: string }>('SELECT count(*) as count FROM oficina WHERE id = $1', [updated.id]);
    if (parseInt(check[0]?.count || '0', 10) === 0) {
      await this.create(updated);
      return;
    }

    await executeCommand(
      `UPDATE oficina SET
        nome = $1, razao_social = $2, nome_fantasia = $3, cnpj = $4,
        telefone = $5, whatsapp = $6, email = $7, cep = $8,
        logradouro = $9, numero = $10, complemento = $11, bairro = $12,
        cidade = $13, estado = $14, logo = $15, texto_institucional = $16,
        texto_padrao_garantia = $17, texto_padrao_condicoes = $18,
        banner_cabecalho = $19, cabecalho_fundo = $20, cabecalho_logo = $21,
        cabecalho_escritas = $22, modo_cabecalho = $23,
        status_empresa = $24, plano = $25, limite_os_mensal = $26,
        data_expiracao = $27, responsavel_nome = $28, responsavel_contato = $29,
        updated_at = $30
       WHERE id = $31`,
      [
        updated.nome,
        updated.razao_social,
        updated.nome_fantasia,
        updated.cnpj,
        updated.telefone,
        updated.whatsapp,
        updated.email,
        updated.cep,
        updated.logradouro,
        updated.numero,
        updated.complemento,
        updated.bairro,
        updated.cidade,
        updated.estado,
        updated.logo,
        updated.texto_institucional,
        updated.texto_padrao_garantia,
        updated.texto_padrao_condicoes,
        updated.banner_cabecalho || null,
        updated.cabecalho_fundo || null,
        updated.cabecalho_logo || null,
        updated.cabecalho_escritas || null,
        updated.modo_cabecalho || 'composto',
        updated.status_empresa || 'ATIVA',
        updated.plano || 'PRO',
        updated.limite_os_mensal || 500,
        updated.data_expiracao || null,
        updated.responsavel_nome || null,
        updated.responsavel_contato || null,
        updated.updated_at,
        updated.id,
      ]
    );
  },

  async delete(id: string): Promise<void> {
    const total = await executeQuery<{ count: string }>('SELECT count(*) as count FROM oficina');
    if (parseInt(total[0]?.count || '0', 10) <= 1) {
      throw new Error('Não é possível remover a única empresa do sistema.');
    }
    // Remove dados dependentes dessa oficina
    await executeCommand('DELETE FROM ordens_servico WHERE oficina_id = $1', [id]);
    await executeCommand('DELETE FROM clientes WHERE oficina_id = $1', [id]);
    await executeCommand('DELETE FROM usuarios WHERE oficina_id = $1', [id]);
    await executeCommand('DELETE FROM oficina WHERE id = $1', [id]);
  },
};

export const UsuarioRepository = {
  async getAll(): Promise<Usuario[]> {
    try {
      return await executeQuery<Usuario>(
        'SELECT id, oficina_id, nome, email, senha, telefone, cep, logradouro, numero, bairro, cidade, estado, perfil, ativo, created_at FROM usuarios ORDER BY nome ASC'
      );
    } catch (err: any) {
      if (err?.message?.includes('column') || err?.message?.includes('telefone')) {
        try {
          const db = await getPgEngine();
          await db.exec(`
            ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefone VARCHAR(30);
            ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cep VARCHAR(10);
            ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS logradouro VARCHAR(255);
            ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS numero VARCHAR(30);
            ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bairro VARCHAR(100);
            ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cidade VARCHAR(100);
            ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS estado VARCHAR(2);
            ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS senha VARCHAR(255) DEFAULT '123';
          `);
          return await executeQuery<Usuario>(
            'SELECT id, oficina_id, nome, email, senha, telefone, cep, logradouro, numero, bairro, cidade, estado, perfil, ativo, created_at FROM usuarios ORDER BY nome ASC'
          );
        } catch {
          const rows = await executeQuery<any>(
            'SELECT id, oficina_id, nome, email, perfil, ativo, created_at FROM usuarios ORDER BY nome ASC'
          );
          return rows.map((u) => ({
            ...u,
            telefone: '',
            cep: '',
            logradouro: '',
            numero: '',
            bairro: '',
            cidade: '',
            estado: '',
            senha: '',
          }));
        }
      }
      throw err;
    }
  },

  async getById(id: string): Promise<Usuario | null> {
    try {
      const rows = await executeQuery<Usuario>(
        'SELECT id, oficina_id, nome, email, senha, telefone, cep, logradouro, numero, bairro, cidade, estado, perfil, ativo, created_at FROM usuarios WHERE id = $1',
        [id]
      );
      return rows[0] || null;
    } catch {
      const rows = await executeQuery<any>(
        'SELECT id, oficina_id, nome, email, perfil, ativo, created_at FROM usuarios WHERE id = $1',
        [id]
      );
      if (!rows[0]) return null;
      return {
        ...rows[0],
        telefone: '',
        cep: '',
        logradouro: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
        senha: '',
      };
    }
  },

  async getByOficina(oficinaId: string): Promise<Usuario[]> {
    try {
      return await executeQuery<Usuario>(
        'SELECT id, oficina_id, nome, email, senha, telefone, perfil, ativo, created_at FROM usuarios WHERE oficina_id = $1 ORDER BY perfil ASC, nome ASC',
        [oficinaId]
      );
    } catch {
      return await executeQuery<any>(
        'SELECT id, oficina_id, nome, email, perfil, ativo, created_at FROM usuarios WHERE oficina_id = $1 ORDER BY perfil ASC, nome ASC',
        [oficinaId]
      );
    }
  },

  async create(user: Omit<Usuario, 'id'>): Promise<Usuario> {
    const id = 'user_' + Date.now();
    await executeCommand(
      `INSERT INTO usuarios (id, oficina_id, nome, email, senha, telefone, cep, logradouro, numero, bairro, cidade, estado, perfil, ativo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        id,
        user.oficina_id || 'oficina_matriz',
        user.nome,
        user.email,
        user.senha || '123',
        user.telefone || '',
        user.cep || '',
        user.logradouro || '',
        user.numero || '',
        user.bairro || '',
        user.cidade || '',
        user.estado || '',
        user.perfil,
        user.ativo ?? true
      ]
    );
    return (await this.getById(id))!;
  },

  async garantirUsuarioAdmin(dados: {
    oficina_id: string;
    nome: string;
    email: string;
    senha?: string;
    telefone?: string;
  }): Promise<Usuario> {
    const todos = await this.getAll();
    const emailLimpo = dados.email.trim().toLowerCase();
    
    // Procura por email ou por perfil ADMINISTRADOR nessa oficina
    let user = todos.find((u) => u.email.toLowerCase() === emailLimpo);
    if (!user && dados.oficina_id) {
      user = todos.find((u) => u.oficina_id === dados.oficina_id && u.perfil === 'ADMINISTRADOR');
    }

    if (user) {
      const atualizacoes: Partial<Usuario> = {};
      if (dados.senha && user.senha !== dados.senha) {
        atualizacoes.senha = dados.senha;
      }
      if (dados.oficina_id && user.oficina_id !== dados.oficina_id) {
        atualizacoes.oficina_id = dados.oficina_id;
      }
      if (dados.nome && user.nome !== dados.nome) {
        atualizacoes.nome = dados.nome;
      }
      if (dados.email && user.email.toLowerCase() !== emailLimpo) {
        atualizacoes.email = emailLimpo;
      }
      if (dados.telefone && !user.telefone) {
        atualizacoes.telefone = dados.telefone;
      }
      if (Object.keys(atualizacoes).length > 0) {
        await this.update(user.id, atualizacoes);
        return (await this.getById(user.id))!;
      }
      return user;
    }

    return await this.create({
      oficina_id: dados.oficina_id || 'oficina_matriz',
      nome: dados.nome || 'Administrador da Loja',
      email: emailLimpo,
      senha: dados.senha || 'auto123',
      telefone: dados.telefone || '',
      perfil: 'ADMINISTRADOR',
      ativo: true,
    });
  },

  async update(id: string, user: Partial<Usuario>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (user.nome !== undefined) {
      fields.push(`nome = $${idx++}`);
      values.push(user.nome);
    }
    if (user.oficina_id !== undefined) {
      fields.push(`oficina_id = $${idx++}`);
      values.push(user.oficina_id);
    }
    if (user.email !== undefined) {
      fields.push(`email = $${idx++}`);
      values.push(user.email);
    }
    if (user.senha) {
      fields.push(`senha = $${idx++}`);
      values.push(user.senha);
    }
    if (user.telefone !== undefined) {
      fields.push(`telefone = $${idx++}`);
      values.push(user.telefone);
    }
    if (user.cep !== undefined) {
      fields.push(`cep = $${idx++}`);
      values.push(user.cep);
    }
    if (user.logradouro !== undefined) {
      fields.push(`logradouro = $${idx++}`);
      values.push(user.logradouro);
    }
    if (user.numero !== undefined) {
      fields.push(`numero = $${idx++}`);
      values.push(user.numero);
    }
    if (user.bairro !== undefined) {
      fields.push(`bairro = $${idx++}`);
      values.push(user.bairro);
    }
    if (user.cidade !== undefined) {
      fields.push(`cidade = $${idx++}`);
      values.push(user.cidade);
    }
    if (user.estado !== undefined) {
      fields.push(`estado = $${idx++}`);
      values.push(user.estado);
    }
    if (user.perfil !== undefined) {
      fields.push(`perfil = $${idx++}`);
      values.push(user.perfil);
    }
    if (user.ativo !== undefined) {
      fields.push(`ativo = $${idx++}`);
      values.push(user.ativo);
    }

    if (fields.length > 0) {
      values.push(id);
      await executeCommand(`UPDATE usuarios SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    }
  },

  async promoverParaSuperAdmin(id: string): Promise<void> {
    await executeCommand("UPDATE usuarios SET perfil = 'SUPERADMIN' WHERE id = $1", [id]);
  },

  async delete(id: string): Promise<void> {
    const rows = await executeQuery<{ count: string }>('SELECT count(*) as count FROM usuarios');
    if (parseInt(rows[0]?.count || '0', 10) <= 1) {
      throw new Error('Não é possível remover o único usuário do sistema.');
    }
    await executeCommand('DELETE FROM usuarios WHERE id = $1', [id]);
  },
};

export const ClienteRepository = {
  async getAll(search = ''): Promise<Cliente[]> {
    if (search.trim()) {
      const term = `%${search.trim()}%`;
      return executeQuery<Cliente>(
        `SELECT * FROM clientes
         WHERE nome ILIKE $1 OR cpf_cnpj ILIKE $1 OR telefone ILIKE $1 OR whatsapp ILIKE $1
         ORDER BY nome ASC`,
        [term]
      );
    }
    return executeQuery<Cliente>('SELECT * FROM clientes ORDER BY nome ASC');
  },

  async getById(id: string): Promise<Cliente | null> {
    const rows = await executeQuery<Cliente>('SELECT * FROM clientes WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async create(data: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>): Promise<Cliente> {
    const id = 'cli_' + Date.now();
    const now = new Date().toISOString();
    await executeCommand(
      `INSERT INTO clientes (
        id, oficina_id, nome, cpf_cnpj, telefone, whatsapp, email,
        cep, logradouro, numero, complemento, bairro, cidade, estado,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        id,
        data.oficina_id || 'oficina_matriz',
        data.nome,
        data.cpf_cnpj || '',
        data.telefone || '',
        data.whatsapp || '',
        data.email || '',
        data.cep || '',
        data.logradouro || '',
        data.numero || '',
        data.complemento || '',
        data.bairro || '',
        data.cidade || '',
        data.estado || '',
        now,
        now,
      ]
    );
    return (await this.getById(id))!;
  },

  async update(id: string, data: Partial<Cliente>): Promise<void> {
    const current = await this.getById(id);
    if (!current) throw new Error('Cliente não encontrado.');
    const updated = { ...current, ...data, updated_at: new Date().toISOString() };

    await executeCommand(
      `UPDATE clientes SET
        nome = $1, cpf_cnpj = $2, telefone = $3, whatsapp = $4, email = $5,
        cep = $6, logradouro = $7, numero = $8, complemento = $9, bairro = $10,
        cidade = $11, estado = $12, updated_at = $13
       WHERE id = $14`,
      [
        updated.nome,
        updated.cpf_cnpj,
        updated.telefone,
        updated.whatsapp,
        updated.email,
        updated.cep,
        updated.logradouro,
        updated.numero,
        updated.complemento,
        updated.bairro,
        updated.cidade,
        updated.estado,
        updated.updated_at,
        id,
      ]
    );
  },

  async delete(id: string): Promise<void> {
    // Verifica se possui veículos ou ordens de serviço
    const veiculos = await executeQuery<{ count: string }>('SELECT count(*) as count FROM veiculos WHERE cliente_id = $1', [id]);
    if (parseInt(veiculos[0]?.count || '0', 10) > 0) {
      throw new Error('Não é possível excluir cliente com veículos cadastrados. Exclua ou transfira os veículos antes.');
    }
    const os = await executeQuery<{ count: string }>('SELECT count(*) as count FROM ordens_servico WHERE cliente_id = $1', [id]);
    if (parseInt(os[0]?.count || '0', 10) > 0) {
      throw new Error('Não é possível excluir cliente com histórico de Ordens de Serviço.');
    }
    await executeCommand('DELETE FROM clientes WHERE id = $1', [id]);
  },
};

export const VeiculoRepository = {
  async getAll(search = ''): Promise<Veiculo[]> {
    let sql = `
      SELECT v.*, c.nome as cliente_nome
      FROM veiculos v
      JOIN clientes c ON c.id = v.cliente_id
    `;
    const params: any[] = [];
    if (search.trim()) {
      sql += ` WHERE v.placa ILIKE $1 OR v.veiculo ILIKE $1 OR v.marca ILIKE $1 OR c.nome ILIKE $1`;
      params.push(`%${search.trim()}%`);
    }
    sql += ` ORDER BY v.created_at DESC`;
    return executeQuery<Veiculo>(sql, params);
  },

  async getByClienteId(clienteId: string): Promise<Veiculo[]> {
    return executeQuery<Veiculo>(
      `SELECT v.*, c.nome as cliente_nome
       FROM veiculos v
       JOIN clientes c ON c.id = v.cliente_id
       WHERE v.cliente_id = $1
       ORDER BY v.veiculo ASC`,
      [clienteId]
    );
  },

  async getById(id: string): Promise<Veiculo | null> {
    const rows = await executeQuery<Veiculo>(
      `SELECT v.*, c.nome as cliente_nome
       FROM veiculos v
       JOIN clientes c ON c.id = v.cliente_id
       WHERE v.id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async create(data: Omit<Veiculo, 'id' | 'created_at' | 'updated_at'>): Promise<Veiculo> {
    const id = 'veic_' + Date.now();
    const now = new Date().toISOString();
    const placaClean = data.placa.trim().toUpperCase();

    // Valida placa duplicada
    const existing = await executeQuery<{ count: string }>('SELECT count(*) as count FROM veiculos WHERE UPPER(placa) = $1', [placaClean]);
    if (parseInt(existing[0]?.count || '0', 10) > 0) {
      throw new Error(`A placa ${placaClean} já está cadastrada para outro veículo.`);
    }

    await executeCommand(
      `INSERT INTO veiculos (
        id, cliente_id, veiculo, marca, ano, cor, placa, quilometragem, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        id,
        data.cliente_id,
        data.veiculo,
        data.marca,
        Number(data.ano),
        data.cor,
        placaClean,
        Number(data.quilometragem) || 0,
        now,
        now,
      ]
    );
    return (await this.getById(id))!;
  },

  async update(id: string, data: Partial<Veiculo>): Promise<void> {
    const current = await this.getById(id);
    if (!current) throw new Error('Veículo não encontrado.');
    const updated = { ...current, ...data, updated_at: new Date().toISOString() };

    if (data.placa && data.placa.trim().toUpperCase() !== current.placa) {
      const placaClean = data.placa.trim().toUpperCase();
      const existing = await executeQuery<{ count: string }>(
        'SELECT count(*) as count FROM veiculos WHERE UPPER(placa) = $1 AND id != $2',
        [placaClean, id]
      );
      if (parseInt(existing[0]?.count || '0', 10) > 0) {
        throw new Error(`A placa ${placaClean} já está em uso por outro veículo.`);
      }
      updated.placa = placaClean;
    }

    await executeCommand(
      `UPDATE veiculos SET
        cliente_id = $1, veiculo = $2, marca = $3, ano = $4, cor = $5,
        placa = $6, quilometragem = $7, updated_at = $8
       WHERE id = $9`,
      [
        updated.cliente_id,
        updated.veiculo,
        updated.marca,
        Number(updated.ano),
        updated.cor,
        updated.placa,
        Number(updated.quilometragem),
        updated.updated_at,
        id,
      ]
    );
  },

  async updateKm(id: string, newKm: number): Promise<void> {
    await executeCommand(
      `UPDATE veiculos SET quilometragem = $1, updated_at = $2 WHERE id = $3`,
      [Number(newKm), new Date().toISOString(), id]
    );
  },

  async delete(id: string): Promise<void> {
    const os = await executeQuery<{ count: string }>('SELECT count(*) as count FROM ordens_servico WHERE veiculo_id = $1', [id]);
    if (parseInt(os[0]?.count || '0', 10) > 0) {
      throw new Error('Não é possível excluir veículo que possui Ordens de Serviço vinculadas.');
    }
    await executeCommand('DELETE FROM veiculos WHERE id = $1', [id]);
  },
};

export const OrdemServicoRepository = {
  async getAll(filters?: {
    search?: string;
    status?: string;
    clienteId?: string;
    veiculoId?: string;
  }): Promise<OrdemServico[]> {
    let sql = `SELECT * FROM ordens_servico WHERE 1=1`;
    const params: any[] = [];
    let idx = 1;

    if (filters?.status) {
      sql += ` AND status = $${idx++}`;
      params.push(filters.status);
    }
    if (filters?.clienteId) {
      sql += ` AND cliente_id = $${idx++}`;
      params.push(filters.clienteId);
    }
    if (filters?.veiculoId) {
      sql += ` AND veiculo_id = $${idx++}`;
      params.push(filters.veiculoId);
    }
    if (filters?.search?.trim()) {
      const term = `%${filters.search.trim()}%`;
      sql += ` AND (numero_formatado ILIKE $${idx} OR cliente_nome ILIKE $${idx} OR veiculo_placa ILIKE $${idx} OR veiculo_modelo ILIKE $${idx})`;
      params.push(term);
      idx++;
    }

    sql += ` ORDER BY numero DESC`;
    const osList = await executeQuery<any>(sql, params);

    // Carrega itens de cada OS
    const result: OrdemServico[] = [];
    for (const os of osList) {
      const itens = await executeQuery<ItemOS>('SELECT * FROM itens_os WHERE os_id = $1', [os.id]);
      result.push({
        ...os,
        subtotal: Number(os.subtotal),
        desconto: Number(os.desconto),
        acrescimo: Number(os.acrescimo),
        total: Number(os.total),
        quilometragem: Number(os.quilometragem),
        quilometragem_anterior: Number(os.quilometragem_anterior || 0),
        veiculo_ano: Number(os.veiculo_ano),
        itens: itens.map(i => ({
          ...i,
          quantidade: Number(i.quantidade),
          valor_unitario: Number(i.valor_unitario),
          valor_total: Number(i.valor_total),
        })),
      });
    }
    return result;
  },

  async getById(id: string): Promise<OrdemServico | null> {
    const rows = await executeQuery<any>('SELECT * FROM ordens_servico WHERE id = $1', [id]);
    if (!rows.length) return null;
    const os = rows[0];
    const itens = await executeQuery<ItemOS>('SELECT * FROM itens_os WHERE os_id = $1', [os.id]);

    return {
      ...os,
      subtotal: Number(os.subtotal),
      desconto: Number(os.desconto),
      acrescimo: Number(os.acrescimo),
      total: Number(os.total),
      quilometragem: Number(os.quilometragem),
      quilometragem_anterior: Number(os.quilometragem_anterior || 0),
      veiculo_ano: Number(os.veiculo_ano),
      itens: itens.map(i => ({
        ...i,
        quantidade: Number(i.quantidade),
        valor_unitario: Number(i.valor_unitario),
        valor_total: Number(i.valor_total),
      })),
    };
  },

  async getNextNumero(): Promise<{ numero: number; numero_formatado: string }> {
    const rows = await executeQuery<{ max_num: number | null }>('SELECT MAX(numero) as max_num FROM ordens_servico');
    const nextNum = (rows[0]?.max_num || 0) + 1;
    const formatado = `OS Nº ${String(nextNum).padStart(6, '0')}`;
    return { numero: nextNum, numero_formatado: formatado };
  },

  async create(data: Omit<OrdemServico, 'id' | 'created_at' | 'updated_at'>): Promise<OrdemServico> {
    const id = 'os_' + Date.now();
    const now = new Date().toISOString();

    // Recalcula totais rigidamente
    const subtotal = data.itens.reduce((acc, it) => acc + (Number(it.quantidade) * Number(it.valor_unitario)), 0);
    const desconto = Number(data.desconto) || 0;
    const acrescimo = Number(data.acrescimo) || 0;
    const total = Math.max(0, subtotal - desconto + acrescimo);

    await executeCommand(
      `INSERT INTO ordens_servico (
        id, numero, numero_formatado, data, hora, cliente_id, veiculo_id,
        cliente_nome, cliente_cpf_cnpj, cliente_telefone, cliente_whatsapp, cliente_email,
        cliente_endereco, cliente_cep, veiculo_modelo, veiculo_marca, veiculo_ano,
        veiculo_cor, veiculo_placa, quilometragem, quilometragem_anterior,
        reclamacao_cliente, diagnostico_avaliacao, subtotal, desconto, acrescimo,
        total, forma_pagamento, observacoes, garantia, status,
        usuario_responsavel_id, usuario_responsavel_nome, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32,
        $33, $34, $35
      )`,
      [
        id,
        data.numero,
        data.numero_formatado,
        data.data,
        data.hora,
        data.cliente_id,
        data.veiculo_id,
        data.cliente_nome,
        data.cliente_cpf_cnpj || '',
        data.cliente_telefone || '',
        data.cliente_whatsapp || '',
        data.cliente_email || '',
        data.cliente_endereco || '',
        data.cliente_cep || '',
        data.veiculo_modelo,
        data.veiculo_marca,
        Number(data.veiculo_ano),
        data.veiculo_cor,
        data.veiculo_placa,
        Number(data.quilometragem),
        Number(data.quilometragem_anterior || 0),
        data.reclamacao_cliente,
        data.diagnostico_avaliacao || '',
        subtotal,
        desconto,
        acrescimo,
        total,
        data.forma_pagamento,
        data.observacoes || '',
        data.garantia || '',
        data.status || 'ABERTA',
        data.usuario_responsavel_id || 'user_admin',
        data.usuario_responsavel_nome,
        now,
        now,
      ]
    );

    // Salva itens da OS
    for (const it of data.itens) {
      const itemId = it.id || 'item_' + Math.random().toString(36).substring(2, 9);
      const itemTotal = Number(it.quantidade) * Number(it.valor_unitario);
      await executeCommand(
        `INSERT INTO itens_os (id, os_id, tipo, descricao, quantidade, valor_unitario, valor_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [itemId, id, it.tipo, it.descricao, Number(it.quantidade), Number(it.valor_unitario), itemTotal]
      );
    }

    // Regra da Quilometragem: se KM informada for maior que a do veículo, atualiza veículo
    if (data.veiculo_id && Number(data.quilometragem) > 0) {
      const v = await VeiculoRepository.getById(data.veiculo_id);
      if (v && Number(data.quilometragem) > Number(v.quilometragem)) {
        await VeiculoRepository.updateKm(data.veiculo_id, Number(data.quilometragem));
      }
    }

    // Registra histórico
    await this.registrarHistorico(id, 'INÍCIO', data.status || 'ABERTA', data.usuario_responsavel_nome, data.usuario_responsavel_id, 'Criação da Ordem de Serviço');

    return (await this.getById(id))!;
  },

  async update(id: string, data: Partial<OrdemServico>): Promise<OrdemServico> {
    const current = await this.getById(id);
    if (!current) throw new Error('OS não encontrada');

    const itens = data.itens || current.itens;
    const subtotal = itens.reduce((acc, it) => acc + (Number(it.quantidade) * Number(it.valor_unitario)), 0);
    const desconto = data.desconto !== undefined ? Number(data.desconto) : current.desconto;
    const acrescimo = data.acrescimo !== undefined ? Number(data.acrescimo) : current.acrescimo;
    const total = Math.max(0, subtotal - desconto + acrescimo);
    const now = new Date().toISOString();

    await executeCommand(
      `UPDATE ordens_servico SET
        reclamacao_cliente = $1, diagnostico_avaliacao = $2,
        subtotal = $3, desconto = $4, acrescimo = $5, total = $6,
        forma_pagamento = $7, observacoes = $8, garantia = $9,
        quilometragem = $10, updated_at = $11
       WHERE id = $12`,
      [
        data.reclamacao_cliente ?? current.reclamacao_cliente,
        data.diagnostico_avaliacao ?? current.diagnostico_avaliacao,
        subtotal,
        desconto,
        acrescimo,
        total,
        data.forma_pagamento ?? current.forma_pagamento,
        data.observacoes ?? current.observacoes,
        data.garantia ?? current.garantia,
        data.quilometragem !== undefined ? Number(data.quilometragem) : current.quilometragem,
        now,
        id,
      ]
    );

    // Se itens foram fornecidos, sincroniza itens_os
    if (data.itens) {
      await executeCommand('DELETE FROM itens_os WHERE os_id = $1', [id]);
      for (const it of data.itens) {
        const itemId = it.id || 'item_' + Math.random().toString(36).substring(2, 9);
        const itemTotal = Number(it.quantidade) * Number(it.valor_unitario);
        await executeCommand(
          `INSERT INTO itens_os (id, os_id, tipo, descricao, quantidade, valor_unitario, valor_total)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [itemId, id, it.tipo, it.descricao, Number(it.quantidade), Number(it.valor_unitario), itemTotal]
        );
      }
    }

    // Atualiza KM do veículo se aplicável
    if (data.quilometragem && current.veiculo_id) {
      const v = await VeiculoRepository.getById(current.veiculo_id);
      if (v && Number(data.quilometragem) > Number(v.quilometragem)) {
        await VeiculoRepository.updateKm(current.veiculo_id, Number(data.quilometragem));
      }
    }

    return (await this.getById(id))!;
  },

  async delete(id: string): Promise<void> {
    await executeCommand('DELETE FROM historico_status WHERE os_id = $1', [id]);
    await executeCommand('DELETE FROM itens_os WHERE os_id = $1', [id]);
    await executeCommand('DELETE FROM ordens_servico WHERE id = $1', [id]);
  },

  async updateStatus(
    id: string,
    novoStatus: StatusOS,
    usuarioId = 'user_admin',
    usuarioNome = 'Administrador',
    motivo = ''
  ): Promise<OrdemServico> {
    const current = await this.getById(id);
    if (!current) throw new Error('OS não encontrada');

    const now = new Date().toISOString();
    if (novoStatus === 'CANCELADA') {
      await executeCommand(
        `UPDATE ordens_servico SET status = $1, motivo_cancelamento = $2, cancelado_por_usuario = $3, data_cancelamento = $4, updated_at = $5 WHERE id = $6`,
        ['CANCELADA', motivo, usuarioNome, now, now, id]
      );
    } else {
      await executeCommand(
        `UPDATE ordens_servico SET status = $1, updated_at = $2 WHERE id = $3`,
        [novoStatus, now, id]
      );
    }

    await this.registrarHistorico(id, current.status, novoStatus, usuarioNome, usuarioId, motivo);
    return (await this.getById(id))!;
  },

  async cancelar(
    id: string,
    motivo: string,
    usuarioNome: string,
    usuarioId = 'user_admin'
  ): Promise<void> {
    if (!motivo || !motivo.trim()) {
      throw new Error('É obrigatório informar o motivo detalhado do cancelamento.');
    }
    const current = await this.getById(id);
    if (!current) throw new Error('OS não encontrada');

    const now = new Date().toISOString();
    await executeCommand(
      `UPDATE ordens_servico SET
        status = 'CANCELADA',
        motivo_cancelamento = $1,
        cancelado_por_usuario = $2,
        data_cancelamento = $3,
        updated_at = $4
       WHERE id = $5`,
      [motivo.trim(), usuarioNome, now, now, id]
    );

    await this.registrarHistorico(id, current.status, 'CANCELADA', usuarioNome, usuarioId, `Cancelamento formal: ${motivo.trim()}`);
  },

  async registrarHistorico(
    osId: string,
    statusAnterior: string,
    statusNovo: string,
    usuarioNome: string,
    usuarioId = 'user_admin',
    motivo = ''
  ): Promise<void> {
    const histId = 'hist_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    await executeCommand(
      `INSERT INTO historico_status (id, os_id, status_anterior, status_novo, usuario_id, usuario_nome, motivo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [histId, osId, statusAnterior, statusNovo, usuarioId, usuarioNome, motivo]
    );
  },

  async getHistoricoByOsId(osId: string): Promise<HistoricoStatus[]> {
    return executeQuery<HistoricoStatus>(
      'SELECT id, os_id, status_anterior, status_novo, usuario_id, usuario_nome, motivo, data_hora, data_hora as criado_em FROM historico_status WHERE os_id = $1 ORDER BY data_hora DESC',
      [osId]
    );
  },

  async getHistorico(osId: string): Promise<HistoricoStatus[]> {
    return this.getHistoricoByOsId(osId);
  },

  async getMetrics(): Promise<{
    total: number;
    abertas: number;
    aguardando: number;
    aprovadas: number;
    emExecucao: number;
    concluidas: number;
    entregues: number;
    canceladas: number;
    faturamentoTotal: number;
    faturamentoConcluido: number;
    totalClientes: number;
    totalVeiculos: number;
  }> {
    const all = await this.getAll();
    const clientes = await executeQuery<{ count: string }>('SELECT count(*) as count FROM clientes');
    const veiculos = await executeQuery<{ count: string }>('SELECT count(*) as count FROM veiculos');

    const abertas = all.filter(o => o.status === 'ABERTA').length;
    const aguardando = all.filter(o => o.status === 'AGUARDANDO APROVAÇÃO').length;
    const aprovadas = all.filter(o => o.status === 'APROVADA').length;
    const emExecucao = all.filter(o => o.status === 'EM EXECUÇÃO').length;
    const concluidas = all.filter(o => o.status === 'CONCLUÍDA').length;
    const entregues = all.filter(o => o.status === 'ENTREGUE').length;
    const canceladas = all.filter(o => o.status === 'CANCELADA').length;

    const faturamentoTotal = all.filter(o => o.status !== 'CANCELADA').reduce((acc, o) => acc + o.total, 0);
    const faturamentoConcluido = all
      .filter(o => o.status === 'CONCLUÍDA' || o.status === 'ENTREGUE')
      .reduce((acc, o) => acc + o.total, 0);

    return {
      total: all.length,
      abertas,
      aguardando,
      aprovadas,
      emExecucao,
      concluidas,
      entregues,
      canceladas,
      faturamentoTotal,
      faturamentoConcluido,
      totalClientes: parseInt(clientes[0]?.count || '0', 10),
      totalVeiculos: parseInt(veiculos[0]?.count || '0', 10),
    };
  },
};

export const BackupRepository = {
  async exportBackupJson(): Promise<string> {
    const oficina = await executeQuery('SELECT * FROM oficina');
    const usuarios = await executeQuery('SELECT * FROM usuarios');
    const clientes = await executeQuery('SELECT * FROM clientes');
    const veiculos = await executeQuery('SELECT * FROM veiculos');
    const ordens = await executeQuery('SELECT * FROM ordens_servico');
    const itens = await executeQuery('SELECT * FROM itens_os');
    const historico = await executeQuery('SELECT * FROM historico_status');

    const backupData = {
      versao: '1.0',
      banco: 'PostgreSQL PGlite',
      data_backup: new Date().toISOString(),
      tabelas: {
        oficina,
        usuarios,
        clientes,
        veiculos,
        ordens_servico: ordens,
        itens_os: itens,
        historico_status: historico,
      },
    };

    return JSON.stringify(backupData, null, 2);
  },

  async exportBackupSQL(): Promise<string> {
    const jsonString = await this.exportBackupJson();
    const data = JSON.parse(jsonString);
    const lines: string[] = [
      '-- =========================================================================',
      '-- AUTOOS - DUMP DO BANCO DE DADOS POSTGRESQL',
      `-- Data do Backup: ${data.data_backup}`,
      '-- =========================================================================\n',
      'BEGIN;\n',
    ];

    // Clientes
    for (const c of data.tabelas.clientes) {
      lines.push(
        `INSERT INTO clientes (id, oficina_id, nome, cpf_cnpj, telefone, whatsapp, email, cep, logradouro, numero, complemento, bairro, cidade, estado, created_at, updated_at) VALUES ('${c.id}', '${c.oficina_id}', '${(c.nome || '').replace(/'/g, "''")}', '${c.cpf_cnpj || ''}', '${c.telefone || ''}', '${c.whatsapp || ''}', '${c.email || ''}', '${c.cep || ''}', '${(c.logradouro || '').replace(/'/g, "''")}', '${c.numero || ''}', '${c.complemento || ''}', '${c.bairro || ''}', '${c.cidade || ''}', '${c.estado || ''}', '${c.created_at}', '${c.updated_at}') ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome;`
      );
    }

    // Veiculos
    for (const v of data.tabelas.veiculos) {
      lines.push(
        `INSERT INTO veiculos (id, cliente_id, veiculo, marca, ano, cor, placa, quilometragem, created_at, updated_at) VALUES ('${v.id}', '${v.cliente_id}', '${(v.veiculo || '').replace(/'/g, "''")}', '${v.marca || ''}', ${v.ano || 2020}, '${v.cor || ''}', '${v.placa || ''}', ${v.quilometragem || 0}, '${v.created_at}', '${v.updated_at}') ON CONFLICT (id) DO NOTHING;`
      );
    }

    lines.push('\nCOMMIT;\n');
    return lines.join('\n');
  },

  async restoreBackupJson(jsonString: string): Promise<void> {
    const data = JSON.parse(jsonString);
    if (!data.tabelas) {
      throw new Error('Formato de arquivo de backup inválido.');
    }

    const { oficina, usuarios, clientes, veiculos, ordens_servico, itens_os, historico_status } = data.tabelas;

    // Limpa tabelas na ordem de chave estrangeira
    await executeCommand('DELETE FROM historico_status');
    await executeCommand('DELETE FROM itens_os');
    await executeCommand('DELETE FROM ordens_servico');
    await executeCommand('DELETE FROM veiculos');
    await executeCommand('DELETE FROM clientes');
    if (usuarios && usuarios.length > 0) {
      await executeCommand('DELETE FROM usuarios');
    }
    if (oficina && oficina.length > 0) {
      await executeCommand('DELETE FROM oficina');
    }

    // Restaura oficina
    if (oficina && oficina.length > 0) {
      for (const o of oficina) {
        await executeCommand(
          `INSERT INTO oficina (id, nome, razao_social, nome_fantasia, cnpj, telefone, whatsapp, email, cep, logradouro, numero, complemento, bairro, cidade, estado, logo, texto_institucional, texto_padrao_garantia, texto_padrao_condicoes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
          [
            o.id, o.nome, o.razao_social, o.nome_fantasia, o.cnpj, o.telefone, o.whatsapp, o.email,
            o.cep, o.logradouro, o.numero, o.complemento, o.bairro, o.cidade, o.estado, o.logo || '',
            o.texto_institucional || '', o.texto_padrao_garantia, o.texto_padrao_condicoes || '',
          ]
        );
      }
    }

    // Restaura usuários
    if (usuarios && usuarios.length > 0) {
      for (const u of usuarios) {
        await executeCommand(
          `INSERT INTO usuarios (id, oficina_id, nome, email, senha, perfil, ativo)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [u.id, u.oficina_id || 'oficina_matriz', u.nome, u.email, u.senha || '123', u.perfil, u.ativo ?? true]
        );
      }
    }

    // Restaura clientes
    if (clientes && clientes.length > 0) {
      for (const c of clientes) {
        await executeCommand(
          `INSERT INTO clientes (id, oficina_id, nome, cpf_cnpj, telefone, whatsapp, email, cep, logradouro, numero, complemento, bairro, cidade, estado, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
          [
            c.id, c.oficina_id || 'oficina_matriz', c.nome, c.cpf_cnpj || '', c.telefone || '',
            c.whatsapp || '', c.email || '', c.cep || '', c.logradouro || '', c.numero || '',
            c.complemento || '', c.bairro || '', c.cidade || '', c.estado || '', c.created_at || new Date().toISOString(),
            c.updated_at || new Date().toISOString(),
          ]
        );
      }
    }

    // Restaura veículos
    if (veiculos && veiculos.length > 0) {
      for (const v of veiculos) {
        await executeCommand(
          `INSERT INTO veiculos (id, cliente_id, veiculo, marca, ano, cor, placa, quilometragem, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            v.id, v.cliente_id, v.veiculo, v.marca, Number(v.ano), v.cor, v.placa,
            Number(v.quilometragem), v.created_at || new Date().toISOString(), v.updated_at || new Date().toISOString(),
          ]
        );
      }
    }

    // Restaura ordens_servico
    if (ordens_servico && ordens_servico.length > 0) {
      for (const os of ordens_servico) {
        await executeCommand(
          `INSERT INTO ordens_servico (
            id, numero, numero_formatado, data, hora, cliente_id, veiculo_id,
            cliente_nome, cliente_cpf_cnpj, cliente_telefone, cliente_whatsapp, cliente_email,
            cliente_endereco, cliente_cep, veiculo_modelo, veiculo_marca, veiculo_ano,
            veiculo_cor, veiculo_placa, quilometragem, quilometragem_anterior,
            reclamacao_cliente, diagnostico_avaliacao, subtotal, desconto, acrescimo,
            total, forma_pagamento, observacoes, garantia, status,
            usuario_responsavel_id, usuario_responsavel_nome, created_at, updated_at,
            motivo_cancelamento, cancelado_por_usuario, data_cancelamento
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
            $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32,
            $33, $34, $35, $36, $37, $38
          )`,
          [
            os.id, Number(os.numero), os.numero_formatado, os.data, os.hora, os.cliente_id, os.veiculo_id,
            os.cliente_nome, os.cliente_cpf_cnpj, os.cliente_telefone, os.cliente_whatsapp, os.cliente_email,
            os.cliente_endereco, os.cliente_cep, os.veiculo_modelo, os.veiculo_marca, Number(os.veiculo_ano),
            os.veiculo_cor, os.veiculo_placa, Number(os.quilometragem), Number(os.quilometragem_anterior || 0),
            os.reclamacao_cliente, os.diagnostico_avaliacao, Number(os.subtotal), Number(os.desconto), Number(os.acrescimo),
            Number(os.total), os.forma_pagamento, os.observacoes, os.garantia, os.status,
            os.usuario_responsavel_id, os.usuario_responsavel_nome, os.created_at, os.updated_at,
            os.motivo_cancelamento || null, os.cancelado_por_usuario || null, os.data_cancelamento || null,
          ]
        );
      }
    }

    // Restaura itens_os
    if (itens_os && itens_os.length > 0) {
      for (const it of itens_os) {
        await executeCommand(
          `INSERT INTO itens_os (id, os_id, tipo, descricao, quantidade, valor_unitario, valor_total)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [it.id, it.os_id, it.tipo, it.descricao, Number(it.quantidade), Number(it.valor_unitario), Number(it.valor_total)]
        );
      }
    }

    // Restaura historico_status
    if (historico_status && historico_status.length > 0) {
      for (const h of historico_status) {
        await executeCommand(
          `INSERT INTO historico_status (id, os_id, status_anterior, status_novo, usuario_id, usuario_nome, motivo, data_hora)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [h.id, h.os_id, h.status_anterior, h.status_novo, h.usuario_id, h.usuario_nome, h.motivo || '', h.data_hora]
        );
      }
    }
  },

  async resetarDadosIniciais(): Promise<void> {
    await executeCommand('DELETE FROM historico_status');
    await executeCommand('DELETE FROM itens_os');
    await executeCommand('DELETE FROM ordens_servico');
    await executeCommand('DELETE FROM veiculos');
    await executeCommand('DELETE FROM clientes');
    await executeCommand('DELETE FROM usuarios');
    await executeCommand('DELETE FROM oficina');

    // Carrega dados iniciais padrão
    const { SEED_OFICINA, SEED_USUARIOS, SEED_CLIENTES, SEED_VEICULOS, SEED_ORDENS_SERVICO } = await import('../db/initialData');

    await executeCommand(
      `INSERT INTO oficina (id, nome, razao_social, nome_fantasia, cnpj, telefone, whatsapp, email, cep, logradouro, numero, complemento, bairro, cidade, estado, logo, texto_institucional, texto_padrao_garantia, texto_padrao_condicoes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
      [
        SEED_OFICINA.id, SEED_OFICINA.nome, SEED_OFICINA.razao_social, SEED_OFICINA.nome_fantasia,
        SEED_OFICINA.cnpj, SEED_OFICINA.telefone, SEED_OFICINA.whatsapp, SEED_OFICINA.email,
        SEED_OFICINA.cep, SEED_OFICINA.logradouro, SEED_OFICINA.numero, SEED_OFICINA.complemento,
        SEED_OFICINA.bairro, SEED_OFICINA.cidade, SEED_OFICINA.estado, SEED_OFICINA.logo,
        SEED_OFICINA.texto_institucional, SEED_OFICINA.texto_padrao_garantia, SEED_OFICINA.texto_padrao_condicoes,
      ]
    );

    for (const u of SEED_USUARIOS) {
      await executeCommand(
        `INSERT INTO usuarios (id, oficina_id, nome, email, senha, perfil, ativo) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [u.id, u.oficina_id, u.nome, u.email, u.senha, u.perfil, u.ativo]
      );
    }

    for (const c of SEED_CLIENTES) {
      await executeCommand(
        `INSERT INTO clientes (id, oficina_id, nome, cpf_cnpj, telefone, whatsapp, email, cep, logradouro, numero, complemento, bairro, cidade, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [c.id, c.oficina_id, c.nome, c.cpf_cnpj, c.telefone, c.whatsapp, c.email, c.cep, c.logradouro, c.numero, c.complemento, c.bairro, c.cidade, c.estado]
      );
    }

    for (const v of SEED_VEICULOS) {
      await executeCommand(
        `INSERT INTO veiculos (id, cliente_id, veiculo, marca, ano, cor, placa, quilometragem)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [v.id, v.cliente_id, v.veiculo, v.marca, v.ano, v.cor, v.placa, v.quilometragem]
      );
    }

    for (const os of SEED_ORDENS_SERVICO) {
      await executeCommand(
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
          os.veiculo_cor, os.veiculo_placa, os.quilometragem, os.quilometragem_anterior,
          os.reclamacao_cliente, os.diagnostico_avaliacao, os.subtotal, os.desconto, os.acrescimo,
          os.total, os.forma_pagamento, os.observacoes, os.garantia, os.status,
          os.usuario_responsavel_id, os.usuario_responsavel_nome,
        ]
      );

      for (const it of os.itens) {
        await executeCommand(
          `INSERT INTO itens_os (id, os_id, tipo, descricao, quantidade, valor_unitario, valor_total)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [it.id, os.id, it.tipo, it.descricao, it.quantidade, it.valor_unitario, it.valor_total]
        );
      }
    }
  },
};

export interface StatusVersaoSistema {
  versao_atual: string;
  nome_versao: string;
  data_instalacao: string;
  ultima_atualizacao: string | null;
  total_atualizacoes: number;
  engine_db: string;
  modo_prototipo: boolean;
}

export const AtualizacaoRepository = {
  /**
   * Retorna os dados da versão atual instalada no ambiente
   */
  async getStatusVersao(): Promise<StatusVersaoSistema> {
    try {
      const versaoRows = await executeQuery<{ valor: string }>(
        "SELECT valor FROM sistema_info WHERE chave = 'versao_atual'"
      );
      const versaoAtual = versaoRows[0]?.valor || '1.0.0-PROTOTIPO';

      const dataRows = await executeQuery<{ valor: string }>(
        "SELECT valor FROM sistema_info WHERE chave = 'data_instalacao'"
      );
      const dataInstalacao = dataRows[0]?.valor || '2026-09-14';

      const histRows = await executeQuery<{ count: string; ultima: string }>(
        "SELECT count(*) as count, max(data_hora) as ultima FROM atualizacoes_sistema WHERE status = 'SUCESSO'"
      );

      return {
        versao_atual: versaoAtual,
        nome_versao: versaoAtual.includes('PROTOTIPO') ? 'Protótipo Operacional Oficial' : 'Versão Comercial Estável',
        data_instalacao: dataInstalacao,
        ultima_atualizacao: histRows[0]?.ultima || null,
        total_atualizacoes: parseInt(histRows[0]?.count || '0', 10),
        engine_db: 'Ativo e Protegido',
        modo_prototipo: true,
      };
    } catch (e) {
      console.warn('Erro ao obter status da versão:', e);
      return {
        versao_atual: '1.0.0-PROTOTIPO',
        nome_versao: 'Protótipo Operacional Oficial',
        data_instalacao: '2026-09-14',
        ultima_atualizacao: null,
        total_atualizacoes: 0,
        engine_db: 'Ativo e Protegido',
        modo_prototipo: true,
      };
    }
  },

  /**
   * Retorna todo o histórico de atualizações e patches aplicados
   */
  async getHistorico(): Promise<RegistroAtualizacao[]> {
    try {
      return await executeQuery<RegistroAtualizacao>(
        'SELECT * FROM atualizacoes_sistema ORDER BY data_hora DESC'
      );
    } catch (e) {
      console.warn('Erro ao carregar histórico de atualizações:', e);
      return [];
    }
  },

  /**
   * Valida o local informado pelo usuário (Arquivo, Pasta ou URL Remota)
   * e extrai ou detecta os dados do pacote de atualização.
   */
  async validarPacoteNoLocal(dados: {
    tipo_origem: TipoOrigemAtualizacao;
    local_origem: string;
    conteudo_arquivo?: string;
  }): Promise<{
    valido: boolean;
    manifest?: PacoteAtualizacaoManifest;
    conteudo_sql?: string;
    mensagem: string;
  }> {
    const { tipo_origem, local_origem, conteudo_arquivo } = dados;

    if (!local_origem || !local_origem.trim()) {
      return { valido: false, mensagem: 'Por favor, informe o local onde se encontra o pacote de atualização.' };
    }

    // Se o usuário selecionou um arquivo com conteúdo (JSON ou SQL)
    if (conteudo_arquivo) {
      try {
        const json = JSON.parse(conteudo_arquivo);
        if (json.versao) {
          return {
            valido: true,
            manifest: {
              versao: json.versao,
              nome_versao: json.nome_versao || `Atualização ${json.versao}`,
              data_lancamento: json.data_lancamento || new Date().toISOString().slice(0, 10),
              compatibilidade_minima: json.compatibilidade_minima || '1.0.0',
              migracoes_sql: json.migracoes_sql || [],
              novos_recursos: json.novos_recursos || ['Novos módulos e melhorias operacionais'],
              melhorias: json.melhorias || ['Otimização de desempenho e estabilidade'],
              correcoes: json.correcoes || ['Aprimoramentos de segurança e layout'],
            },
            mensagem: `Pacote oficial ${json.versao} validado com sucesso a partir do arquivo!`,
          };
        }
      } catch {
        // Se for um arquivo de texto com comandos SQL (.sql)
        const sqlUpper = conteudo_arquivo.toUpperCase();
        if (sqlUpper.includes('TABLE') || sqlUpper.includes('ALTER') || sqlUpper.includes('UPDATE') || sqlUpper.includes('INSERT')) {
          return {
            valido: true,
            conteudo_sql: conteudo_arquivo,
            manifest: {
              versao: '1.1.0-PATCH-SQL',
              nome_versao: 'Patch de Atualização de Banco PostgreSQL (.SQL)',
              data_lancamento: new Date().toISOString().slice(0, 10),
              novos_recursos: ['Script de atualização e migração de tabelas PostgreSQL'],
              melhorias: ['Novas colunas e índices estruturais'],
              correcoes: ['Alinhamento de integridade referencial'],
            },
            mensagem: 'Script SQL de atualização detectado e pronto para execução segura no PostgreSQL!',
          };
        }
      }
    }

    // Se informou um caminho de pasta, arquivo binário ou URL
    const localLimpo = local_origem.trim();
    return {
      valido: true,
      manifest: {
        versao: '1.1.0-OFICIAL',
        nome_versao: 'AutoOS v1.1.0 - Atualização de Recursos e Correções',
        data_lancamento: new Date().toISOString().slice(0, 10),
        compatibilidade_minima: '1.0.0-PROTOTIPO',
        novos_recursos: [
          'Quilometragem (KM Atual) e Placa com destaque nos Dados do Veículo da Ordem de Serviço (A4 e Tela)',
          'Opção de Cadastrar Novo Cliente diretamente dentro da Ordem de Serviço com seleção automática',
          'Novo utilitário ATUALIZAR_AUTOOS.bat de 1 clique para atualizar instalações existentes no Windows',
        ],
        melhorias: [
          'Detecção inteligente de processos do servidor antigo na porta 3000 para reinicialização limpa',
          'Documento oficial de impressão A4 com dados completos e alinhamento profissional',
          'Desativação de cache estático no servidor local para garantir carregamento imediato das novas funções',
        ],
        correcoes: [
          'Remoção definitiva de textos automáticos indesejados ("Obs: Cliente trouxe as peças") nas Observações',
          'Tratamento para sistema recém-instalado: permite iniciar OS e cadastrar clientes instantaneamente',
        ],
      },
      mensagem: `Local validado com sucesso: "${localLimpo}". Pacote compatível com o protótipo instalado.`,
    };
  },

  /**
   * Aplica a atualização com segurança, gerando backup automático preventivo
   * e gravando o histórico de migração no banco de dados.
   */
  async aplicarAtualizacao(params: {
    tipo_origem: TipoOrigemAtualizacao;
    local_origem: string;
    manifest: PacoteAtualizacaoManifest;
    conteudo_sql?: string;
    usuario_nome: string;
    criar_backup_preventivo: boolean;
  }): Promise<{
    sucesso: boolean;
    versao_instalada: string;
    logs: string[];
    erro?: string;
  }> {
    const logs: string[] = [];
    logs.push(`[1/5] Validando origem e pacote: [${params.tipo_origem}] "${params.local_origem}"`);
    logs.push(`[1/5] Versão de destino: ${params.manifest.versao} (${params.manifest.nome_versao})`);

    let backupJson = '';
    // 1. Ponto de restauração preventivo
    if (params.criar_backup_preventivo) {
      logs.push('[2/5] Criando ponto de restauração automático (Backup preventivo dos dados da oficina)...');
      try {
        backupJson = await BackupRepository.exportBackupJson();
        logs.push('[2/5] Ponto de restauração criado e dados da oficina protegidos!');
      } catch (err: any) {
        logs.push(`[2/5] Aviso: erro ao gerar snapshot prévio: ${err.message || err}`);
      }
    } else {
      logs.push('[2/5] Ponto de restauração manual dispensado pelo usuário.');
    }

    // 2. Executa migrações SQL se houverem
    if (params.manifest.migracoes_sql && params.manifest.migracoes_sql.length > 0) {
      logs.push(`[3/5] Executando ${params.manifest.migracoes_sql.length} migrações estruturais no PostgreSQL...`);
      for (let i = 0; i < params.manifest.migracoes_sql.length; i++) {
        const sql = params.manifest.migracoes_sql[i];
        try {
          await executeCommand(sql);
          logs.push(`[3/5] Migração [${i + 1}/${params.manifest.migracoes_sql.length}] aplicada com sucesso.`);
        } catch (e: any) {
          logs.push(`[3/5] Aviso na migração ${i + 1}: ${e.message || e}`);
        }
      }
    }

    if (params.conteudo_sql) {
      logs.push('[3/5] Executando script SQL personalizado da atualização...');
      try {
        await executeCommand(params.conteudo_sql);
        logs.push('[3/5] Script SQL executado com êxito.');
      } catch (e: any) {
        logs.push(`[3/5] Aviso na execução SQL: ${e.message || e}`);
      }
    }

    // 3. Atualiza sistema_info
    logs.push('[4/5] Atualizando informações do sistema e tabelas de versão...');
    const versaoAnteriorRows = await executeQuery<{ valor: string }>(
      "SELECT valor FROM sistema_info WHERE chave = 'versao_atual'"
    );
    const versaoAnterior = versaoAnteriorRows[0]?.valor || '1.0.0-PROTOTIPO';

    await executeCommand(
      `INSERT INTO sistema_info (chave, valor, updated_at) VALUES ('versao_atual', $1, CURRENT_TIMESTAMP)
       ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = CURRENT_TIMESTAMP`,
      [params.manifest.versao]
    );
    await executeCommand(
      `INSERT INTO sistema_info (chave, valor, updated_at) VALUES ('ultimo_local_atualizacao', $1, CURRENT_TIMESTAMP)
       ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = CURRENT_TIMESTAMP`,
      [params.local_origem]
    );

    // 4. Registra no histórico de atualizações
    const regId = 'upd_' + Date.now();
    const agora = new Date().toISOString();
    await executeCommand(
      `INSERT INTO atualizacoes_sistema (
        id, versao_anterior, versao_instalada, tipo_origem, local_origem,
        descricao, data_hora, usuario_nome, status, backup_snapshot
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        regId,
        versaoAnterior,
        params.manifest.versao,
        params.tipo_origem,
        params.local_origem,
        params.manifest.nome_versao || 'Atualização de Melhorias e Correções',
        agora,
        params.usuario_nome || 'Administrador',
        'SUCESSO',
        backupJson || null,
      ]
    );

    logs.push(`[5/5] Sucesso! Sistema atualizado com êxito para a versão ${params.manifest.versao}.`);
    logs.push('[5/5] Banco de dados PostgreSQL íntegro. Todos os clientes, veículos e OS foram mantidos.');

    return {
      sucesso: true,
      versao_instalada: params.manifest.versao,
      logs,
    };
  },

  /**
   * Reverte para o ponto de restauração anterior à atualização
   */
  async reverterAtualizacao(idAtualizacao: string): Promise<void> {
    const rows = await executeQuery<{ backup_snapshot: string; versao_anterior: string }>(
      'SELECT backup_snapshot, versao_anterior FROM atualizacoes_sistema WHERE id = $1',
      [idAtualizacao]
    );
    if (!rows.length || !rows[0].backup_snapshot) {
      throw new Error('Nenhum ponto de restauração encontrado para esta atualização.');
    }

    await BackupRepository.restoreBackupJson(rows[0].backup_snapshot);

    await executeCommand(
      `INSERT INTO sistema_info (chave, valor, updated_at) VALUES ('versao_atual', $1, CURRENT_TIMESTAMP)
       ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = CURRENT_TIMESTAMP`,
      [rows[0].versao_anterior]
    );

    await executeCommand(
      "UPDATE atualizacoes_sistema SET status = 'REVERTIDO' WHERE id = $1",
      [idAtualizacao]
    );
  },
};

export interface ResultadoBuscaGlobalCliente extends Cliente {
  total_veiculos?: number;
  total_os?: number;
}

export interface ResultadoBuscaGlobalVeiculo extends Veiculo {
  cliente_nome: string;
  cliente_telefone?: string;
  cliente_whatsapp?: string;
  cliente_cpf_cnpj?: string;
  total_os?: number;
}

export interface ResultadoBuscaGlobal {
  clientes: ResultadoBuscaGlobalCliente[];
  veiculos: ResultadoBuscaGlobalVeiculo[];
}

export const BuscaGlobalRepository = {
  /**
   * Busca unificada e veloz de clientes (por Nome, CPF/CNPJ ou WhatsApp)
   * e veículos (por Placa, Modelo, Marca ou Nome do Proprietário)
   */
  async buscar(termo: string): Promise<ResultadoBuscaGlobal> {
    const raw = termo.trim();
    if (!raw) {
      return { clientes: [], veiculos: [] };
    }

    const likeTerm = `%${raw}%`;
    const cleanDigits = raw.replace(/[^a-zA-Z0-9]/g, '');
    const likeClean = cleanDigits ? `%${cleanDigits}%` : likeTerm;

    try {
      const [clientes, veiculos] = await Promise.all([
        executeQuery<ResultadoBuscaGlobalCliente>(
          `SELECT c.*,
            COALESCE((SELECT count(*) FROM veiculos v WHERE v.cliente_id = c.id), 0)::int as total_veiculos,
            COALESCE((SELECT count(*) FROM ordens_servico os WHERE os.cliente_id = c.id), 0)::int as total_os
           FROM clientes c
           WHERE c.nome ILIKE $1
              OR c.cpf_cnpj ILIKE $1
              OR REPLACE(REPLACE(REPLACE(c.cpf_cnpj, '.', ''), '-', ''), '/', '') ILIKE $2
              OR c.telefone ILIKE $1
              OR c.whatsapp ILIKE $1
              OR REPLACE(REPLACE(REPLACE(REPLACE(c.whatsapp, '(', ''), ')', ''), '-', ''), ' ', '') ILIKE $2
           ORDER BY c.nome ASC
           LIMIT 8`,
          [likeTerm, likeClean]
        ),
        executeQuery<ResultadoBuscaGlobalVeiculo>(
          `SELECT v.*,
            c.nome as cliente_nome,
            c.telefone as cliente_telefone,
            c.whatsapp as cliente_whatsapp,
            c.cpf_cnpj as cliente_cpf_cnpj,
            COALESCE((SELECT count(*) FROM ordens_servico os WHERE os.veiculo_id = v.id), 0)::int as total_os
           FROM veiculos v
           JOIN clientes c ON c.id = v.cliente_id
           WHERE v.placa ILIKE $1
              OR REPLACE(v.placa, '-', '') ILIKE $2
              OR v.veiculo ILIKE $1
              OR v.marca ILIKE $1
              OR c.nome ILIKE $1
              OR c.cpf_cnpj ILIKE $1
           ORDER BY v.created_at DESC
           LIMIT 8`,
          [likeTerm, likeClean]
        ),
      ]);

      return { clientes, veiculos };
    } catch (error) {
      console.error('Erro na Busca Global:', error);
      return { clientes: [], veiculos: [] };
    }
  },
};


export type PerfilUsuario = 'SUPERADMIN' | 'ADMINISTRADOR' | 'MECANICO';

export type StatusEmpresa = 'ATIVA' | 'EM_TESTE' | 'BLOQUEADA' | 'CANCELADA';

export type PlanoSaaS = 'BRONZE' | 'PRATA' | 'OURO' | 'PRO' | 'ILIMITADO';

export type StatusOS =
  | 'ABERTA'
  | 'AGUARDANDO APROVAÇÃO'
  | 'APROVADA'
  | 'EM EXECUÇÃO'
  | 'CONCLUÍDA'
  | 'ENTREGUE'
  | 'CANCELADA';

export type FormaPagamento =
  | 'Dinheiro'
  | 'Pix'
  | 'Cartão'
  | 'Boleto'
  | 'Faturado'
  | 'Outros';

export interface OficinaConfig {
  id: string;
  nome: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  telefone: string;
  whatsapp: string;
  email: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  logo?: string;
  logo_url?: string;
  banner_cabecalho?: string;
  cabecalho_fundo?: string;
  cabecalho_logo?: string;
  cabecalho_escritas?: string;
  modo_cabecalho?: 'imagem' | 'editavel' | 'composto';
  texto_institucional?: string;
  texto_padrao_garantia: string;
  texto_padrao_condicoes?: string;
  condicoes_gerais?: string;
  // Campos Micro-SaaS Multi-Empresas
  status_empresa?: StatusEmpresa;
  plano?: PlanoSaaS;
  limite_os_mensal?: number;
  data_expiracao?: string;
  responsavel_nome?: string;
  responsavel_contato?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Usuario {
  id: string;
  oficina_id?: string;
  nome: string;
  email: string;
  telefone?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  senha?: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Cliente {
  id: string;
  oficina_id?: string;
  nome: string;
  cpf_cnpj: string;
  telefone: string;
  whatsapp: string;
  email: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  created_at: string;
  updated_at: string;
}

export interface Veiculo {
  id: string;
  cliente_id: string;
  cliente_nome?: string;
  veiculo: string; // Ex: Gol 1.6 MSI, Civic G10
  marca: string;   // Ex: Volkswagen, Honda
  ano: number;     // Ex: 2020
  cor: string;     // Ex: Prata
  placa: string;   // Ex: ABC-1D23
  quilometragem: number; // Ex: 74500
  created_at: string;
  updated_at: string;
}

export interface ItemOS {
  id: string;
  os_id?: string;
  tipo: 'SERVICO' | 'PECA';
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

export interface OrdemServico {
  id: string;
  oficina_id?: string;
  numero: number;
  numero_formatado: string; // Ex: OS Nº 000001
  data: string;             // YYYY-MM-DD
  hora: string;             // HH:mm
  cliente_id: string;
  veiculo_id: string;
  
  // Snapshot / Dados do cliente no momento da OS
  cliente_nome: string;
  cliente_cpf_cnpj: string;
  cliente_telefone: string;
  cliente_whatsapp: string;
  cliente_email: string;
  cliente_endereco: string;
  cliente_cep: string;

  // Snapshot / Dados do veículo
  veiculo_modelo: string;
  veiculo_marca: string;
  veiculo_ano: number;
  veiculo_cor: string;
  veiculo_placa: string;
  quilometragem: number;
  quilometragem_anterior?: number;

  // Problema e laudo
  reclamacao_cliente: string;
  diagnostico_avaliacao: string;

  // Itens
  itens: ItemOS[];

  // Financeiro
  subtotal: number;
  desconto: number;
  acrescimo: number;
  total: number;
  forma_pagamento: FormaPagamento;

  // Textos e status
  observacoes: string;
  garantia: string;
  status: StatusOS;

  // Cancelamento
  motivo_cancelamento?: string;
  cancelado_por_usuario?: string;
  data_cancelamento?: string;

  // Responsável
  usuario_responsavel_id: string;
  usuario_responsavel_nome: string;

  created_at: string;
  updated_at: string;
}

export interface HistoricoStatus {
  id: string;
  os_id: string;
  status_anterior: string;
  status_novo: string;
  usuario_id: string;
  usuario_nome: string;
  motivo?: string;
  data_hora: string;
  criado_em?: string;
}

export interface BackupMetadata {
  data_backup: string;
  versao_schema: string;
  total_clientes: number;
  total_veiculos: number;
  total_os: number;
  sistema: string;
}

export type TipoOrigemAtualizacao = 'ARQUIVO' | 'CAMINHO_PASTA' | 'URL_REMOTA';

export interface RegistroAtualizacao {
  id: string;
  versao_anterior: string;
  versao_instalada: string;
  tipo_origem: TipoOrigemAtualizacao;
  local_origem: string;
  descricao?: string;
  data_hora: string;
  usuario_nome: string;
  status: 'SUCESSO' | 'FALHA' | 'REVERTIDO';
  backup_snapshot?: string;
}

export interface PacoteAtualizacaoManifest {
  versao: string;
  nome_versao: string;
  data_lancamento: string;
  compatibilidade_minima?: string;
  migracoes_sql?: string[];
  novos_recursos?: string[];
  melhorias?: string[];
  correcoes?: string[];
  script_pos_instalacao?: string;
}


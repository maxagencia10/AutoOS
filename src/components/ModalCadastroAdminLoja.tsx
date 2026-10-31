import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  Lock,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Search,
  Eye,
  EyeOff,
  User,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UsuarioRepository, OficinaRepository } from '../services/dbRepository';
import { Usuario, OficinaConfig } from '../types';

interface ModalCadastroAdminLojaProps {
  aberto: boolean;
  onFechar: () => void;
  onConcluido?: () => void;
}

export const ModalCadastroAdminLoja: React.FC<ModalCadastroAdminLojaProps> = ({
  aberto,
  onFechar,
  onConcluido,
}) => {
  const { usuarioAtual, oficinaAtiva, recarregarUsuarios, recarregarOficinas } = useAuth();

  // Dados do Administrador
  const [nomeAdmin, setNomeAdmin] = useState('');
  const [emailAdmin, setEmailAdmin] = useState('');
  const [telefoneAdmin, setTelefoneAdmin] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Dados da Oficina / Loja
  const [nomeOficina, setNomeOficina] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [whatsappOficina, setWhatsappOficina] = useState('');
  const [telefoneOficina, setTelefoneOficina] = useState('');
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('SP');
  const [garantiaPadrao, setGarantiaPadrao] = useState('');

  const [buscandoCep, setBuscandoCep] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (aberto) {
      if (usuarioAtual) {
        setNomeAdmin(usuarioAtual.nome || '');
        setEmailAdmin(usuarioAtual.email || '');
        setTelefoneAdmin(usuarioAtual.telefone || '');
      }
      if (oficinaAtiva) {
        setNomeOficina(oficinaAtiva.nome || '');
        setRazaoSocial(oficinaAtiva.razao_social || oficinaAtiva.nome || '');
        setCnpj(oficinaAtiva.cnpj || '');
        setWhatsappOficina(oficinaAtiva.whatsapp || '');
        setTelefoneOficina(oficinaAtiva.telefone || '');
        setCep(oficinaAtiva.cep || '');
        setLogradouro(oficinaAtiva.logradouro || '');
        setNumero(oficinaAtiva.numero || '');
        setComplemento(oficinaAtiva.complemento || '');
        setBairro(oficinaAtiva.bairro || '');
        setCidade(oficinaAtiva.cidade || '');
        setEstado(oficinaAtiva.estado || 'SP');
        setGarantiaPadrao(
          oficinaAtiva.texto_padrao_garantia ||
            'Garantia legal de 90 dias para peças e serviços conforme o Código de Defesa do Consumidor, com uso e manutenção adequados.'
        );
      }
      setNovaSenha('');
      setConfirmarSenha('');
      setErro('');
      setSucesso(false);
    }
  }, [aberto, usuarioAtual, oficinaAtiva]);

  if (!aberto) return null;

  // Busca de CEP Automática via ViaCEP
  const buscarCep = async () => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      setErro('Informe um CEP válido com 8 dígitos.');
      return;
    }
    setBuscandoCep(true);
    setErro('');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();
      if (data.erro) {
        setErro('CEP não encontrado na base dos Correios.');
      } else {
        setLogradouro(data.logradouro || '');
        setBairro(data.bairro || '');
        setCidade(data.localidade || '');
        setEstado(data.uf || 'SP');
      }
    } catch {
      setErro('Não foi possível consultar o CEP automaticamente. Preencha os campos abaixo.');
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!nomeAdmin.trim()) {
      setErro('Informe o nome completo do administrador da loja.');
      return;
    }

    if (!emailAdmin.trim()) {
      setErro('Informe o e-mail de acesso do administrador.');
      return;
    }

    if (novaSenha && novaSenha !== confirmarSenha) {
      setErro('A nova senha e a confirmação não conferem.');
      return;
    }

    if (!nomeOficina.trim()) {
      setErro('Informe o nome da oficina / loja.');
      return;
    }

    setSalvando(true);
    try {
      // 1. Atualiza dados do usuário administrador
      if (usuarioAtual?.id) {
        const updateDadosUser: Partial<Usuario> = {
          nome: nomeAdmin.trim(),
          email: emailAdmin.trim().toLowerCase(),
          telefone: telefoneAdmin.trim(),
        };
        if (novaSenha.trim()) {
          updateDadosUser.senha = novaSenha.trim();
        }
        await UsuarioRepository.update(usuarioAtual.id, updateDadosUser);
      }

      // 2. Atualiza dados da oficina/loja
      if (oficinaAtiva?.id) {
        const updateDadosOficina: Partial<OficinaConfig> = {
          nome: nomeOficina.trim(),
          razao_social: razaoSocial.trim() || nomeOficina.trim(),
          nome_fantasia: nomeOficina.trim(),
          cnpj: cnpj.trim(),
          whatsapp: whatsappOficina.trim(),
          telefone: telefoneOficina.trim(),
          email: emailAdmin.trim().toLowerCase(),
          cep: cep.trim(),
          logradouro: logradouro.trim(),
          numero: numero.trim(),
          complemento: complemento.trim(),
          bairro: bairro.trim(),
          cidade: cidade.trim(),
          estado: estado.trim(),
          responsavel_nome: nomeAdmin.trim(),
          responsavel_contato: telefoneAdmin.trim() || whatsappOficina.trim(),
          texto_padrao_garantia: garantiaPadrao.trim(),
        };
        await OficinaRepository.update(updateDadosOficina, oficinaAtiva.id);
      }

      if (usuarioAtual?.id) {
        localStorage.setItem('autoos_usuario_sessao', usuarioAtual.id);
      }
      if (oficinaAtiva?.id) {
        localStorage.setItem('autoos_oficina_ativa_id', oficinaAtiva.id);
      }
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', window.location.pathname);
      }

      await recarregarUsuarios();
      await recarregarOficinas();

      setSucesso(true);
      setTimeout(() => {
        if (onConcluido) onConcluido();
        onFechar();
      }, 700);
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar dados do administrador e da loja.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho Elegante */}
        <div className="relative bg-gradient-to-r from-zinc-950 via-zinc-900 to-red-950/40 p-5 sm:p-6 border-b border-zinc-800 shrink-0">
          <button
            onClick={() => {
              if (onConcluido) onConcluido();
              onFechar();
            }}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer"
            title="Fechar e ir para o Painel"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white shadow-lg shadow-red-950/60 border border-red-500/40 shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30">
                  Boas-vindas ao AutoOS
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {oficinaAtiva?.nome || 'Minha Loja'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-1">
                Cadastro do Administrador & Dados da Loja
              </h2>
              <p className="text-xs text-zinc-400">
                Personalize seus dados de gestor, defina sua senha definitiva e configure as informações oficiais da oficina.
              </p>
            </div>
          </div>
        </div>

        {/* Corpo do Formulário com Scroll Suave */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {erro && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl flex items-start gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Atenção</p>
                <p className="text-red-300/90 mt-0.5">{erro}</p>
              </div>
            </div>
          )}

          {sucesso && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl flex items-center gap-2.5 text-xs text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="font-medium">Cadastro e dados atualizados com sucesso! Acessando sua loja...</p>
            </div>
          )}

          {/* SEÇÃO 1: DADOS DO ADMINISTRADOR DA LOJA */}
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 space-y-3.5">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/60 text-xs font-bold text-red-400 uppercase tracking-wider">
              <User className="w-4 h-4" />
              <span>1. Responsável / Administrador da Loja</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Nome Completo do Gestor *
                </label>
                <input
                  type="text"
                  required
                  value={nomeAdmin}
                  onChange={(e) => setNomeAdmin(e.target.value)}
                  placeholder="Ex: Carlos Eduardo Silva"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  E-mail de Login *
                </label>
                <input
                  type="email"
                  required
                  value={emailAdmin}
                  onChange={(e) => setEmailAdmin(e.target.value)}
                  placeholder="admin@sualoja.com"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  WhatsApp / Celular Pessoal do Administrador
                </label>
                <input
                  type="text"
                  value={telefoneAdmin}
                  onChange={(e) => setTelefoneAdmin(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Alteração / Definição de Senha Pessoal */}
            <div className="mt-3 pt-3 border-t border-zinc-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Defina sua Nova Senha Pessoal (Recomendado)
                </span>
                <span className="text-[10px] text-zinc-400">
                  Substitui a senha provisória do WhatsApp
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Nova senha pessoal"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 pr-9 text-xs sm:text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    {mostrarSenha ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div>
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Confirmar nova senha"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-[10px] text-zinc-400">
                Se deixar em branco, sua senha continuará a atual.
              </p>
            </div>
          </div>

          {/* SEÇÃO 2: DADOS OFICIAIS DA OFICINA / LOJA */}
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 space-y-3.5">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/60 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              <span>2. Informações da Oficina / Loja (Cabeçalho da OS)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Nome Fantasia da Loja *
                </label>
                <input
                  type="text"
                  required
                  value={nomeOficina}
                  onChange={(e) => setNomeOficina(e.target.value)}
                  placeholder="Ex: Auto Center Mecânica Rápida"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  CNPJ (Opcional)
                </label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  WhatsApp de Atendimento aos Clientes *
                </label>
                <input
                  type="text"
                  required
                  value={whatsappOficina}
                  onChange={(e) => setWhatsappOficina(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Telefone Fixo / Comercial
                </label>
                <input
                  type="text"
                  value={telefoneOficina}
                  onChange={(e) => setTelefoneOficina(e.target.value)}
                  placeholder="(11) 3333-3333"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Endereço com Busca de CEP */}
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    CEP
                  </label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      maxLength={9}
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                      placeholder="00000-000"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={buscarCep}
                      disabled={buscandoCep}
                      className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold cursor-pointer shrink-0"
                      title="Buscar Endereço"
                    >
                      {buscandoCep ? '...' : <Search className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Logradouro / Rua
                  </label>
                  <input
                    type="text"
                    value={logradouro}
                    onChange={(e) => setLogradouro(e.target.value)}
                    placeholder="Rua / Avenida"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Número
                </label>
                <input
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="123"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  placeholder="Bairro"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder="Cidade"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Estado (UF)
                </label>
                <input
                  type="text"
                  maxLength={2}
                  value={estado}
                  onChange={(e) => setEstado(e.target.value.toUpperCase())}
                  placeholder="SP"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Texto Padrão de Garantia das Ordens de Serviço
                </label>
                <textarea
                  rows={2}
                  value={garantiaPadrao}
                  onChange={(e) => setGarantiaPadrao(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Botões Inferiores */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-800 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (onConcluido) onConcluido();
                onFechar();
              }}
              disabled={salvando}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Configurar Depois
            </button>

            <button
              type="submit"
              disabled={salvando}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-red-950 transition cursor-pointer disabled:opacity-50 border border-red-500"
            >
              {salvando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <span>Salvar Dados e Acessar Meu Painel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

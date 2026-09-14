import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Phone,
  Mail,
  MapPin,
  Shield,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Upload,
  RotateCcw,
  Sparkles,
  Sliders,
  Eye,
  Wand2,
  ArrowUpCircle,
} from 'lucide-react';
import { OficinaConfig } from '../types';
import { OficinaRepository } from '../services/dbRepository';
import { formatPhone, formatCpfCnpj, formatCep } from '../utils/formatters';
import { BannerCabecalhoOficial } from './BannerCabecalhoOficial';
import { BarraTituloOS } from './BarraTituloOS';
import { removeImageBackground } from '../utils/imageBackgroundRemover';
import { useAuth } from '../context/AuthContext';

interface ConfiguracoesViewProps {
  onIrParaAtualizacoes?: () => void;
}

export const ConfiguracoesView: React.FC<ConfiguracoesViewProps> = ({ onIrParaAtualizacoes }) => {
  const { zerarParaNovaInstalacao } = useAuth();
  const [formData, setFormData] = useState<OficinaConfig>({
    id: 'oficina_config_1',
    nome: '',
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
    logo_url: '',
    banner_cabecalho: '',
    cabecalho_fundo: '',
    cabecalho_logo: '',
    cabecalho_escritas: '',
    modo_cabecalho: 'composto',
    texto_padrao_garantia: '',
    condicoes_gerais: '',
  });

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');

  // Estados para controle de remoção de fundo (Logo e Escritas)
  const [rawLogoOriginal, setRawLogoOriginal] = useState<string | null>(null);
  const [rawEscritasOriginal, setRawEscritasOriginal] = useState<string | null>(null);
  const [logoThreshold, setLogoThreshold] = useState<number>(36);
  const [escritasThreshold, setEscritasThreshold] = useState<number>(32);
  const [processandoRemocao, setProcessandoRemocao] = useState<boolean>(false);

  const processFileUpload = (file: File, callback: (base64: string) => void) => {
    if (file.size > 8 * 1024 * 1024) {
      setMensagemErro('A imagem selecionada é muito grande (máximo 8MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      callback(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFileUpload(file, (base64) => {
      setFormData((prev) => ({
        ...prev,
        banner_cabecalho: base64,
        modo_cabecalho: 'imagem',
      }));
      setMensagemSucesso('Banner completo carregado! Clique em "Salvar Alterações".');
    });
  };

  const handleFundoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFileUpload(file, (base64) => {
      setFormData((prev) => ({
        ...prev,
        cabecalho_fundo: base64,
        modo_cabecalho: 'composto',
      }));
      setMensagemSucesso('Fundo automotivo carregado! Clique em "Salvar Alterações".');
    });
  };

  // Upload do Logotipo com Remoção Automática de Fundo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFileUpload(file, async (base64) => {
      setRawLogoOriginal(base64);
      try {
        setProcessandoRemocao(true);
        // Remove automaticamente o fundo preto/escuro transformando em PNG transparente
        const transparente = await removeImageBackground(base64, {
          mode: 'dark',
          threshold: logoThreshold,
          feather: 22,
        });
        setFormData((prev) => ({
          ...prev,
          cabecalho_logo: transparente,
          modo_cabecalho: 'composto',
        }));
        setMensagemSucesso('Fundo do logotipo removido com sucesso! A imagem agora é transparente e se adapta perfeitamente ao fundo.');
      } catch (err) {
        console.error('Erro ao remover fundo do logotipo:', err);
        setFormData((prev) => ({
          ...prev,
          cabecalho_logo: base64,
          modo_cabecalho: 'composto',
        }));
        setMensagemErro('Imagem do logotipo carregada. Se necessário, ajuste a remoção de fundo nos controles.');
      } finally {
        setProcessandoRemocao(false);
      }
    });
  };

  // Upload das Escritas com Remoção Automática de Fundo
  const handleEscritasUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFileUpload(file, async (base64) => {
      setRawEscritasOriginal(base64);
      try {
        setProcessandoRemocao(true);
        // Remove automaticamente o fundo preto das escritas/contatos
        const transparente = await removeImageBackground(base64, {
          mode: 'dark',
          threshold: escritasThreshold,
          feather: 20,
        });
        setFormData((prev) => ({
          ...prev,
          cabecalho_escritas: transparente,
          modo_cabecalho: 'composto',
        }));
        setMensagemSucesso('Fundo das escritas/contatos removido com sucesso! O texto agora é transparente e se integra ao fundo.');
      } catch (err) {
        console.error('Erro ao remover fundo das escritas:', err);
        setFormData((prev) => ({
          ...prev,
          cabecalho_escritas: base64,
          modo_cabecalho: 'composto',
        }));
        setMensagemErro('Imagem das escritas carregada. Se necessário, ajuste a remoção de fundo nos controles.');
      } finally {
        setProcessandoRemocao(false);
      }
    });
  };

  // Funções de ajuste de transparência em tempo real
  const handleReprocessarLogo = async (modo: 'dark' | 'light', thresholdVal?: number) => {
    const fonte = rawLogoOriginal || formData.cabecalho_logo;
    if (!fonte) return;
    const th = thresholdVal !== undefined ? thresholdVal : logoThreshold;
    try {
      setProcessandoRemocao(true);
      const transparente = await removeImageBackground(fonte, {
        mode: modo,
        threshold: th,
        feather: 22,
      });
      setFormData((prev) => ({ ...prev, cabecalho_logo: transparente }));
      setMensagemSucesso(`Fundo ${modo === 'dark' ? 'preto' : 'branco'} do logotipo removido com sensibilidade ${th}!`);
    } catch (e) {
      console.error(e);
      setMensagemErro('Falha ao reprocessar fundo do logotipo.');
    } finally {
      setProcessandoRemocao(false);
    }
  };

  const handleRestaurarLogoSemCorte = () => {
    if (rawLogoOriginal) {
      setFormData((prev) => ({ ...prev, cabecalho_logo: rawLogoOriginal }));
      setMensagemSucesso('Logotipo restaurado para imagem original sem corte de fundo.');
    }
  };

  const handleReprocessarEscritas = async (modo: 'dark' | 'light', thresholdVal?: number) => {
    const fonte = rawEscritasOriginal || formData.cabecalho_escritas;
    if (!fonte) return;
    const th = thresholdVal !== undefined ? thresholdVal : escritasThreshold;
    try {
      setProcessandoRemocao(true);
      const transparente = await removeImageBackground(fonte, {
        mode: modo,
        threshold: th,
        feather: 20,
      });
      setFormData((prev) => ({ ...prev, cabecalho_escritas: transparente }));
      setMensagemSucesso(`Fundo ${modo === 'dark' ? 'preto' : 'branco'} das escritas removido com sensibilidade ${th}!`);
    } catch (e) {
      console.error(e);
      setMensagemErro('Falha ao reprocessar fundo das escritas.');
    } finally {
      setProcessandoRemocao(false);
    }
  };

  const handleRestaurarEscritasSemCorte = () => {
    if (rawEscritasOriginal) {
      setFormData((prev) => ({ ...prev, cabecalho_escritas: rawEscritasOriginal }));
      setMensagemSucesso('Escritas restauradas para imagem original sem corte de fundo.');
    }
  };

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const carregarConfiguracoes = async () => {
    setLoading(true);
    try {
      const config = await OficinaRepository.get();
      setFormData(config);
    } catch (err) {
      console.error('Erro ao carregar dados da oficina:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setMensagemSucesso('');
    setMensagemErro('');

    try {
      await OficinaRepository.update(formData);
      setMensagemSucesso('Dados da oficina atualizados com sucesso no banco de dados!');
      setTimeout(() => setMensagemSucesso(''), 4000);
    } catch (err: any) {
      setMensagemErro(err.message || 'Erro ao salvar configurações.');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-zinc-400 text-sm">Carregando dados da oficina...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Cabeçalho */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 sm:p-5 rounded-xl flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-red-500" />
            <span>Configurações da Oficina</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Estes dados são impressos automaticamente no cabeçalho e rodapé da Ordem de Serviço em A4 e mensagens de WhatsApp.
          </p>
        </div>
      </div>

      {mensagemSucesso && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center gap-2 shadow">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {mensagemErro && (
        <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2 shadow">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{mensagemErro}</span>
        </div>
      )}

      {/* Card de Acesso Rápido à Atualização do Sistema */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 border border-red-500/30 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ArrowUpCircle className="w-5 h-5 text-red-500" />
            <h2 className="text-sm font-bold text-white">Atualização e Melhorias do Sistema</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800 font-mono">
              v1.0.0-PROTÓTIPO
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Como este é um protótipo, use o módulo de atualização para indicar onde está o pacote com as melhorias e alterações (pasta local, rede ou arquivo) com backup preventivo automático.
          </p>
        </div>
        {onIrParaAtualizacoes && (
          <button
            type="button"
            onClick={onIrParaAtualizacoes}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-bold rounded-lg transition border border-red-500 shadow-md shadow-red-950 shrink-0 cursor-pointer"
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>Atualizar Sistema</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSalvar} className="space-y-6 text-xs sm:text-sm">
        
        {/* Identidade Visual & Cabeçalho da Ordem de Serviço (Section Especial Impérios Car) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <ImageIcon className="w-5 h-5 text-red-500" />
              <span>Cabeçalho Oficial da Ordem de Serviço (Fundo + Logo + Escritas)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 bg-red-600/20 text-red-400 border border-red-500/30 rounded-md font-semibold">
                Arte Proporcional Integrada
              </span>
            </div>
          </div>

          <p className="text-zinc-400 text-xs leading-relaxed">
            O cabeçalho integra de forma proporcional os 3 elementos: o <strong>Fundo automotivo</strong> (colmeia e aletas vermelhas), o <strong>Logotipo 3D</strong> (com coroa e velocímetro, com fundo removido) e as <strong>Escritas</strong> (WhatsApp, CNPJ, Endereço e Slogan com fundo preto removido).
          </p>

          {/* Pré-visualização do Banner e da Barra Oficial */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-zinc-300 font-semibold text-xs">
                Pré-visualização do Cabeçalho Oficial Integrado:
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, modo_cabecalho: 'composto' })}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    formData.modo_cabecalho === 'composto'
                      ? 'bg-red-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  Camadas Integradas (3 Elementos)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, modo_cabecalho: 'imagem' })}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    formData.modo_cabecalho === 'imagem'
                      ? 'bg-red-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  Imagem Única
                </button>
              </div>
            </div>

            <div className="w-full rounded-xl overflow-hidden border-2 border-red-600/80 bg-white p-3 shadow-xl space-y-3">
              <BannerCabecalhoOficial oficina={formData} />
              <BarraTituloOS numeroOS="000125" dataEmissao="11/09/2025" />
            </div>
          </div>

          {/* Ações de Upload Separado (Fundo, Logo, Escritas) e Imagem Única */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            
            {/* 1. Upload do Fundo */}
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg flex flex-col justify-between gap-2.5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-xs">1. Fundo (Fundo.jfif)</span>
                  {formData.cabecalho_fundo && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">Customizado</span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">Colmeia, fibra de carbono, aletas vermelhas e silhueta do carro.</p>
              </div>

              {formData.cabecalho_fundo && (
                <div className="h-16 w-full rounded border border-zinc-800 overflow-hidden bg-black flex items-center justify-center">
                  <img src={formData.cabecalho_fundo} alt="Fundo" className="w-full h-full object-cover" />
                </div>
              )}

              <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs font-semibold cursor-pointer transition border border-zinc-700">
                <Upload className="w-3.5 h-3.5 text-red-400" />
                <span>Trocar Fundo</span>
                <input type="file" accept="image/*" onChange={handleFundoUpload} className="hidden" />
              </label>
            </div>

            {/* 2. Upload do Logotipo 3D com Remoção de Fundo */}
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg flex flex-col justify-between gap-2.5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-xs">2. Logotipo 3D (Logo.jfif)</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40 flex items-center gap-1 font-semibold">
                    <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                    Fundo Transparente
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">O fundo escuro/preto é removido para se fundir perfeitamente ao fundo.</p>
              </div>

              {/* Preview transparente com padrão xadrez */}
              <div
                className="h-20 w-full rounded border border-zinc-800 overflow-hidden flex items-center justify-center relative p-1.5"
                style={{
                  backgroundImage: 'repeating-conic-gradient(#27272a 0% 25%, #18181b 0% 50%)',
                  backgroundSize: '14px 14px',
                }}
                title="Visualização com fundo transparente (quadriculado)"
              >
                <img
                  src={formData.cabecalho_logo || '/src/assets/images/logo_imperios_car_3d_1789346970772.jpg'}
                  alt="Logo com fundo transparente"
                  className="max-h-full max-w-full object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                />
                {processandoRemocao && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white text-[11px] font-semibold gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                    Processando...
                  </div>
                )}
              </div>

              {/* Ferramentas de Remoção de Fundo */}
              <div className="space-y-1.5 pt-1 border-t border-zinc-800/80">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-red-400" />
                    Sensibilidade de Corte:
                  </span>
                  <span className="text-white font-mono font-bold">{logoThreshold}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={logoThreshold}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setLogoThreshold(val);
                    handleReprocessarLogo('dark', val);
                  }}
                  className="w-full accent-red-600 h-1 bg-zinc-800 rounded cursor-pointer"
                  title="Ajuste a intensidade do corte do fundo"
                />

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleReprocessarLogo('dark')}
                    disabled={processandoRemocao}
                    className="flex items-center justify-center gap-1 px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded text-[10px] font-semibold border border-zinc-800 transition"
                  >
                    <Wand2 className="w-2.5 h-2.5 text-red-400" />
                    <span>Fundo Preto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReprocessarLogo('light')}
                    disabled={processandoRemocao}
                    className="flex items-center justify-center gap-1 px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded text-[10px] font-semibold border border-zinc-800 transition"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-blue-400" />
                    <span>Fundo Claro</span>
                  </button>
                </div>
              </div>

              <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs font-semibold cursor-pointer transition border border-zinc-700">
                <Upload className="w-3.5 h-3.5 text-red-400" />
                <span>Enviar Novo Logo</span>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            </div>

            {/* 3. Upload das Escritas com Remoção de Fundo */}
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg flex flex-col justify-between gap-2.5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-xs">3. Escritas (Escritas.jfif)</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40 flex items-center gap-1 font-semibold">
                    <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                    Fundo Transparente
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">O fundo preto é removido para que o WhatsApp e endereço flutuem sobre o carro.</p>
              </div>

              {/* Preview transparente com padrão xadrez */}
              <div
                className="h-20 w-full rounded border border-zinc-800 overflow-hidden flex items-center justify-center relative p-1.5"
                style={{
                  backgroundImage: 'repeating-conic-gradient(#27272a 0% 25%, #18181b 0% 50%)',
                  backgroundSize: '14px 14px',
                }}
                title="Visualização com fundo transparente (quadriculado)"
              >
                {formData.cabecalho_escritas ? (
                  <img
                    src={formData.cabecalho_escritas}
                    alt="Escritas com fundo transparente"
                    className="max-h-full max-w-full object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                  />
                ) : (
                  <div className="text-center text-[10px] text-zinc-400 leading-tight">
                    <span className="text-emerald-400 font-semibold block">Camada Vetorial Padrão Ativa</span>
                    (Ou envie a imagem Escritas.jfif)
                  </div>
                )}
                {processandoRemocao && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white text-[11px] font-semibold gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                    Processando...
                  </div>
                )}
              </div>

              {/* Ferramentas de Remoção de Fundo das Escritas */}
              <div className="space-y-1.5 pt-1 border-t border-zinc-800/80">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-red-400" />
                    Sensibilidade de Corte:
                  </span>
                  <span className="text-white font-mono font-bold">{escritasThreshold}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={escritasThreshold}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setEscritasThreshold(val);
                    if (formData.cabecalho_escritas) {
                      handleReprocessarEscritas('dark', val);
                    }
                  }}
                  className="w-full accent-red-600 h-1 bg-zinc-800 rounded cursor-pointer"
                  title="Ajuste a intensidade do corte do fundo das escritas"
                />

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleReprocessarEscritas('dark')}
                    disabled={processandoRemocao || !formData.cabecalho_escritas}
                    className="flex items-center justify-center gap-1 px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded text-[10px] font-semibold border border-zinc-800 transition disabled:opacity-50"
                  >
                    <Wand2 className="w-2.5 h-2.5 text-red-400" />
                    <span>Fundo Preto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReprocessarEscritas('light')}
                    disabled={processandoRemocao || !formData.cabecalho_escritas}
                    className="flex items-center justify-center gap-1 px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded text-[10px] font-semibold border border-zinc-800 transition disabled:opacity-50"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-blue-400" />
                    <span>Fundo Claro</span>
                  </button>
                </div>
              </div>

              <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs font-semibold cursor-pointer transition border border-zinc-700">
                <Upload className="w-3.5 h-3.5 text-red-400" />
                <span>Enviar Novas Escritas</span>
                <input type="file" accept="image/*" onChange={handleEscritasUpload} className="hidden" />
              </label>
            </div>

          </div>

          {/* Opções de Imagem Única e Restauração */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800">
            <label className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold cursor-pointer border border-zinc-700 transition">
              <Upload className="w-3.5 h-3.5 text-zinc-400" />
              <span>Ou Enviar Imagem Única Completa</span>
              <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
            </label>

            {(formData.banner_cabecalho || formData.cabecalho_fundo || formData.cabecalho_logo || formData.cabecalho_escritas) && (
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    banner_cabecalho: '',
                    cabecalho_fundo: '',
                    cabecalho_logo: '',
                    cabecalho_escritas: '',
                    modo_cabecalho: 'composto',
                  });
                  setMensagemSucesso('Todos os elementos foram restaurados para a arte oficial integrada.');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs transition border border-zinc-800"
              >
                <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                <span>Restaurar Arte Padrão Oficial</span>
              </button>
            )}
          </div>
        </div>

        {/* Identificação Jurídica */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-zinc-800 pb-2">
            <Building2 className="w-4 h-4 text-red-500" />
            <span>Dados da Empresa</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Nome Fantasia (Exibido no Cabeçalho)</label>
              <input
                type="text"
                required
                value={formData.nome_fantasia}
                onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">Razão Social</label>
              <input
                type="text"
                value={formData.razao_social}
                onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">CNPJ</label>
              <input
                type="text"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">E-mail de Contato</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">Slogan (ex: Seu carro em boas mãos!)</label>
              <input
                type="text"
                value={formData.texto_institucional || ''}
                onChange={(e) => setFormData({ ...formData, texto_institucional: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500 italic"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">Telefone Fixo / Principal</label>
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">WhatsApp Comercial</label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Localização e Endereço */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-zinc-800 pb-2">
            <MapPin className="w-4 h-4 text-red-500" />
            <span>Endereço da Oficina</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-zinc-400 font-medium mb-1">CEP</label>
              <input
                type="text"
                value={formData.cep}
                onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500 font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-zinc-400 font-medium mb-1">Logradouro / Rua / Avenida</label>
              <input
                type="text"
                value={formData.logradouro}
                onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">Número</label>
              <input
                type="text"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-medium mb-1">Complemento</label>
              <input
                type="text"
                value={formData.complemento}
                onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-medium mb-1">Bairro</label>
              <input
                type="text"
                value={formData.bairro}
                onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-zinc-400 font-medium mb-1">Cidade</label>
              <input
                type="text"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-medium mb-1">Estado (UF)</label>
              <input
                type="text"
                maxLength={2}
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500 uppercase font-mono"
              />
            </div>
          </div>
        </div>

        {/* Termos de Garantia e Condições Gerais (Section 16 e 25) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-zinc-800 pb-2">
            <Shield className="w-4 h-4 text-red-500" />
            <span>Prazos Padrão de Garantia e Condições de Atendimento</span>
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Texto Padrão de Garantia (Carregado nas novas OS)</label>
            <textarea
              rows={3}
              value={formData.texto_padrao_garantia}
              onChange={(e) => setFormData({ ...formData, texto_padrao_garantia: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Condições Gerais da Oficina (Rodapé do Documento)</label>
            <textarea
              rows={3}
              value={formData.condicoes_gerais}
              onChange={(e) => setFormData({ ...formData, condicoes_gerais: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={salvando}
            id="btn-salvar-config"
            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-semibold rounded-lg shadow-lg shadow-red-950 transition border border-red-500 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{salvando ? 'Gravando no Banco...' : 'Salvar Alterações'}</span>
          </button>
        </div>

      </form>

      {/* Seção de Zona de Reinicialização Limpa */}
      <div className="bg-zinc-900 border border-red-950/60 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-red-400 font-bold text-sm border-b border-zinc-800 pb-2">
          <Shield className="w-4 h-4" />
          <span>Zona de Instalação: Zerar Sistema para Produção</span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Deseja zerar todos os dados fictícios e reabrir o Assistente de Instalação Inicial para cadastrar o Administrador e a Oficina do zero?
        </p>
        <div>
          <button
            type="button"
            onClick={async () => {
              const confirmacao = window.prompt(
                'ATENÇÃO: Isso apagará todos os dados fictícios e testes da oficina, clientes e veículos. Digite ZERAR para confirmar:'
              );
              if (confirmacao && confirmacao.trim().toUpperCase() === 'ZERAR') {
                await zerarParaNovaInstalacao();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-red-950 hover:text-red-400 hover:border-red-800 text-zinc-300 text-xs font-semibold rounded-lg transition border border-zinc-700"
          >
            <Sparkles className="w-4 h-4 text-red-400" />
            <span>Zerar Sistema e Abrir Assistente de Instalação</span>
          </button>
        </div>
      </div>
    </div>
  );
};

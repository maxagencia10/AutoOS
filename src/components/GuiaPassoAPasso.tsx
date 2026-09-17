import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Users,
  Car,
  FileText,
  CheckCircle2,
  Sparkles,
  MousePointer,
  Plus,
} from 'lucide-react';

export interface GuiaPassoAPassoProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onAbrirNovaOS: () => void;
  onAbrirNovoCliente?: () => void;
  onAbrirNovoVeiculo?: () => void;
  etapaInicial?: number;
}

export const GuiaPassoAPasso: React.FC<GuiaPassoAPassoProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  onAbrirNovaOS,
  onAbrirNovoCliente,
  onAbrirNovoVeiculo,
  etapaInicial = 1,
}) => {
  // 1 = Cliente, 2 = Veículo, 3 = OS
  const [etapa, setEtapa] = useState<number>(etapaInicial > 0 ? etapaInicial : 1);
  const [apontadorPos, setApontadorPos] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const novaEtapa = etapaInicial > 0 ? etapaInicial : 1;
      setEtapa(novaEtapa);
    }
  }, [isOpen, etapaInicial]);

  // Função para navegar entre os passos garantindo a troca de aba
  const irParaEtapa = useCallback((proximaEtapa: number) => {
    setEtapa(proximaEtapa);
    if (proximaEtapa === 1) {
      if (currentTab !== 'clientes') onSelectTab('clientes');
    } else if (proximaEtapa === 2) {
      if (currentTab !== 'veiculos') onSelectTab('veiculos');
    } else if (proximaEtapa === 3) {
      if (currentTab !== 'os' && currentTab !== 'dashboard') onSelectTab('os');
    }
  }, [currentTab, onSelectTab]);

  // Rastreia a posição exata do botão alvo na tela
  useEffect(() => {
    if (!isOpen || etapa < 1 || etapa > 3) {
      setApontadorPos(null);
      return;
    }

    let targetSelector = '';
    if (etapa === 1) {
      if (currentTab === 'clientes') {
        targetSelector = '#btn-novo-cliente';
      } else if (currentTab === 'dashboard') {
        targetSelector = '#dash-btn-novo-cliente';
      } else {
        targetSelector = '#nav-tab-clientes';
      }
    } else if (etapa === 2) {
      if (currentTab === 'veiculos') {
        targetSelector = '#btn-novo-veiculo';
      } else if (currentTab === 'dashboard') {
        targetSelector = '#dash-btn-novo-veiculo';
      } else {
        targetSelector = '#nav-tab-veiculos';
      }
    } else if (etapa === 3) {
      if (currentTab === 'dashboard') {
        targetSelector = '#dash-btn-nova-os';
      } else {
        targetSelector = '#btn-navbar-nova-os';
      }
    }

    if (!targetSelector) {
      setApontadorPos(null);
      return;
    }

    const updatePosition = () => {
      const el = document.querySelector(targetSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        // Só atualiza se o elemento estiver visível
        if (rect.width > 0 && rect.height > 0) {
          setApontadorPos({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height,
          });
          return;
        }
      }
      setApontadorPos(null);
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    const interval = setInterval(updatePosition, 600);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
      clearInterval(interval);
    };
  }, [isOpen, etapa, currentTab]);

  if (!isOpen) return null;

  // Ação direta do botão de atalho rápido na barra do tour
  const executarAcaoRapida = () => {
    if (etapa === 1) {
      if (currentTab !== 'clientes') {
        onSelectTab('clientes');
        setTimeout(() => {
          const btn = document.getElementById('btn-novo-cliente');
          if (btn) (btn as HTMLButtonElement).click();
          else if (onAbrirNovoCliente) onAbrirNovoCliente();
        }, 150);
      } else {
        const btn = document.getElementById('btn-novo-cliente');
        if (btn) (btn as HTMLButtonElement).click();
        else if (onAbrirNovoCliente) onAbrirNovoCliente();
      }
    } else if (etapa === 2) {
      if (currentTab !== 'veiculos') {
        onSelectTab('veiculos');
        setTimeout(() => {
          const btn = document.getElementById('btn-novo-veiculo');
          if (btn) (btn as HTMLButtonElement).click();
          else if (onAbrirNovoVeiculo) onAbrirNovoVeiculo();
        }, 150);
      } else {
        const btn = document.getElementById('btn-novo-veiculo');
        if (btn) (btn as HTMLButtonElement).click();
        else if (onAbrirNovoVeiculo) onAbrirNovoVeiculo();
      }
    } else if (etapa === 3) {
      onAbrirNovaOS();
    }
  };

  const isTooltipAbove = apontadorPos && (apontadorPos.top - window.scrollY) > 60;

  return (
    <>
      {/* 1. APONTADOR VISUAL INTERATIVO NA TELA (Mãozinha + Destaque Pulsante Vermelho) */}
      {apontadorPos && etapa >= 1 && etapa <= 3 && (
        <div
          style={{
            position: 'absolute',
            top: apontadorPos.top - 6,
            left: apontadorPos.left - 6,
            width: apontadorPos.width + 12,
            height: apontadorPos.height + 12,
            pointerEvents: 'none',
            zIndex: 45,
          }}
          className="transition-all duration-300"
        >
          {/* Caixa pulsante vermelha ao redor do botão */}
          <div className="w-full h-full rounded-xl border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.85)] animate-pulse" />

          {/* Balão Indicador com Apontador */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              top: isTooltipAbove ? '-44px' : `${apontadorPos.height + 14}px`,
            }}
            className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-1.5 whitespace-nowrap animate-bounce border border-red-400"
          >
            <MousePointer className="w-3.5 h-3.5 fill-current" />
            <span>
              {etapa === 1 && '1º PASSO: Clique aqui para Criar o Cliente'}
              {etapa === 2 && '2º PASSO: Clique aqui para Criar o Veículo'}
              {etapa === 3 && '3º PASSO: Clique aqui para Gerar a Nova OS'}
            </span>
          </div>
        </div>
      )}

      {/* 2. BARRA DE NAVEGAÇÃO FLUTUANTE DO TOUR (Compacta, sem cobrir a tela com pop-up) */}
      <div
        id="tour-barra-flutuante"
        className="fixed top-20 left-1/2 -translate-x-1/2 z-40 bg-zinc-950/95 backdrop-blur-md border border-red-500/60 shadow-2xl rounded-2xl p-2 sm:px-4 sm:py-2.5 max-w-[95vw] sm:max-w-2xl text-zinc-100 flex flex-wrap items-center justify-between gap-2.5 transition-all no-print"
      >
        {/* Passos do Roteiro */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="p-1 bg-red-600/20 text-red-400 rounded-lg border border-red-500/30 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-red-500" />
          </div>
          
          <button
            onClick={() => irParaEtapa(1)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition ${
              etapa === 1
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Users className="w-3 h-3" />
            <span>1. Cliente</span>
          </button>

          <span className="text-zinc-600 text-[10px]">➔</span>

          <button
            onClick={() => irParaEtapa(2)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition ${
              etapa === 2
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Car className="w-3 h-3" />
            <span>2. Veículo</span>
          </button>

          <span className="text-zinc-600 text-[10px]">➔</span>

          <button
            onClick={() => irParaEtapa(3)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition ${
              etapa === 3
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <FileText className="w-3 h-3" />
            <span>3. Nova OS</span>
          </button>
        </div>

        {/* Botões de Ação e Avanço */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Botão para acionar o modal correspondente diretamente */}
          <button
            onClick={executarAcaoRapida}
            className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg text-xs font-medium border border-zinc-700 transition"
          >
            <Plus className="w-3 h-3 text-red-400" />
            <span>
              {etapa === 1 && 'Abrir Formulário'}
              {etapa === 2 && 'Abrir Formulário'}
              {etapa === 3 && 'Abrir Nova OS'}
            </span>
          </button>

          {/* Navegar para etapa anterior */}
          {etapa > 1 && (
            <button
              onClick={() => irParaEtapa(etapa - 1)}
              title="Passo Anterior"
              className="p-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-zinc-800 transition text-xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Navegar para próxima etapa ou concluir */}
          {etapa < 3 ? (
            <button
              onClick={() => irParaEtapa(etapa + 1)}
              className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow transition border border-red-500"
            >
              <span>{etapa === 1 ? 'Próximo: Veículo' : 'Próximo: OS'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition border border-emerald-500"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Concluir</span>
            </button>
          )}

          {/* Botão de Fechar o Tour */}
          <button
            onClick={onClose}
            title="Sair do Tour"
            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
};

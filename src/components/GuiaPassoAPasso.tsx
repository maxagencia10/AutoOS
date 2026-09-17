import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  X,
  ChevronRight,
  ChevronLeft,
  Users,
  Car,
  FileText,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  MousePointer,
  RotateCcw,
  Minimize2,
  Maximize2,
  ExternalLink,
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
  etapaInicial,
}) => {
  const [etapa, setEtapa] = useState<number>(etapaInicial ?? 0); // 0 = Apresentação, 1 = Cliente, 2 = Veículo, 3 = OS, 4 = Concluído
  const [minimizado, setMinimizado] = useState<boolean>(false);
  const [apontadorPos, setApontadorPos] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (isOpen && etapaInicial !== undefined) {
      setEtapa(etapaInicial);
      setMinimizado(false);
    }
  }, [isOpen, etapaInicial]);

  // Define os alvos visuais para apontar na tela conforme a etapa e aba atual
  useEffect(() => {
    if (!isOpen || minimizado) {
      setApontadorPos(null);
      return;
    }

    let targetSelector = '';
    if (etapa === 1) {
      if (currentTab === 'dashboard') {
        targetSelector = '#dash-btn-novo-cliente';
      } else if (currentTab === 'clientes') {
        targetSelector = '#btn-novo-cliente';
      } else {
        targetSelector = '#nav-tab-clientes';
      }
    } else if (etapa === 2) {
      if (currentTab === 'dashboard') {
        targetSelector = '#dash-btn-novo-veiculo';
      } else if (currentTab === 'veiculos') {
        targetSelector = '#btn-novo-veiculo';
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
        setApontadorPos({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
      } else {
        setApontadorPos(null);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    const interval = setInterval(updatePosition, 800);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
      clearInterval(interval);
    };
  }, [isOpen, etapa, currentTab, minimizado]);

  if (!isOpen) return null;

  // Executa a ação direta do passo atual
  const executarAcaoDoPasso = () => {
    if (etapa === 1) {
      onSelectTab('clientes');
      setTimeout(() => {
        const btnNovoCli = document.getElementById('btn-novo-cliente');
        if (btnNovoCli) {
          (btnNovoCli as HTMLButtonElement).click();
        } else if (onAbrirNovoCliente) {
          onAbrirNovoCliente();
        }
      }, 150);
    } else if (etapa === 2) {
      onSelectTab('veiculos');
      setTimeout(() => {
        const btnNovoVeic = document.getElementById('btn-novo-veiculo');
        if (btnNovoVeic) {
          (btnNovoVeic as HTMLButtonElement).click();
        } else if (onAbrirNovoVeiculo) {
          onAbrirNovoVeiculo();
        }
      }, 150);
    } else if (etapa === 3) {
      onAbrirNovaOS();
    }
  };

  return (
    <>
      {/* 1. APONTADOR VISUAL PULSANTE NA TELA (Mostra exatamente onde clicar) */}
      {apontadorPos && !minimizado && etapa >= 1 && etapa <= 3 && (
        <div
          style={{
            position: 'absolute',
            top: apontadorPos.top - 8,
            left: apontadorPos.left - 8,
            width: apontadorPos.width + 16,
            height: apontadorPos.height + 16,
            pointerEvents: 'none',
            zIndex: 40,
          }}
          className="transition-all duration-300"
        >
          {/* Caixa pulsante vermelha ao redor do botão */}
          <div className="w-full h-full rounded-xl border-2 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.7)] animate-pulse" />
          
          {/* Balão flutuante apontando */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap animate-bounce">
            <MousePointer className="w-3.5 h-3.5" />
            <span>
              {etapa === 1 && '1º CLIQUE AQUI: NOVO CLIENTE'}
              {etapa === 2 && '2º CLIQUE AQUI: NOVO VEÍCULO'}
              {etapa === 3 && '3º CLIQUE AQUI: NOVA OS'}
            </span>
          </div>
        </div>
      )}

      {/* 2. CARD DO GUIA FLUTUANTE (Modo Minimizado) */}
      {minimizado ? (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2">
          <button
            onClick={() => setMinimizado(false)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold text-xs shadow-2xl border-2 border-red-400 animate-pulse transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Tour Guiado: Passo {etapa > 0 && etapa <= 3 ? etapa : 1} de 3</span>
            <Maximize2 className="w-3.5 h-3.5 ml-1" />
          </button>
          <button
            onClick={onClose}
            title="Fechar Guia"
            className="p-2 bg-zinc-900/90 text-zinc-400 hover:text-white rounded-full border border-zinc-700 shadow-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* 3. CARD DO GUIA FLUTUANTE COMPLETO (Passo a Passo detalhado) */
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[460px] max-h-[90vh] flex flex-col bg-zinc-900/98 backdrop-blur-md border-2 border-red-500/80 rounded-2xl shadow-2xl shadow-red-950/70 overflow-hidden text-zinc-100 transition-all">
          
          {/* Barra Superior do Guia */}
          <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-800 px-4 py-3 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-black/20 rounded-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">
                  Como Usar o AutoOS • Guia Rápido
                </h3>
                <p className="text-[10px] text-red-100 font-medium">
                  {etapa === 0 && 'Apresentação do Roteiro'}
                  {etapa === 1 && 'Passo 1 de 3: Cadastrar Cliente'}
                  {etapa === 2 && 'Passo 2 de 3: Cadastrar Veículo'}
                  {etapa === 3 && 'Passo 3 de 3: Gerar Ordem de Serviço'}
                  {etapa === 4 && 'Roteiro Concluído!'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setMinimizado(true)}
                title="Minimizar Guia"
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                title="Fechar Guia"
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Barra de Progresso Visual dos 3 Passos */}
          <div className="bg-zinc-950 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between gap-2">
            <button
              onClick={() => setEtapa(1)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
                etapa === 1
                  ? 'bg-red-600/30 text-red-400 border border-red-500/50'
                  : etapa > 1
                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50'
                  : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {etapa > 1 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Users className="w-3.5 h-3.5" />}
              <span>1. Cliente</span>
            </button>

            <span className="text-zinc-600 text-xs">➔</span>

            <button
              onClick={() => setEtapa(2)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
                etapa === 2
                  ? 'bg-red-600/30 text-red-400 border border-red-500/50'
                  : etapa > 2
                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50'
                  : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {etapa > 2 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Car className="w-3.5 h-3.5" />}
              <span>2. Veículo</span>
            </button>

            <span className="text-zinc-600 text-xs">➔</span>

            <button
              onClick={() => setEtapa(3)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
                etapa === 3
                  ? 'bg-red-600/30 text-red-400 border border-red-500/50'
                  : etapa > 3
                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50'
                  : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {etapa > 3 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <FileText className="w-3.5 h-3.5" />}
              <span>3. Ordem (OS)</span>
            </button>
          </div>

          {/* Conteúdo Central da Etapa */}
          <div className="p-4 sm:p-5 overflow-y-auto max-h-[60vh] space-y-4 text-xs sm:text-sm">
            
            {/* ETAPA 0: INTRODUÇÃO GERAL */}
            {etapa === 0 && (
              <div className="space-y-3.5">
                <div className="flex items-start gap-3 bg-red-950/30 border border-red-900/50 p-3 rounded-xl">
                  <Sparkles className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-zinc-300 leading-relaxed text-xs">
                    Para usar o AutoOS com facilidade, você só precisa seguir sempre esta mesma ordem simples de 3 passos:
                  </p>
                </div>

                <div className="space-y-2">
                  <div
                    onClick={() => setEtapa(1)}
                    className="p-3 bg-zinc-950/80 hover:bg-zinc-800/80 rounded-xl border border-zinc-800 hover:border-red-500/50 cursor-pointer transition flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-800/50 flex items-center justify-center text-blue-400 font-bold shrink-0">
                      1
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">1. Cadastrar o Cliente</div>
                      <div className="text-[11px] text-zinc-400">Nome e telefone/WhatsApp do dono do veículo.</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </div>

                  <div
                    onClick={() => setEtapa(2)}
                    className="p-3 bg-zinc-950/80 hover:bg-zinc-800/80 rounded-xl border border-zinc-800 hover:border-red-500/50 cursor-pointer transition flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-800/50 flex items-center justify-center text-amber-400 font-bold shrink-0">
                      2
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">2. Cadastrar o Veículo</div>
                      <div className="text-[11px] text-zinc-400">Placa e modelo do carro, associado ao cliente.</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </div>

                  <div
                    onClick={() => setEtapa(3)}
                    className="p-3 bg-zinc-950/80 hover:bg-zinc-800/80 rounded-xl border border-zinc-800 hover:border-red-500/50 cursor-pointer transition flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                      3
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">3. Gerar a Ordem de Serviço</div>
                      <div className="text-[11px] text-zinc-400">Serviços, peças, valores e impressão A4 ou WhatsApp.</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 1: CADASTRAR CLIENTE */}
            {etapa === 1 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <Users className="w-4 h-4" />
                  <span>1º Passo: Cadastrar o Cliente</span>
                </div>

                <p className="text-zinc-300 leading-relaxed text-xs">
                  Antes de abrir a ordem de serviço, nós registramos quem é o dono do carro. É rápido e você só faz uma vez por cliente!
                </p>

                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/90 space-y-2 text-xs">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span>O que você deve preencher:</span>
                  </div>
                  <ul className="space-y-1.5 text-zinc-300 list-disc pl-4">
                    <li><strong className="text-white">Nome Completo</strong> ou apelido do cliente.</li>
                    <li><strong className="text-white">Telefone ou WhatsApp</strong> para contato e envio do orçamento.</li>
                    <li><strong className="text-emerald-400">Dica prática do CEP:</strong> Digite os 8 números do CEP do cliente e o sistema busca o endereço completo (Rua, Bairro e Cidade) sozinho!</li>
                  </ul>
                </div>

                <div className="p-3 bg-red-950/30 border border-red-900/40 rounded-xl flex items-center justify-between gap-2">
                  <div className="text-[11px] text-zinc-300">
                    <strong className="text-white block">Onde clicar:</strong>
                    Clique no botão destacado com a caixa vermelha pulsante na tela.
                  </div>
                  <button
                    onClick={executarAcaoDoPasso}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-xs shadow transition flex items-center gap-1 shrink-0"
                  >
                    <span>Abrir Cadastro</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 2: CADASTRAR VEÍCULO */}
            {etapa === 2 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Car className="w-4 h-4" />
                  <span>2º Passo: Cadastrar o Veículo</span>
                </div>

                <p className="text-zinc-300 leading-relaxed text-xs">
                  Com o cliente já cadastrado, agora registramos o veículo (carro, moto, caminhão) que será consertado.
                </p>

                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/90 space-y-2 text-xs">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>O que você deve preencher:</span>
                  </div>
                  <ul className="space-y-1.5 text-zinc-300 list-disc pl-4">
                    <li><strong className="text-white">Cliente Proprietário:</strong> Escolha na lista o cliente que você cadastrou no Passo 1.</li>
                    <li><strong className="text-white">Placa:</strong> Digite a placa (pode ser modelo Mercosul ou placa antiga cinza).</li>
                    <li><strong className="text-white">Marca e Modelo:</strong> Ex: <em>Fiat Palio 1.0</em>, <em>Chevrolet Onix</em>, <em>Honda Civic</em>.</li>
                    <li><strong className="text-white">Quilometragem (Km):</strong> Para você saber quando será a próxima revisão de óleo e filtros!</li>
                  </ul>
                </div>

                <div className="p-3 bg-amber-950/30 border border-amber-900/40 rounded-xl flex items-center justify-between gap-2">
                  <div className="text-[11px] text-zinc-300">
                    <strong className="text-white block">Onde clicar:</strong>
                    Clique no botão destacado com a caixa vermelha pulsante na tela.
                  </div>
                  <button
                    onClick={executarAcaoDoPasso}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-xs shadow transition flex items-center gap-1 shrink-0"
                  >
                    <span>Abrir Cadastro</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 3: GERAR A ORDEM DE SERVIÇO */}
            {etapa === 3 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <FileText className="w-4 h-4" />
                  <span>3º Passo: Gerar a Ordem de Serviço (OS)</span>
                </div>

                <p className="text-zinc-300 leading-relaxed text-xs">
                  Agora que o Cliente e o Veículo estão cadastrados, gerar a Ordem de Serviço leva menos de 1 minuto!
                </p>

                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/90 space-y-2 text-xs">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Como preencher a OS:</span>
                  </div>
                  <ul className="space-y-1.5 text-zinc-300 list-disc pl-4">
                    <li><strong className="text-white">1. Selecione o Cliente e o Carro</strong> nas caixas de seleção do formulário.</li>
                    <li><strong className="text-white">2. Defeito Relatado:</strong> Escreva o que o cliente reclamou (ex: <em>"Barulho na suspensão dianteira ao passar em lombadas"</em>).</li>
                    <li><strong className="text-white">3. Serviços e Peças:</strong> Adicione o que foi trocado (ex: Amortecedores, Troca de pastilhas) e os valores.</li>
                    <li><strong className="text-white">4. Salvar:</strong> Clique no botão verde no final para emitir a OS!</li>
                    <li><strong className="text-emerald-400">Pronto!</strong> A tela de impressão A4 e o botão de WhatsApp abrirão na hora.</li>
                  </ul>
                </div>

                <div className="p-3 bg-emerald-950/30 border border-emerald-900/40 rounded-xl flex items-center justify-between gap-2">
                  <div className="text-[11px] text-zinc-300">
                    <strong className="text-white block">Onde clicar:</strong>
                    Clique no botão vermelho <strong>Nova OS</strong> no topo da página.
                  </div>
                  <button
                    onClick={executarAcaoDoPasso}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-xs shadow transition flex items-center gap-1 shrink-0"
                  >
                    <span>Abrir Nova OS</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 4: CONCLUSÃO */}
            {etapa === 4 && (
              <div className="space-y-3.5 text-center py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-950">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Parabéns! Você já sabe tudo!</h4>
                  <p className="text-xs text-zinc-300 mt-1 max-w-xs mx-auto">
                    A rotina da sua oficina fica organizada e profissional:
                    <br />
                    <strong className="text-emerald-400">Cliente ➔ Veículo ➔ Ordem de Serviço</strong>
                  </p>
                </div>

                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-[11px] text-zinc-400 text-left">
                  Sempre que precisar relembrar este passo a passo, basta clicar no botão <strong>"Como Usar (Tour)"</strong> no topo ou no painel inicial.
                </div>
              </div>
            )}

          </div>

          {/* Rodapé de Controles e Navegação do Guia */}
          <div className="bg-zinc-950/90 px-4 py-3 border-t border-zinc-800 flex items-center justify-between gap-2">
            <div>
              {etapa > 0 ? (
                <button
                  type="button"
                  onClick={() => setEtapa((prev) => prev - 1)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Voltar</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setEtapa(1)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Iniciar Tour</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {etapa < 4 ? (
                <button
                  type="button"
                  onClick={() => setEtapa((prev) => prev + 1)}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-lg shadow transition"
                >
                  <span>{etapa === 0 ? 'Começar Passo 1' : etapa === 3 ? 'Concluir Roteiro' : 'Próximo Passo'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Fechar Guia</span>
                </button>
              )}
            </div>
          </div>

        </div>
      )}
    </>
  );
};

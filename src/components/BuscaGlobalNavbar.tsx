import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Users,
  Car,
  ChevronRight,
  Loader2,
  FileText,
  Phone,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  BuscaGlobalRepository,
  ResultadoBuscaGlobal,
  ResultadoBuscaGlobalCliente,
  ResultadoBuscaGlobalVeiculo,
} from '../services/dbRepository';
import { Cliente, Veiculo } from '../types';
import { formatPlaca, formatCpfCnpj, formatPhone } from '../utils/formatters';

interface BuscaGlobalNavbarProps {
  onSelectCliente: (cliente: Cliente) => void;
  onSelectVeiculo: (veiculo: Veiculo) => void;
}

export const BuscaGlobalNavbar: React.FC<BuscaGlobalNavbarProps> = ({
  onSelectCliente,
  onSelectVeiculo,
}) => {
  const [termo, setTermo] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [resultados, setResultados] = useState<ResultadoBuscaGlobal | null>(null);
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [mobileAtivo, setMobileAtivo] = useState(false);
  const [indiceFoco, setIndiceFoco] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputDesktopRef = useRef<HTMLInputElement>(null);
  const inputMobileRef = useRef<HTMLInputElement>(null);

  // Lista linear de resultados para navegação via setas do teclado
  const itensNavegaveis = React.useMemo(() => {
    if (!resultados) return [];
    const items: Array<{ tipo: 'cliente' | 'veiculo'; data: any }> = [];
    resultados.clientes.forEach((c) => items.push({ tipo: 'cliente', data: c }));
    resultados.veiculos.forEach((v) => items.push({ tipo: 'veiculo', data: v }));
    return items;
  }, [resultados]);

  // Debounce da busca
  useEffect(() => {
    if (!termo.trim()) {
      setResultados(null);
      setCarregando(false);
      setIndiceFoco(-1);
      return;
    }

    setCarregando(true);
    const timer = setTimeout(async () => {
      try {
        const res = await BuscaGlobalRepository.buscar(termo);
        setResultados(res);
        setDropdownAberto(true);
        setIndiceFoco(-1);
      } catch (err) {
        console.error('Erro na busca global:', err);
      } finally {
        setCarregando(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [termo]);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickFora = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownAberto(false);
        setMobileAtivo(false);
      }
    };

    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  // Atalho global de teclado (Ctrl+K, Cmd+K ou / para focar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputDesktopRef.current?.focus();
        setDropdownAberto(true);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputDesktopRef.current?.focus();
        setDropdownAberto(true);
      } else if (e.key === 'Escape') {
        setDropdownAberto(false);
        setMobileAtivo(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleKeyDownInput = (e: React.KeyboardEvent) => {
    if (!dropdownAberto || itensNavegaveis.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndiceFoco((prev) => (prev < itensNavegaveis.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndiceFoco((prev) => (prev > 0 ? prev - 1 : itensNavegaveis.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (indiceFoco >= 0 && indiceFoco < itensNavegaveis.length) {
        const item = itensNavegaveis[indiceFoco];
        if (item.tipo === 'cliente') {
          handleEscolherCliente(item.data);
        } else {
          handleEscolherVeiculo(item.data);
        }
      } else if (itensNavegaveis.length > 0) {
        const primeiro = itensNavegaveis[0];
        if (primeiro.tipo === 'cliente') {
          handleEscolherCliente(primeiro.data);
        } else {
          handleEscolherVeiculo(primeiro.data);
        }
      }
    }
  };

  const handleLimpar = () => {
    setTermo('');
    setResultados(null);
    setDropdownAberto(false);
    setIndiceFoco(-1);
    inputDesktopRef.current?.focus();
  };

  const handleEscolherCliente = (cliente: Cliente) => {
    setDropdownAberto(false);
    setMobileAtivo(false);
    setTermo('');
    onSelectCliente(cliente);
  };

  const handleEscolherVeiculo = (veiculo: Veiculo) => {
    setDropdownAberto(false);
    setMobileAtivo(false);
    setTermo('');
    onSelectVeiculo(veiculo);
  };

  const totalEncontrados = (resultados?.clientes.length || 0) + (resultados?.veiculos.length || 0);

  return (
    <div ref={containerRef} className="relative flex items-center">
      {/* Botão de Busca para Telas Pequenas (< md) */}
      <button
        type="button"
        id="btn-busca-global-mobile"
        onClick={() => {
          setMobileAtivo(true);
          setDropdownAberto(true);
          setTimeout(() => inputMobileRef.current?.focus(), 50);
        }}
        className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition"
        title="Buscar por Cliente, CPF ou Placa"
        aria-label="Abrir busca global"
      >
        <Search className="w-4 h-4 text-zinc-300" />
      </button>

      {/* Barra de Busca Desktop (md em diante) */}
      <div className="hidden md:flex items-center relative">
        <div className="relative flex items-center w-48 lg:w-64 xl:w-80 focus-within:w-64 lg:focus-within:w-80 xl:focus-within:w-96 transition-all duration-200">
          <Search className="w-4 h-4 absolute left-3 text-zinc-400 pointer-events-none" />
          <input
            ref={inputDesktopRef}
            id="input-busca-global-desktop"
            type="text"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            onFocus={() => {
              if (termo.trim()) setDropdownAberto(true);
            }}
            onKeyDown={handleKeyDownInput}
            placeholder="Buscar cliente, CPF ou placa..."
            className="w-full pl-9 pr-14 py-1.5 bg-zinc-900/90 hover:bg-zinc-900 text-xs sm:text-sm text-zinc-100 placeholder-zinc-400 rounded-lg border border-zinc-700/80 focus:border-red-500 focus:ring-1 focus:ring-red-500/40 focus:outline-none transition-colors shadow-inner"
          />
          <div className="absolute right-2 flex items-center gap-1">
            {carregando ? (
              <Loader2 className="w-3.5 h-3.5 text-red-500 animate-spin" />
            ) : termo ? (
              <button
                type="button"
                onClick={handleLimpar}
                className="p-0.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-800/80 border border-zinc-700 rounded select-none pointer-events-none">
                ⌘K
              </kbd>
            )}
          </div>
        </div>
      </div>

      {/* Modal / Barra Expansível Mobile quando acionado */}
      {mobileAtivo && (
        <div className="md:hidden fixed inset-x-0 top-0 z-50 bg-zinc-950/95 backdrop-blur-md p-3 border-b border-zinc-800 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2 max-w-lg mx-auto">
            <div className="relative flex-1 flex items-center">
              <Search className="w-4 h-4 absolute left-3 text-zinc-400 pointer-events-none" />
              <input
                ref={inputMobileRef}
                id="input-busca-global-mobile"
                type="text"
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                onKeyDown={handleKeyDownInput}
                placeholder="Buscar cliente, CPF ou placa..."
                className="w-full pl-9 pr-9 py-2 bg-zinc-900 text-sm text-zinc-100 placeholder-zinc-400 rounded-xl border border-zinc-700 focus:border-red-500 focus:ring-1 focus:ring-red-500/50 focus:outline-none shadow-inner"
              />
              {carregando ? (
                <Loader2 className="w-4 h-4 text-red-500 animate-spin absolute right-3" />
              ) : termo ? (
                <button
                  type="button"
                  onClick={handleLimpar}
                  className="absolute right-2.5 p-1 text-zinc-400 hover:text-zinc-200"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => {
                setMobileAtivo(false);
                setDropdownAberto(false);
              }}
              className="px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-900 rounded-xl border border-zinc-800"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Painel Dropdown de Resultados */}
      {dropdownAberto && termo.trim() && (
        <div
          id="dropdown-busca-global"
          className={`
            absolute top-full mt-2 z-50 bg-zinc-900/98 backdrop-blur-xl border border-zinc-700/90 rounded-2xl shadow-2xl overflow-hidden
            ${mobileAtivo ? 'fixed inset-x-2 top-16 md:absolute md:inset-auto md:top-full' : 'right-0 md:left-0 md:right-auto'}
            w-[calc(100vw-1rem)] sm:w-[480px] lg:w-[560px] max-h-[75vh] sm:max-h-[500px] flex flex-col animate-in fade-in slide-in-from-top-2 duration-150
          `}
        >
          {/* Cabeçalho do Dropdown */}
          <div className="px-4 py-2.5 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-zinc-400">
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
              <span>
                Resultados para <strong className="text-white">"{termo}"</strong>
              </span>
            </div>
            {!carregando && (
              <span className="text-[11px] font-semibold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700/60">
                {totalEncontrados} {totalEncontrados === 1 ? 'encontrado' : 'encontrados'}
              </span>
            )}
          </div>

          {/* Conteúdo com Scroll */}
          <div className="overflow-y-auto flex-1 divide-y divide-zinc-800/80 p-2 space-y-3">
            {carregando && !resultados && (
              <div className="py-8 flex flex-col items-center justify-center text-zinc-400 gap-2">
                <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
                <span className="text-xs">Buscando na base de dados...</span>
              </div>
            )}

            {!carregando && resultados && totalEncontrados === 0 && (
              <div className="py-8 px-4 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400 mb-3 border border-zinc-700">
                  <Search className="w-5 h-5 text-zinc-400" />
                </div>
                <h4 className="text-sm font-bold text-zinc-200">Nenhum resultado encontrado</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  Não encontramos nenhum cliente com este nome/CPF ou veículo com esta placa.
                </p>
                <p className="text-[11px] text-zinc-400 mt-2">
                  Dica: Para placas, tente digitar sem traço (ex: <strong className="text-zinc-300">ABC1234</strong> ou <strong className="text-zinc-300">BRA2E19</strong>).
                </p>
              </div>
            )}

            {/* Seção 1: Clientes Encontrados */}
            {resultados && resultados.clientes.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Clientes ({resultados.clientes.length})
                  </span>
                  <span className="text-[10px] text-zinc-400 normal-case font-normal">
                    Clique para abrir a ficha do cliente
                  </span>
                </div>

                <div className="space-y-1">
                  {resultados.clientes.map((c, idx) => {
                    const itemLinearIdx = idx;
                    const estaFocado = indiceFoco === itemLinearIdx;

                    return (
                      <div
                        key={c.id}
                        onClick={() => handleEscolherCliente(c)}
                        onMouseEnter={() => setIndiceFoco(itemLinearIdx)}
                        className={`group px-3 py-2.5 rounded-xl cursor-pointer transition flex items-center justify-between gap-3 border ${
                          estaFocado
                            ? 'bg-blue-950/40 border-blue-600/60 shadow-md'
                            : 'bg-zinc-950/50 hover:bg-zinc-800/70 border-zinc-800/80 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-xs shrink-0">
                            {c.nome.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs sm:text-sm text-zinc-100 group-hover:text-blue-300 transition truncate">
                                {c.nome}
                              </span>
                              {c.cpf_cnpj && (
                                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/90 px-1.5 py-0.5 rounded border border-zinc-700/60 shrink-0">
                                  CPF/CNPJ: {formatCpfCnpj(c.cpf_cnpj)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-400 flex-wrap">
                              {(c.whatsapp || c.telefone) && (
                                <span className="flex items-center gap-1 text-zinc-300">
                                  <Phone className="w-3 h-3 text-emerald-400" />
                                  {formatPhone(c.whatsapp || c.telefone)}
                                </span>
                              )}
                              <span className="text-zinc-400">
                                {c.total_veiculos || 0} {c.total_veiculos === 1 ? 'veículo' : 'veículos'}
                              </span>
                              <span className="text-zinc-400">
                                • {c.total_os || 0} {c.total_os === 1 ? 'OS gerada' : 'OS geradas'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-blue-400 group-hover:text-blue-300 shrink-0 text-xs font-semibold">
                          <span className="hidden sm:inline text-[11px]">Ver ficha</span>
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Seção 2: Veículos Encontrados */}
            {resultados && resultados.veiculos.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5" /> Veículos ({resultados.veiculos.length})
                  </span>
                  <span className="text-[10px] text-zinc-400 normal-case font-normal">
                    Clique para abrir o histórico do veículo
                  </span>
                </div>

                <div className="space-y-1">
                  {resultados.veiculos.map((v, vIdx) => {
                    const itemLinearIdx = (resultados.clientes.length || 0) + vIdx;
                    const estaFocado = indiceFoco === itemLinearIdx;

                    return (
                      <div
                        key={v.id}
                        onClick={() => handleEscolherVeiculo(v)}
                        onMouseEnter={() => setIndiceFoco(itemLinearIdx)}
                        className={`group px-3 py-2.5 rounded-xl cursor-pointer transition flex items-center justify-between gap-3 border ${
                          estaFocado
                            ? 'bg-amber-950/40 border-amber-600/60 shadow-md'
                            : 'bg-zinc-950/50 hover:bg-zinc-800/70 border-zinc-800/80 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Mini Placa Estilizada */}
                          <div className="shrink-0 flex flex-col items-center bg-zinc-900 border border-zinc-600 rounded-md overflow-hidden shadow-sm px-2 py-0.5 min-w-[76px] text-center">
                            <div className="w-full bg-blue-700 text-[8px] text-white font-bold leading-tight px-1 rounded-sm">
                              BRASIL
                            </div>
                            <span className="font-mono font-black text-xs text-white tracking-wider mt-0.5">
                              {formatPlaca(v.placa)}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs sm:text-sm text-zinc-100 group-hover:text-amber-300 transition truncate">
                                {v.marca} {v.veiculo}
                              </span>
                              {v.ano && (
                                <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700/50">
                                  {v.ano}
                                </span>
                              )}
                              {v.cor && (
                                <span className="text-[10px] text-zinc-400 capitalize">
                                  • {v.cor}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400 flex-wrap">
                              <span className="text-zinc-300 truncate">
                                <strong>Dono:</strong> {v.cliente_nome}
                              </span>
                              {v.total_os !== undefined && (
                                <span className="text-zinc-400 shrink-0">
                                  • {v.total_os} {v.total_os === 1 ? 'OS' : 'OS'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-amber-400 group-hover:text-amber-300 shrink-0 text-xs font-semibold">
                          <span className="hidden sm:inline text-[11px]">Ver histórico</span>
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Rodapé informativo */}
          <div className="px-4 py-2 bg-zinc-950/90 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="hidden sm:inline">
              Use as teclas <kbd className="px-1 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-300">↑</kbd> <kbd className="px-1 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-300">↓</kbd> para navegar e <kbd className="px-1 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-300">Enter</kbd> para abrir
            </span>
            <span className="sm:hidden text-zinc-400">Toque em um resultado para abrir</span>
            <button
              type="button"
              onClick={() => setDropdownAberto(false)}
              className="text-zinc-400 hover:text-zinc-200 transition underline underline-offset-2"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

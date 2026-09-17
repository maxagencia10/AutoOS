import React, { useState } from 'react';
import { Car, X, AlertCircle, Loader2, CheckCircle2, User, Gauge, Sparkles, Wand2 } from 'lucide-react';
import { VeiculoRepository } from '../services/dbRepository';
import { Cliente, Veiculo } from '../types';
import { formatCpfCnpj, formatPhone, formatPlaca } from '../utils/formatters';
import { detectarMarcaPorModelo, CATALOGO_VEICULOS } from '../utils/veiculoMarcas';

interface ModalCadastroVeiculoRapidoProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: Cliente;
  onVeiculoCadastrado: (novoVeiculo: Veiculo) => void;
}

export const ModalCadastroVeiculoRapido: React.FC<ModalCadastroVeiculoRapidoProps> = ({
  isOpen,
  onClose,
  cliente,
  onVeiculoCadastrado,
}) => {
  const [veiculo, setVeiculo] = useState('');
  const [marca, setMarca] = useState('');
  const [marcaDetectada, setMarcaDetectada] = useState<string | null>(null);
  const [marcaEditadaManualmente, setMarcaEditadaManualmente] = useState(false);
  const [placa, setPlaca] = useState('');
  const [ano, setAno] = useState<number>(new Date().getFullYear());
  const [cor, setCor] = useState('');
  const [quilometragem, setQuilometragem] = useState<number>(0);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  if (!isOpen) return null;

  const handleVeiculoChange = (valor: string) => {
    setVeiculo(valor);
    const deteccao = detectarMarcaPorModelo(valor);
    if (deteccao) {
      setMarcaDetectada(deteccao.marca);
      // Preenche a marca automaticamente se ainda não foi editada manualmente ou se estava vazia
      if (!marcaEditadaManualmente || !marca || marca === marcaDetectada) {
        setMarca(deteccao.marca);
      }
    } else {
      if (!valor.trim()) {
        setMarcaDetectada(null);
      }
    }
  };

  const forcarDeteccaoMarca = () => {
    const deteccao = detectarMarcaPorModelo(veiculo);
    if (deteccao) {
      setMarca(deteccao.marca);
      setMarcaDetectada(deteccao.marca);
      setMarcaEditadaManualmente(false);
    } else {
      setErro('Não foi possível identificar automaticamente a marca para este modelo. Digite manualmente.');
      setTimeout(() => setErro(''), 4000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!veiculo.trim() || !marca.trim() || !placa.trim()) {
      setErro('Preencha os campos obrigatórios: Veículo, Marca e Placa.');
      return;
    }

    setSalvando(true);
    setErro('');

    try {
      const novo = await VeiculoRepository.create({
        cliente_id: cliente.id,
        veiculo: veiculo.trim(),
        marca: marca.trim(),
        placa: placa.trim().toUpperCase(),
        ano: Number(ano) || new Date().getFullYear(),
        cor: cor.trim(),
        quilometragem: Number(quilometragem) || 0,
      });

      onVeiculoCadastrado(novo);
      onClose();
    } catch (err: any) {
      setErro(err.message || 'Erro ao cadastrar veículo. Verifique se a placa já existe.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-700/90 rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl relative my-6 flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Cadastrar Veículo do Cliente
              </h3>
              <p className="text-xs text-zinc-400">
                Adicione um novo ou mais um veículo vinculado a este cliente
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ficha do Cliente Selecionado */}
        <div className="my-3.5 p-3 bg-zinc-950/90 border border-zinc-800 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-xs shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-zinc-400 font-medium">Proprietário vinculado:</div>
              <div className="text-sm font-bold text-zinc-100 truncate">{cliente.nome}</div>
              <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                {cliente.cpf_cnpj && <span>CPF: {formatCpfCnpj(cliente.cpf_cnpj)}</span>}
                {(cliente.whatsapp || cliente.telefone) && (
                  <span>• Tel: {formatPhone(cliente.whatsapp || cliente.telefone)}</span>
                )}
              </div>
            </div>
          </div>
          <span className="px-2 py-1 bg-emerald-950/60 border border-emerald-800/80 rounded-md text-emerald-400 font-semibold text-[11px] shrink-0">
            Cliente Ativo
          </span>
        </div>

        {/* Mensagem de Erro */}
        {erro && (
          <div className="mb-3.5 p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* Formulário do Veículo */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-zinc-300 font-semibold">
                  Veículo (Modelo / Versão) <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Marca identificada automaticamente ao digitar</span>
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  list="modelos-sugeridos-rapido"
                  placeholder="Ex: Civic 2.0 EXL, Gol 1.6 MSI, Onix Plus..."
                  value={veiculo}
                  onChange={(e) => handleVeiculoChange(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50"
                />
                <datalist id="modelos-sugeridos-rapido">
                  {CATALOGO_VEICULOS.slice(0, 100).map((c) => (
                    <option key={`${c.modelo}-${c.marca}`} value={c.modelo}>
                      {c.marca}
                    </option>
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-zinc-300 font-semibold">
                  Marca / Montadora <span className="text-red-500">*</span>
                </label>
                {marcaDetectada && (
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-950/60 border border-emerald-800/80 px-1.5 py-0.5 rounded">
                    <Sparkles className="w-2.5 h-2.5" />
                    Automática
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ex: Honda, Volkswagen, Toyota, Fiat..."
                  value={marca}
                  onChange={(e) => {
                    setMarca(e.target.value);
                    setMarcaEditadaManualmente(true);
                  }}
                  className={`w-full px-3 py-2 bg-zinc-950 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 ${
                    marcaDetectada && !marcaEditadaManualmente ? 'border-emerald-700/80 ring-1 ring-emerald-500/30' : 'border-zinc-700'
                  }`}
                />
              </div>
              {marcaDetectada && !marcaEditadaManualmente && (
                <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                  <span>✓ Montadora <strong>{marcaDetectada}</strong> detectada pelo modelo</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                Placa do Carro <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={8}
                placeholder="BRA2E19 ou ABC-1234"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">
                Ano (Fabricação/Modelo)
              </label>
              <input
                type="number"
                min={1950}
                max={2035}
                value={ano}
                onChange={(e) => setAno(parseInt(e.target.value, 10) || new Date().getFullYear())}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">Cor Predominante</label>
              <input
                type="text"
                placeholder="Ex: Prata, Preto, Branco, Cinza..."
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-zinc-300 font-semibold mb-1 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-red-400" />
                <span>Quilometragem Atual (KM)</span>
              </label>
              <input
                type="number"
                min={0}
                placeholder="Ex: 85000"
                value={quilometragem || ''}
                onChange={(e) => setQuilometragem(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500 font-mono"
              />
              <span className="text-[11px] text-zinc-400 mt-1 block">
                Essa quilometragem será automaticamente preenchida nesta Ordem de Serviço.
              </span>
            </div>
          </div>

          {/* Dica de usabilidade */}
          <div className="p-2.5 bg-zinc-950/80 rounded-xl border border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Ao salvar, o veículo será imediatamente selecionado na OS sem você perder nenhum dado preenchido.
            </span>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold rounded-lg shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
              {salvando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cadastrando Veículo...</span>
                </>
              ) : (
                <>
                  <Car className="w-4 h-4" />
                  <span>Salvar e Selecionar na OS</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

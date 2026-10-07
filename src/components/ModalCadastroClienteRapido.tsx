import React, { useState } from 'react';
import { User, X, AlertCircle, Loader2, CheckCircle2, Phone, Mail, MapPin, Search } from 'lucide-react';
import { ClienteRepository } from '../services/dbRepository';
import { Cliente } from '../types';
import { formatCpfCnpj, formatPhone } from '../utils/formatters';
import { consultarCep, formatarCep } from '../utils/cep';

interface ModalCadastroClienteRapidoProps {
  isOpen: boolean;
  onClose: () => void;
  onClienteCadastrado: (novoCliente: Cliente) => void;
}

export const ModalCadastroClienteRapido: React.FC<ModalCadastroClienteRapidoProps> = ({
  isOpen,
  onClose,
  onClienteCadastrado,
}) => {
  const [nome, setNome] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [mesmoNumeroWhatsapp, setMesmoNumeroWhatsapp] = useState(true);
  const [email, setEmail] = useState('');
  
  // Endereço
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');

  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  if (!isOpen) return null;

  const handleTelefoneChange = (val: string) => {
    const formatted = formatPhone(val);
    setTelefone(formatted);
    if (mesmoNumeroWhatsapp) {
      setWhatsapp(formatted);
    }
  };

  const handleBuscarCep = async () => {
    const limpo = cep.replace(/\D/g, '');
    if (limpo.length !== 8) {
      setErro('Informe um CEP válido com 8 dígitos para consultar.');
      return;
    }

    setBuscandoCep(true);
    setErro('');
    try {
      const endereco = await consultarCep(limpo);
      setCep(formatarCep(endereco.cep));
      setLogradouro(endereco.logradouro || logradouro);
      setBairro(endereco.bairro || bairro);
      setCidade(endereco.cidade || cidade);
      setEstado(endereco.estado || estado);
    } catch (err: any) {
      setErro(err.message || 'Erro ao consultar CEP.');
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErro('O nome completo do cliente é obrigatório.');
      return;
    }

    setSalvando(true);
    setErro('');

    try {
      const novo = await ClienteRepository.create({
        oficina_id: 'oficina_matriz',
        nome: nome.trim(),
        cpf_cnpj: cpfCnpj.trim(),
        telefone: telefone.trim(),
        whatsapp: mesmoNumeroWhatsapp ? (whatsapp.trim() || telefone.trim()) : whatsapp.trim(),
        email: email.trim().toLowerCase(),
        cep: cep.trim(),
        logradouro: logradouro.trim(),
        numero: numero.trim(),
        complemento: complemento.trim(),
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        estado: estado.trim().toUpperCase(),
      });

      onClienteCadastrado(novo);
      onClose();
    } catch (err: any) {
      setErro(err.message || 'Erro ao cadastrar cliente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-700/90 rounded-2xl max-w-xl w-full p-3 sm:p-6 shadow-2xl relative my-auto sm:my-6 flex flex-col max-h-[94dvh] sm:max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">Cadastrar Novo Cliente</h3>
              <p className="text-[11px] sm:text-xs text-zinc-400">Cadastro rápido para vinculação imediata à Ordem de Serviço</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition cursor-pointer shrink-0"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensagem de Erro */}
        {erro && (
          <div className="mt-3 p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* Formulário com scroll */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Nome e CPF/CNPJ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Nome Completo / Razão Social <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="Ex: João da Silva ou Silva & Filhos Ltda"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                CPF ou CNPJ
              </label>
              <input
                type="text"
                placeholder="000.000.000-00"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Telefones e Email */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Telefone / Celular
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="(11) 98888-7777"
                  value={telefone}
                  onChange={(e) => handleTelefoneChange(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-300">WhatsApp</label>
                <label className="text-[10px] text-zinc-400 flex items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={mesmoNumeroWhatsapp}
                    onChange={(e) => {
                      setMesmoNumeroWhatsapp(e.target.checked);
                      if (e.target.checked) setWhatsapp(telefone);
                    }}
                    className="rounded border-zinc-700 bg-zinc-800 text-red-600 w-3 h-3"
                  />
                  <span>Mesmo do celular</span>
                </label>
              </div>
              <input
                type="text"
                disabled={mesmoNumeroWhatsapp}
                placeholder="(11) 98888-7777"
                value={whatsapp}
                onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-red-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                E-mail (opcional)
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  placeholder="cliente@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Seção Endereço */}
          <div className="border-t border-zinc-800/80 pt-3 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span>Endereço (Opcional)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-400 mb-1">CEP</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="00000-000"
                    value={cep}
                    onChange={(e) => setCep(formatarCep(e.target.value))}
                    onBlur={() => {
                      if (cep.replace(/\D/g, '').length === 8 && !logradouro) {
                        handleBuscarCep();
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="button"
                    onClick={handleBuscarCep}
                    disabled={buscandoCep}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition shrink-0"
                    title="Buscar endereço pelo CEP"
                  >
                    {buscandoCep ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">Buscar</span>
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-400 mb-1">Logradouro / Rua</label>
                <input
                  type="text"
                  placeholder="Rua, Avenida, Praça..."
                  value={logradouro}
                  onChange={(e) => setLogradouro(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Número</label>
                <input
                  type="text"
                  placeholder="123 ou S/N"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Complemento</label>
                <input
                  type="text"
                  placeholder="Apto, Bloco..."
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Bairro</label>
                <input
                  type="text"
                  placeholder="Bairro"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Cidade / UF</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Cidade"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className="flex-1 min-w-0 px-2.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
                  />
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="UF"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value.toUpperCase())}
                    className="w-12 px-1 text-center py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm uppercase font-mono focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botões de Ação - Sempre Visíveis e Fixos */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2.5 shrink-0 sticky bottom-0 bg-zinc-900/98 backdrop-blur-md z-10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-zinc-300 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-950 transition disabled:opacity-50 cursor-pointer"
            >
              {salvando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cadastrando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar e Selecionar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

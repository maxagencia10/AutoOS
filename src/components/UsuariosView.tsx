import React, { useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  User,
  Wrench,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  AlertCircle,
  Search,
  Loader2,
  Phone,
  MapPin,
} from 'lucide-react';
import { Usuario, PerfilUsuario } from '../types';
import { UsuarioRepository } from '../services/dbRepository';
import { useAuth } from '../context/AuthContext';
import { consultarCep, formatarCep } from '../utils/cep';
import { formatPhone } from '../utils/formatters';

export const UsuariosView: React.FC = () => {
  const { usuariosDisponiveis, usuarioAtual, recarregarUsuarios, trocarUsuario } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cep: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    perfil: 'MECANICO' as PerfilUsuario,
    ativo: true,
  });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);

  const handleBuscarCep = async (cepInput?: string) => {
    const alvo = cepInput || formData.cep;
    setErro('');
    try {
      setBuscandoCep(true);
      const res = await consultarCep(alvo);
      setFormData((prev) => ({
        ...prev,
        cep: res.cep,
        logradouro: res.logradouro || prev.logradouro,
        bairro: res.bairro || prev.bairro,
        cidade: res.cidade || prev.cidade,
        estado: res.estado || prev.estado,
      }));
    } catch (err: any) {
      setErro(err.message || 'Erro ao buscar CEP.');
    } finally {
      setBuscandoCep(false);
    }
  };

  const abrirModalNovo = () => {
    setUsuarioEditando(null);
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      cep: '',
      logradouro: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      perfil: 'MECANICO',
      ativo: true,
    });
    setErro('');
    setModalOpen(true);
  };

  const abrirModalEditar = (u: Usuario) => {
    setUsuarioEditando(u);
    setFormData({
      nome: u.nome,
      email: u.email,
      telefone: u.telefone || '',
      cep: u.cep || '',
      logradouro: u.logradouro || '',
      numero: u.numero || '',
      bairro: u.bairro || '',
      cidade: u.cidade || '',
      estado: u.estado || '',
      perfil: u.perfil,
      ativo: u.ativo,
    });
    setErro('');
    setModalOpen(true);
  };

  const salvarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim() || !formData.email.trim()) {
      setErro('Nome e e-mail são obrigatórios.');
      return;
    }

    setSalvando(true);
    setErro('');
    try {
      if (usuarioEditando) {
        await UsuarioRepository.update(usuarioEditando.id, formData);
      } else {
        await UsuarioRepository.create(formData);
      }
      await recarregarUsuarios();
      setModalOpen(false);
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar usuário.');
    } finally {
      setSalvando(false);
    }
  };

  const excluirUsuario = async (id: string, nome: string) => {
    if (id === usuarioAtual?.id) {
      alert('Você não pode excluir o usuário com o qual está conectado atualmente.');
      return;
    }
    if (!confirm(`Deseja realmente remover o usuário "${nome}"?`)) {
      return;
    }
    try {
      await UsuarioRepository.delete(id);
      await recarregarUsuarios();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir usuário.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Cabeçalho */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-red-500" />
            <span>Controle de Usuários e Perfis de Acesso</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Defina quem tem permissão de Administrador (gestão total, cancelamento) ou Mecânico (abertura e execução de OS).
          </p>
        </div>

        <button
          onClick={abrirModalNovo}
          id="btn-novo-usuario"
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-lg text-sm font-semibold shadow-md shadow-red-950 transition border border-red-500"
        >
          <UserPlus className="w-4 h-4" />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-zinc-950 text-zinc-400 uppercase text-[11px] font-semibold border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3">Nome do Usuário</th>
                <th className="px-4 py-3">E-mail de Acesso</th>
                <th className="px-4 py-3">Perfil de Acesso</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {usuariosDisponiveis.map((u) => {
                const isCurrent = u.id === usuarioAtual?.id;
                return (
                  <tr key={u.id} className="hover:bg-zinc-800/40 transition">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
                          {u.perfil === 'ADMINISTRADOR' ? (
                            <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                          ) : (
                            <Wrench className="w-3.5 h-3.5 text-amber-400" />
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-white">{u.nome}</span>
                          {isCurrent && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-red-600/20 text-red-400 border border-red-500/30">
                              Conectado Agora
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-zinc-300 font-mono text-xs">{u.email}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          u.perfil === 'ADMINISTRADOR'
                            ? 'bg-red-950/60 text-red-400 border border-red-800/60'
                            : 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                        }`}
                      >
                        {u.perfil}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 text-xs ${
                          u.ativo ? 'text-emerald-400 font-medium' : 'text-zinc-500'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.ativo ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => trocarUsuario(u.id)}
                          className="px-2.5 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
                          title="Simular login com este usuário"
                        >
                          Usar Perfil
                        </button>
                        <button
                          onClick={() => abrirModalEditar(u)}
                          className="p-1.5 text-zinc-400 hover:text-white rounded transition"
                          title="Editar Usuário"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => excluirUsuario(u.id, u.nome)}
                          disabled={isCurrent}
                          className="p-1.5 text-zinc-500 hover:text-red-400 rounded transition disabled:opacity-30"
                          title="Remover Usuário"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cadastro/Edição de Usuário */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-bold text-white">
                  {usuarioEditando ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {erro && (
              <div className="mb-4 p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            <form onSubmit={salvarUsuario} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Mecânico Chefe"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    placeholder="usuario@oficina.com.br"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500 text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Endereço / CEP do Colaborador */}
              <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80 space-y-3">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  Endereço do Usuário (Opcional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-zinc-400 font-medium mb-1">CEP</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="00000-000"
                        maxLength={9}
                        value={formData.cep}
                        onChange={(e) => {
                          const formatado = formatarCep(e.target.value);
                          setFormData({ ...formData, cep: formatado });
                          if (formatado.replace(/\D/g, '').length === 8) {
                            handleBuscarCep(formatado);
                          }
                        }}
                        className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500 font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleBuscarCep()}
                        disabled={buscandoCep}
                        title="Buscar CEP"
                        className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg border border-zinc-700 transition shrink-0"
                      >
                        {buscandoCep ? (
                          <Loader2 className="w-3.5 h-3.5 text-red-400 animate-spin" />
                        ) : (
                          <Search className="w-3.5 h-3.5 text-zinc-300" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-zinc-400 font-medium mb-1">Rua / Logradouro</label>
                    <input
                      type="text"
                      placeholder="Rua..."
                      value={formData.logradouro}
                      onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-medium mb-1">Bairro</label>
                    <input
                      type="text"
                      placeholder="Bairro"
                      value={formData.bairro}
                      onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-medium mb-1">Cidade</label>
                    <input
                      type="text"
                      placeholder="Cidade"
                      value={formData.cidade}
                      onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-medium mb-1">UF</label>
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="UF"
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500 font-mono uppercase text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Perfil de Acesso</label>
                <select
                  value={formData.perfil}
                  onChange={(e) => setFormData({ ...formData, perfil: e.target.value as PerfilUsuario })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-500 font-bold"
                >
                  <option value="ADMINISTRADOR">ADMINISTRADOR (Acesso total + cancelamento + oficina)</option>
                  <option value="MECANICO">MECÂNICO (Abertura, edição e execução de OS)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="user-ativo"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="rounded border-zinc-700 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="user-ativo" className="text-zinc-300 font-medium cursor-pointer">
                  Usuário Ativo no Sistema
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-zinc-300 hover:text-white bg-zinc-800 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-semibold rounded-lg shadow transition disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Salvar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

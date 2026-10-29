import React, { useState, useEffect } from 'react';
import {
  Wrench,
  FileText,
  Users,
  Car,
  LayoutDashboard,
  Settings,
  Database,
  ShieldCheck,
  PlusCircle,
  HardDrive,
  ArrowUpCircle,
  HelpCircle,
  Sun,
  Moon,
  Sparkles,
  Building2,
  ChevronDown,
  Menu,
  X,
  Crown,
  Lock,
  LogOut,
  Key,
  Store,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { BuscaGlobalNavbar } from './BuscaGlobalNavbar';
import { Cliente, Veiculo } from '../types';
import { verificarPacotesPastaAtualizacoes } from '../services/atualizacaoScanner';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onNovaOS: () => void;
  onAbrirTour?: () => void;
  onSelectCliente?: (cliente: Cliente) => void;
  onSelectVeiculo?: (veiculo: Veiculo) => void;
  onAbrirLoginAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onNovaOS,
  onAbrirTour,
  onSelectCliente,
  onSelectVeiculo,
  onAbrirLoginAdmin,
}) => {
  const {
    usuarioAtual,
    usuariosDisponiveis,
    trocarUsuario,
    isAdmin,
    isSuperAdmin,
    oficinaAtiva,
    oficinasDisponiveis,
    selecionarOficina,
    logout,
    testarLoginLojista,
    setModalCadastroAdminLojaAberto,
  } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [totalPacotesDisponiveis, setTotalPacotesDisponiveis] = useState<number>(0);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  useEffect(() => {
    let ativo = true;
    const checar = async () => {
      try {
        const info = await verificarPacotesPastaAtualizacoes();
        if (ativo && info && info.totalPacotes) {
          setTotalPacotesDisponiveis(info.totalPacotes);
        }
      } catch {}
    };

    checar();
    const interval = setInterval(checar, 15000);
    return () => {
      ativo = false;
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'os', label: 'Ordens de Serviço', icon: FileText },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'veiculos', label: 'Veículos', icon: Car },
    { id: 'usuarios', label: 'Usuários da Loja', icon: ShieldCheck, adminOnly: true },
    ...(isSuperAdmin
      ? [
          { id: 'admin_geral', label: 'Admin Geral (SaaS)', icon: Crown, master: true },
          { id: 'empresas', label: 'Lojas (SaaS)', icon: Building2, master: true },
          { id: 'atualizacoes', label: 'Atualizações', icon: ArrowUpCircle, master: true, badge: totalPacotesDisponiveis },
        ]
      : []),
    { id: 'configuracoes', label: 'Oficina (Ajustes)', icon: Settings },
    { id: 'backup', label: 'Backup & Banco', icon: HardDrive, adminOnly: true },
  ];

  const handleNavegar = (id: string) => {
    if ((id === 'admin_geral' || id === 'empresas' || id === 'atualizacoes') && !isSuperAdmin) {
      onSelectTab('dashboard');
      setMenuMobileAberto(false);
      return;
    }

    if (id === 'usuarios' && !isAdmin) {
      setMenuMobileAberto(false);
      return;
    }

    onSelectTab(id);
    setMenuMobileAberto(false);
  };

  return (
    <header className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-40 shadow-xl no-print">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          
          {/* Logo & Marca da Aplicação */}
          <div className="flex items-center gap-2 cursor-pointer select-none shrink-0" onClick={() => handleNavegar('dashboard')}>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-md shadow-red-950 border border-red-500/30 shrink-0">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-white font-mono leading-tight">
                AUTO<span className="text-red-500">OS</span>
              </span>
              <p className="text-[9px] sm:text-[10px] text-zinc-400 font-medium hidden sm:block leading-none mt-0.5">
                Micro-SaaS
              </p>
            </div>
          </div>

          {/* Navegação Desktop Principal (Rolagem Suave para Telas Médias) */}
          <nav className="hidden xl:flex items-center space-x-1 overflow-x-auto py-1 scrollbar-none">
            {navItems.map((item) => {
              if (item.adminOnly && !isAdmin) return null;
              const Icon = item.icon;
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => handleNavegar(item.id)}
                  className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-red-600/15 text-red-400 border border-red-500/30 shadow-sm'
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-900 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-red-400' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <span className="ml-1 px-1.5 py-0.2 bg-emerald-500 text-zinc-950 font-bold text-[10px] rounded-full animate-pulse shadow-sm">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Ações e Controles Responsivos à Direita */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {onSelectCliente && onSelectVeiculo && (
              <BuscaGlobalNavbar
                onSelectCliente={onSelectCliente}
                onSelectVeiculo={onSelectVeiculo}
              />
            )}

            {/* Alternador de Fundo Claro / Escuro */}
            <button
              id="btn-navbar-tema"
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Modo Dia' : 'Modo Noite'}
              aria-label="Alternar Tema"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-semibold transition shrink-0 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700 cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
            </button>

            {/* Botão Destaque Admin Geral / Portal Master Micro-SaaS (Exclusivo SuperAdmin) */}
            {isSuperAdmin && (
              <button
                id="btn-navbar-admin-geral"
                type="button"
                onClick={() => handleNavegar('admin_geral')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-1.5 rounded-lg text-xs font-bold transition shadow-md cursor-pointer shrink-0 ${
                  currentTab === 'admin_geral'
                    ? 'bg-amber-500 text-zinc-950 border border-amber-400 shadow-amber-950/60'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow-amber-950/30'
                }`}
                title="Painel Geral do Micro-SaaS (Super Admin Master)"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Admin Geral (SaaS)</span>
                <span className="sm:hidden">Master</span>
              </button>
            )}

            {/* Botão Nova OS em Destaque */}
            <button
              id="btn-navbar-nova-os"
              onClick={onNovaOS}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-1.5 rounded-lg bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-950 transition border border-red-500 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline">Nova OS</span>
              <span className="sm:hidden">OS</span>
            </button>

            {/* Seletor de Empresa / Oficina Ativa (Super Admin pode alternar; Lojista vê apenas a sua própria loja fixa) */}
            {isSuperAdmin ? (
              <div className="relative group shrink-0 hidden md:block">
                <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-300">
                  <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <select
                    aria-label="Selecionar Oficina Ativa"
                    className="bg-transparent text-zinc-300 text-xs focus:outline-none cursor-pointer max-w-[100px] lg:max-w-[130px] truncate"
                    value={oficinaAtiva?.id || ''}
                    onChange={(e) => selecionarOficina(e.target.value)}
                  >
                    {oficinasDisponiveis.map((o) => (
                      <option key={o.id} value={o.id} className="bg-zinc-900 text-zinc-100">
                        {o.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              oficinaAtiva && (
                <div className="hidden md:flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 shrink-0">
                  <Building2 className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="font-bold truncate max-w-[120px] lg:max-w-[170px] text-zinc-100">
                    {oficinaAtiva.nome}
                  </span>
                </div>
              )
            )}

            {/* Alternador de Usuário (Exclusivo do SuperAdmin para testes) */}
            {isSuperAdmin && (
              <div className="relative group shrink-0 hidden lg:block">
                <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-300">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <select
                    aria-label="Alternar Usuário e Perfil"
                    className="bg-transparent text-zinc-300 text-xs focus:outline-none cursor-pointer max-w-[100px] xl:max-w-[120px] truncate"
                    value={usuarioAtual?.id || ''}
                    onChange={(e) => trocarUsuario(e.target.value)}
                  >
                    {usuariosDisponiveis.map((u) => (
                      <option key={u.id} value={u.id} className="bg-zinc-900 text-zinc-100">
                        {u.nome.split(' ')[0]} ({u.perfil === 'SUPERADMIN' ? 'SaaS' : u.perfil === 'ADMINISTRADOR' ? 'Admin' : 'Mec'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Botão de Cadastro do Lojista (quando for Administrador da loja) */}
            {usuarioAtual?.perfil === 'ADMINISTRADOR' && (
              <button
                type="button"
                onClick={() => setModalCadastroAdminLojaAberto(true)}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-600/15 hover:bg-red-600/25 text-red-300 border border-red-500/30 text-xs font-semibold transition cursor-pointer shrink-0"
                title="Conferir ou alterar os dados do Administrador da Loja e endereço da oficina"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden xl:inline">Cadastro da Loja</span>
                <span className="xl:hidden">Minha Loja</span>
              </button>
            )}

            {/* Botão Testar / Entrar como Lojista (para quem quer testar ou trocar de conta) */}
            <button
              type="button"
              onClick={() => testarLoginLojista(oficinaAtiva?.id || '')}
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 hover:border-amber-500/50 text-xs transition cursor-pointer shrink-0"
              title="Abrir tela de login para entrar com usuário e senha do lojista"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-semibold">Login Lojista</span>
            </button>

            {/* Botão Sair / Logout */}
            <button
              type="button"
              id="btn-navbar-logout"
              onClick={() => logout()}
              className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/60 text-zinc-400 hover:text-red-300 border border-zinc-800 hover:border-red-800/60 text-xs transition cursor-pointer shrink-0"
              title="Sair do sistema e ir para a tela de login"
            >
              <LogOut className="w-3.5 h-3.5 text-zinc-400 hover:text-red-400" />
              <span className="hidden xl:inline text-[11px]">Sair</span>
            </button>

            {/* Botão Menu Hamburger para Mobile e Tablets (< xl) */}
            <button
              type="button"
              id="btn-navbar-menu-mobile"
              onClick={() => setMenuMobileAberto(!menuMobileAberto)}
              className="xl:hidden p-1.5 rounded-lg bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 cursor-pointer shrink-0"
              title="Menu Principal"
              aria-label="Abrir Menu de Navegação"
            >
              {menuMobileAberto ? <X className="w-5 h-5 text-red-400" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>
        
        {/* Barra de Navegação Rápida Superior em Telas Menores */}
        <div className="xl:hidden flex overflow-x-auto py-1.5 gap-1 border-t border-zinc-800/80 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavegar(item.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-red-600/20 text-red-400 font-bold border border-red-500/30'
                    : item.master
                    ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30'
                    : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/50'
                }`}
              >
                <Icon className={`w-3 h-3 ${item.master ? 'text-amber-400' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Gaveta / Drawer Mobile Completa com Todas as Opções */}
      {menuMobileAberto && (
        <div className="xl:hidden fixed inset-x-0 top-24 bottom-0 z-50 bg-black/90 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4 max-w-md mx-auto shadow-2xl">
            
            {/* Seletor de Empresa e Perfil na Gaveta Mobile */}
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2.5">
              {isSuperAdmin && oficinasDisponiveis.length > 0 ? (
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Empresa / Oficina Ativa (SaaS)
                  </label>
                  <select
                    className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-500"
                    value={oficinaAtiva?.id || ''}
                    onChange={(e) => {
                      selecionarOficina(e.target.value);
                    }}
                  >
                    {oficinasDisponiveis.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.nome}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                oficinaAtiva && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-red-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase font-bold">Oficina Conectada</span>
                      <span className="text-white font-bold text-xs truncate block">{oficinaAtiva.nome}</span>
                    </div>
                  </div>
                )
              )}

              {isSuperAdmin ? (
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Usuário Conectado
                  </label>
                  <select
                    className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-500"
                    value={usuarioAtual?.id || ''}
                    onChange={(e) => trocarUsuario(e.target.value)}
                  >
                    {usuariosDisponiveis.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nome} ({u.perfil})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                usuarioAtual && (
                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase font-bold">Usuário</span>
                      <span className="text-zinc-200 text-xs font-semibold">{usuarioAtual.nome}</span>
                    </div>
                    <span className="text-[10px] font-bold bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
                      {usuarioAtual.perfil}
                    </span>
                  </div>
                )
              )}
            </div>

            {/* Banner de Acesso Rápido Admin Geral na Gaveta (Exclusivo SuperAdmin) */}
            {isSuperAdmin && (
              <div className="p-3 bg-gradient-to-r from-amber-500/15 to-zinc-950 rounded-xl border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-amber-300">Administração Geral (SaaS)</p>
                    <p className="text-[10px] text-zinc-400">Gerenciar todas as oficinas e lojas</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMenuMobileAberto(false);
                    onSelectTab('admin_geral');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs cursor-pointer shrink-0"
                >
                  Abrir Painel
                </button>
              </div>
            )}

            {/* Menu Completo de Páginas */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2 mb-1">
                Navegação do Sistema
              </div>
              {navItems.map((item) => {
                if (item.adminOnly && !isAdmin) return null;
                const Icon = item.icon;
                const active = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavegar(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer ${
                      active
                        ? 'bg-red-600/20 text-red-400 font-bold border border-red-500/40'
                        : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-zinc-400" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && item.badge > 0 ? (
                      <span className="px-2 py-0.5 bg-emerald-500 text-zinc-950 font-bold text-[10px] rounded-full">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Roteiro Tour no Mobile */}
            {onAbrirTour && (
              <button
                onClick={() => {
                  setMenuMobileAberto(false);
                  onAbrirTour();
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>Como Usar (Guia Passo a Passo)</span>
              </button>
            )}

            {/* Ações de Lojista no Mobile */}
            {usuarioAtual?.perfil === 'ADMINISTRADOR' && (
              <button
                onClick={() => {
                  setMenuMobileAberto(false);
                  setModalCadastroAdminLojaAberto(true);
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-red-600/15 border border-red-500/30 text-red-300 text-xs font-bold cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-red-400" />
                <span>Meu Cadastro de Lojista (Editar Loja e Senha)</span>
              </button>
            )}

            <button
              onClick={() => {
                setMenuMobileAberto(false);
                testarLoginLojista(oficinaAtiva?.id || '');
              }}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-amber-300 text-xs font-semibold cursor-pointer"
            >
              <Key className="w-4 h-4 text-amber-400" />
              <span>Entrar / Fazer Login como Lojista</span>
            </button>

            {/* Botão Sair / Logout Mobile */}
            <button
              onClick={() => {
                setMenuMobileAberto(false);
                logout();
              }}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-zinc-900 hover:bg-red-950/40 border border-zinc-800 hover:border-red-800 text-zinc-300 hover:text-red-300 text-xs font-semibold cursor-pointer transition"
            >
              <LogOut className="w-4 h-4 text-zinc-400" />
              <span>Sair do Sistema (Fazer Logout)</span>
            </button>

            <button
              onClick={() => setMenuMobileAberto(false)}
              className="w-full p-2 text-center text-xs text-zinc-500 hover:text-zinc-300"
            >
              Fechar Menu
            </button>

          </div>
        </div>
      )}
    </header>
  );
};


import React from 'react';
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BuscaGlobalNavbar } from './BuscaGlobalNavbar';
import { Cliente, Veiculo } from '../types';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onNovaOS: () => void;
  onAbrirTour?: () => void;
  onSelectCliente?: (cliente: Cliente) => void;
  onSelectVeiculo?: (veiculo: Veiculo) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onNovaOS,
  onAbrirTour,
  onSelectCliente,
  onSelectVeiculo,
}) => {
  const { usuarioAtual, usuariosDisponiveis, trocarUsuario, isAdmin } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'os', label: 'Ordens de Serviço', icon: FileText },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'veiculos', label: 'Veículos', icon: Car },
    { id: 'configuracoes', label: 'Oficina', icon: Settings, adminOnly: true },
    { id: 'usuarios', label: 'Usuários', icon: ShieldCheck, adminOnly: true },
    { id: 'backup', label: 'Backup & Banco', icon: HardDrive },
    { id: 'atualizacoes', label: 'Atualizações', icon: ArrowUpCircle, adminOnly: true },
  ];

  return (
    <header className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-40 shadow-xl no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Marca da Aplicação */}
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none shrink-0" onClick={() => onSelectTab('dashboard')}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-950 border border-red-500/30 shrink-0">
              <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-white font-mono leading-tight">
                  AUTO<span className="text-red-500">OS</span>
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-zinc-400 font-medium hidden sm:block leading-none mt-0.5">Gestão de Oficina Mecânica</p>
            </div>
          </div>

          {/* Navegação Principal */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5 overflow-x-auto py-1 max-w-[50%] lg:max-w-none scrollbar-none">
            {navItems.map((item) => {
              if (item.adminOnly && !isAdmin) return null;
              const Icon = item.icon;
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-red-600/15 text-red-400 border border-red-500/30 shadow-sm'
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-900 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0 ${active ? 'text-red-400' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Busca Global & Ações Rápidas & Usuário */}
          <div className="flex items-center gap-2 shrink-0">
            {onSelectCliente && onSelectVeiculo && (
              <BuscaGlobalNavbar
                onSelectCliente={onSelectCliente}
                onSelectVeiculo={onSelectVeiculo}
              />
            )}

            {onAbrirTour && (
              <button
                id="btn-navbar-tour"
                onClick={onAbrirTour}
                title="Roteiro Guiado: Aprenda como usar em 3 passos"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 text-xs sm:text-sm font-semibold transition shrink-0 shadow-sm"
              >
                <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Como Usar (Tour)</span>
                <span className="sm:hidden">Guia</span>
              </button>
            )}

            <button
              id="btn-navbar-nova-os"
              onClick={onNovaOS}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-red-950 transition-all border border-red-500 whitespace-nowrap shrink-0"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>Nova OS</span>
            </button>

            {/* Alternador de Usuário (Simulador Real de Perfis) */}
            <div className="relative group shrink-0">
              <div className="flex items-center gap-1.5 sm:gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-2 sm:px-2.5 py-1.5 text-xs text-zinc-300 hover:border-zinc-700 transition">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <div className="text-left hidden lg:block">
                  <div className="font-semibold text-zinc-200 truncate max-w-[110px]">
                    {usuarioAtual?.nome.split(' ')[0] || 'Usuário'}
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {usuarioAtual?.perfil === 'ADMINISTRADOR' ? 'Admin' : 'Mecânico'}
                  </div>
                </div>
                <select
                  aria-label="Alternar Usuário e Perfil"
                  className="bg-transparent text-zinc-300 text-xs focus:outline-none cursor-pointer max-w-[90px] sm:max-w-[120px] lg:max-w-none truncate"
                  value={usuarioAtual?.id || ''}
                  onChange={(e) => trocarUsuario(e.target.value)}
                >
                  {usuariosDisponiveis.map((u) => (
                    <option key={u.id} value={u.id} className="bg-zinc-900 text-zinc-100">
                      {u.nome.split(' ')[0]} ({u.perfil === 'ADMINISTRADOR' ? 'Admin' : 'Mecânico'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

          </div>
        </div>
        
        {/* Navegação Mobile */}
        <div className="md:hidden flex overflow-x-auto py-2 gap-1 border-t border-zinc-800 scrollbar-none">
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap ${
                  active
                    ? 'bg-red-600/20 text-red-400 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};

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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onNovaOS: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onNovaOS,
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
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-950 border border-red-500/30">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white font-mono">
                  AUTO<span className="text-red-500">OS</span>
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">Gestão de Oficina Mecânica</p>
            </div>
          </div>

          {/* Navegação Principal */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5">
            {navItems.map((item) => {
              if (item.adminOnly && !isAdmin) return null;
              const Icon = item.icon;
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                    active
                      ? 'bg-red-600/15 text-red-400 border border-red-500/30 shadow-sm'
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-900 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-red-400' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Ações Rápidas & Usuário */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              id="btn-navbar-nova-os"
              onClick={onNovaOS}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-red-950 transition-all border border-red-500"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nova OS</span>
            </button>

            {/* Alternador de Usuário (Simulador Real de Perfis) */}
            <div className="relative group">
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:border-zinc-700 transition">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div className="text-left hidden sm:block">
                  <div className="font-semibold text-zinc-200 truncate max-w-[120px]">
                    {usuarioAtual?.nome.split(' ')[0] || 'Usuário'}
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {usuarioAtual?.perfil === 'ADMINISTRADOR' ? 'Admin' : 'Mecânico'}
                  </div>
                </div>
                <select
                  aria-label="Alternar Usuário e Perfil"
                  className="bg-transparent text-zinc-400 text-xs focus:outline-none cursor-pointer"
                  value={usuarioAtual?.id || ''}
                  onChange={(e) => trocarUsuario(e.target.value)}
                >
                  {usuariosDisponiveis.map((u) => (
                    <option key={u.id} value={u.id} className="bg-zinc-900 text-zinc-100">
                      {u.nome} ({u.perfil === 'ADMINISTRADOR' ? 'Admin' : 'Mecânico'})
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

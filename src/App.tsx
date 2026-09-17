import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { OrdensServicoView } from './components/OrdensServicoView';
import { ClientesView } from './components/ClientesView';
import { VeiculosView } from './components/VeiculosView';
import { ConfiguracoesView } from './components/ConfiguracoesView';
import { UsuariosView } from './components/UsuariosView';
import { BackupView } from './components/BackupView';
import { AtualizacoesView } from './components/AtualizacoesView';
import { NovaOrdemServicoModal } from './components/NovaOrdemServicoModal';
import { VisualizacaoOSModal } from './components/VisualizacaoOSModal';
import { InstalacaoWizard } from './components/InstalacaoWizard';
import { GuiaPassoAPasso } from './components/GuiaPassoAPasso';
import { Cliente, Veiculo, OrdemServico } from './types';

function MainApp() {
  const { isInstalado, carregando, recarregarUsuarios } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Controle de Modais
  const [novaOSAberta, setNovaOSAberta] = useState(false);
  const [osParaEditar, setOsParaEditar] = useState<OrdemServico | null>(null);
  const [osParaVisualizar, setOsParaVisualizar] = useState<OrdemServico | null>(null);
  const [clientePreselecionado, setClientePreselecionado] = useState<Cliente | null>(null);
  const [veiculoPreselecionado, setVeiculoPreselecionado] = useState<Veiculo | null>(null);

  // Registro direcionado pela Busca Global no Navbar
  const [clienteParaAbrir, setClienteParaAbrir] = useState<Cliente | null>(null);
  const [veiculoParaAbrir, setVeiculoParaAbrir] = useState<Veiculo | null>(null);

  // Roteiro Guiado Passo a Passo para Novos Usuários
  const [tourAberto, setTourAberto] = useState<boolean>(() => {
    // Inicia aberto na primeira utilização para direcionar o usuário simples
    return localStorage.getItem('autoos_tour_visto') !== 'true';
  });
  const [etapaTour, setEtapaTour] = useState<number>(0);

  const abrirTour = (etapaInicial: number = 0) => {
    setEtapaTour(etapaInicial);
    setTourAberto(true);
  };

  const handleNavegarParaCliente = (cliente: Cliente) => {
    setClienteParaAbrir(cliente);
    setCurrentTab('clientes');
  };

  const handleNavegarParaVeiculo = (veiculo: Veiculo) => {
    setVeiculoParaAbrir(veiculo);
    setCurrentTab('veiculos');
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 gap-3">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wide text-zinc-500">Inicializando AutoOS (PostgreSQL)...</span>
      </div>
    );
  }

  // Se o sistema ainda não foi instalado ou foi zerado para nova instalação,
  // apresenta o assistente de instalação com opção de cadastrar administrador e oficina.
  if (!isInstalado) {
    return <InstalacaoWizard onInstalacaoConcluida={() => recarregarUsuarios()} />;
  }

  const abrirNovaOS = (cli?: Cliente | null, veic?: Veiculo | null) => {
    setOsParaEditar(null);
    setClientePreselecionado(cli || null);
    setVeiculoPreselecionado(veic || null);
    setNovaOSAberta(true);
  };

  const abrirEditarOS = (os: OrdemServico) => {
    setOsParaVisualizar(null);
    setOsParaEditar(os);
    setNovaOSAberta(true);
  };

  const abrirVisualizarOS = (os: OrdemServico) => {
    setOsParaVisualizar(os);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased selection:bg-red-600 selection:text-white">
      {/* Barra de Navegação */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onNovaOS={() => abrirNovaOS()}
        onAbrirTour={() => abrirTour(0)}
        onSelectCliente={handleNavegarParaCliente}
        onSelectVeiculo={handleNavegarParaVeiculo}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <Dashboard
            onNovaOS={() => abrirNovaOS()}
            onNovoCliente={() => setCurrentTab('clientes')}
            onNovoVeiculo={() => setCurrentTab('veiculos')}
            onVerTodasOS={() => setCurrentTab('os')}
            onVisualizarOS={abrirVisualizarOS}
            onAbrirTour={abrirTour}
          />
        )}

        {currentTab === 'os' && (
          <OrdensServicoView
            onNovaOS={() => abrirNovaOS()}
            onVisualizarOS={abrirVisualizarOS}
            onEditarOS={abrirEditarOS}
          />
        )}

        {currentTab === 'clientes' && (
          <ClientesView
            onVisualizarOS={abrirVisualizarOS}
            onNovaOSParaCliente={(cliente) => abrirNovaOS(cliente, null)}
            onAbrirTour={abrirTour}
            clienteInicial={clienteParaAbrir}
            onLimparClienteInicial={() => setClienteParaAbrir(null)}
          />
        )}

        {currentTab === 'veiculos' && (
          <VeiculosView
            onVisualizarOS={abrirVisualizarOS}
            onNovaOSParaVeiculo={(veiculo) => abrirNovaOS(null, veiculo)}
            onAbrirTour={abrirTour}
            veiculoInicial={veiculoParaAbrir}
            onLimparVeiculoInicial={() => setVeiculoParaAbrir(null)}
          />
        )}

        {currentTab === 'configuracoes' && (
          <ConfiguracoesView onIrParaAtualizacoes={() => setCurrentTab('atualizacoes')} />
        )}

        {currentTab === 'usuarios' && <UsuariosView />}

        {currentTab === 'backup' && <BackupView />}

        {currentTab === 'atualizacoes' && <AtualizacoesView />}
      </main>

      {/* Modal de Abertura / Edição de Ordem de Serviço */}
      {novaOSAberta && (
        <NovaOrdemServicoModal
          osParaEditar={osParaEditar}
          clientePreselecionado={clientePreselecionado}
          veiculoPreselecionado={veiculoPreselecionado}
          onClose={() => {
            setNovaOSAberta(false);
            setOsParaEditar(null);
            setClientePreselecionado(null);
            setVeiculoPreselecionado(null);
          }}
          onSuccess={(osSalva) => {
            setNovaOSAberta(false);
            setOsParaEditar(null);
            setClientePreselecionado(null);
            setVeiculoPreselecionado(null);
            // Imediatamente abre para visualização e impressão da OS gerada
            abrirVisualizarOS(osSalva);
          }}
        />
      )}

      {/* Modal de Visualização Completa da OS (A4 / Impressão / WhatsApp) */}
      {osParaVisualizar && (
        <VisualizacaoOSModal
          os={osParaVisualizar}
          onClose={() => setOsParaVisualizar(null)}
          onEditar={(os) => {
            abrirEditarOS(os);
          }}
          onOSAtualizada={(osAtualizada) => {
            setOsParaVisualizar(osAtualizada);
          }}
        />
      )}

      {/* Tour Guiado Passo a Passo (1. Cliente -> 2. Veículo -> 3. OS) */}
      <GuiaPassoAPasso
        isOpen={tourAberto}
        onClose={() => {
          setTourAberto(false);
          try {
            localStorage.setItem('autoos_tour_visto', 'true');
          } catch {
            // storage indisponível
          }
        }}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onAbrirNovaOS={() => abrirNovaOS()}
        etapaInicial={etapaTour}
      />

      {/* Rodapé do Sistema */}
      <footer className="border-t border-zinc-900 py-4 text-center text-xs text-zinc-400 no-print mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>AutoOS • Sistema Profissional de Ordem de Serviço para Oficinas Mecânicas</span>
          <span className="text-zinc-400 text-[11px]">Todos os direitos reservados</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

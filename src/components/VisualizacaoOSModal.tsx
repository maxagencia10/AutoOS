import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Share2,
  Edit2,
  CheckCircle,
  XCircle,
  Clock,
  Car,
  User,
  Wrench,
  DollarSign,
  AlertTriangle,
  FileCheck,
  Building2,
  Calendar,
  MessageSquare,
  Download,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { OrdemServico, OficinaConfig, StatusOS, HistoricoStatus } from '../types';
import {
  OficinaRepository,
  OrdemServicoRepository,
} from '../services/dbRepository';
import { DocumentoOSImpressao } from './DocumentoOSImpressao';
import { ModalEnvioWhatsAppOS } from './ModalEnvioWhatsAppOS';
import {
  formatDate,
  formatDateTime,
  getStatusBadgeInfo,
  buildWhatsAppLink,
} from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

interface VisualizacaoOSModalProps {
  os: OrdemServico;
  onClose: () => void;
  onEditar: (os: OrdemServico) => void;
  onOSAtualizada: (osAtualizada: OrdemServico) => void;
}

export const VisualizacaoOSModal: React.FC<VisualizacaoOSModalProps> = ({
  os: osInicial,
  onClose,
  onEditar,
  onOSAtualizada,
}) => {
  const { usuarioAtual, podeCancelarOS } = useAuth();
  const [os, setOs] = useState<OrdemServico>(osInicial);
  const [oficina, setOficina] = useState<OficinaConfig | null>(null);
  const [historico, setHistorico] = useState<HistoricoStatus[]>([]);

  // Modal de Cancelamento (Section 19)
  const [cancelModalAberto, setCancelModalAberto] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [erroCancelamento, setErroCancelamento] = useState('');
  const [cancelando, setCancelando] = useState(false);

  // Modal de Envio WhatsApp com PDF
  const [modalWhatsAppAberto, setModalWhatsAppAberto] = useState(false);

  // Alteração de Status
  const [alterandoStatus, setAlterandoStatus] = useState(false);

  useEffect(() => {
    carregarDados();
  }, [osInicial.id]);

  const carregarDados = async () => {
    try {
      const [ofi, hist, osAtual] = await Promise.all([
        OficinaRepository.get(),
        OrdemServicoRepository.getHistorico(osInicial.id),
        OrdemServicoRepository.getById(osInicial.id),
      ]);
      setOficina(ofi);
      setHistorico(hist);
      if (osAtual) setOs(osAtual);
    } catch (err) {
      console.error('Erro ao carregar detalhes da OS:', err);
    }
  };

  const handlePrint = () => {
    const docElement = document.getElementById('documento-ordem-servico-a4');
    if (!docElement) {
      window.print();
      return;
    }

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join('\n');

    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Ordem de Serviço Nº ${os.numero_formatado || os.id} - ${os.cliente_nome || 'Cliente'}</title>
  <base href="${window.location.origin}/">
  ${styles}
  <style>
    @page {
      size: A4 portrait;
      margin: 4mm 6mm;
    }
    html, body {
      background: #ffffff !important;
      color: #000000 !important;
      margin: 0 !important;
      padding: 0 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #documento-ordem-servico-a4 {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      border: none !important;
      box-shadow: none !important;
      padding: 0 !important;
    }
    .no-print {
      display: none !important;
    }
    @media print {
      .no-print-toolbar {
        display: none !important;
      }
    }
  </style>
</head>
<body style="background: #ffffff; padding: 6px;">
  <div class="no-print-toolbar" style="position: sticky; top: 0; background: #18181b; color: white; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; border-radius: 8px; margin-bottom: 16px; box-shadow: 0 4px 14px rgba(0,0,0,0.35); font-family: sans-serif; z-index: 99999;">
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="background: #dc2626; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 800; letter-spacing: 0.5px;">AUTO OS</span>
      <strong style="font-size: 14px;">Ordem de Serviço Nº ${os.numero_formatado || os.id}</strong>
      <span style="font-size: 12px; color: #a1a1aa;">(Formato Oficial A4)</span>
    </div>
    <div style="display: flex; gap: 8px;">
      <button onclick="window.print()" style="background: #dc2626; color: white; border: none; padding: 8px 20px; border-radius: 6px; font-weight: bold; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
        🖨️ Imprimir Agora
      </button>
      <button onclick="window.close()" style="background: #3f3f46; color: #f4f4f5; border: none; padding: 8px 14px; border-radius: 6px; font-size: 13px; cursor: pointer;">
        Fechar
      </button>
    </div>
  </div>
  ${docElement.outerHTML}
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 350);
    });
  </script>
</body>
</html>`;

    // Tenta abrir em janela dedicada (top-level, livre de restrições de iframe do preview)
    try {
      const printWin = window.open('', '_blank', 'width=950,height=900,menubar=no,toolbar=no,location=no,status=no');
      if (printWin) {
        printWin.document.open();
        printWin.document.write(htmlContent);
        printWin.document.close();
        printWin.focus();
        return;
      }
    } catch (e) {
      console.warn('Bloqueio ao abrir janela de impressão:', e);
    }

    // Se o navegador bloqueou popups, executa window.print() diretamente na página
    window.print();
  };

  const handleWhatsApp = () => {
    const link = buildWhatsAppLink(
      os.cliente_whatsapp || os.cliente_telefone,
      os.numero_formatado,
      os.cliente_nome,
      os.veiculo_modelo,
      os.veiculo_placa,
      os.total,
      os.status
    );
    window.open(link, '_blank');
  };

  const handleMudarStatus = async (novoStatus: StatusOS) => {
    if (novoStatus === 'CANCELADA') {
      setCancelModalAberto(true);
      return;
    }

    setAlterandoStatus(true);
    try {
      const osAtualizada = await OrdemServicoRepository.updateStatus(
        os.id,
        novoStatus,
        usuarioAtual?.id || 'user_admin',
        usuarioAtual?.nome || 'Administrador'
      );
      setOs(osAtualizada);
      onOSAtualizada(osAtualizada);

      // Celebração ao concluir OS
      if (novoStatus === 'CONCLUÍDA' || novoStatus === 'ENTREGUE') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status.');
    } finally {
      setAlterandoStatus(false);
    }
  };

  const handleConfirmarCancelamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivoCancelamento.trim()) {
      setErroCancelamento('O motivo do cancelamento é obrigatório.');
      return;
    }

    setCancelando(true);
    setErroCancelamento('');
    try {
      const osAtualizada = await OrdemServicoRepository.updateStatus(
        os.id,
        'CANCELADA',
        usuarioAtual?.id || 'user_admin',
        usuarioAtual?.nome || 'Administrador',
        motivoCancelamento.trim()
      );
      setOs(osAtualizada);
      onOSAtualizada(osAtualizada);
      setCancelModalAberto(false);
      carregarDados();
    } catch (err: any) {
      setErroCancelamento(err.message || 'Erro ao cancelar OS.');
    } finally {
      setCancelando(false);
    }
  };

  const badge = getStatusBadgeInfo(os.status);

  return (
    <div className="modal-visualizacao-os fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl relative my-6 max-h-[96vh] flex flex-col print:border-none print:shadow-none print:p-0 print:bg-white print:max-h-none print:w-full print:max-w-none print:rounded-none print:static">
        
        {/* Barra Superior de Ações (Oculta na Impressão) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text} border ${badge.border}`}
            >
              <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
              {os.status}
            </span>
            <span className="text-zinc-400 text-xs hidden sm:inline">
              Criada em {formatDate(os.data)} às {os.hora} por {os.usuario_responsavel_nome}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrint}
              id="btn-imprimir-os"
              title="Imprimir Ordem de Serviço Oficial A4"
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-lg text-xs font-bold shadow-md shadow-red-950 transition border border-red-500 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={() => setModalWhatsAppAberto(true)}
              id="btn-whatsapp-os"
              title="Enviar Ordem de Serviço via WhatsApp com anexo do PDF oficial"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-950 transition border border-emerald-500 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Enviar WhatsApp (com PDF)</span>
            </button>

            {os.status !== 'CANCELADA' && (
              <button
                onClick={() => onEditar(os)}
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition border border-zinc-700"
              >
                <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Editar</span>
              </button>
            )}

            {/* Dropdown de Fluxo de Status */}
            <div className="flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-800">
              <span className="text-[11px] text-zinc-400">Status:</span>
              <select
                disabled={alterandoStatus}
                value={os.status}
                onChange={(e) => handleMudarStatus(e.target.value as StatusOS)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value="ABERTA" className="bg-zinc-900">ABERTA</option>
                <option value="AGUARDANDO APROVAÇÃO" className="bg-zinc-900">AGUARDANDO APROVAÇÃO</option>
                <option value="APROVADA" className="bg-zinc-900">APROVADA</option>
                <option value="EM EXECUÇÃO" className="bg-zinc-900">EM EXECUÇÃO</option>
                <option value="CONCLUÍDA" className="bg-zinc-900">CONCLUÍDA</option>
                <option value="ENTREGUE" className="bg-zinc-900">ENTREGUE</option>
                <option value="CANCELADA" className="bg-zinc-900 text-red-400 font-bold">CANCELAR OS</option>
              </select>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Motivo do Cancelamento em Destaque (se cancelada) */}
        {os.status === 'CANCELADA' && (
          <div className="my-3 p-4 bg-red-950/70 border border-red-700 rounded-xl text-xs space-y-1 no-print">
            <div className="flex items-center gap-2 text-red-400 font-bold">
              <XCircle className="w-4 h-4" />
              <span>ORDEM DE SERVIÇO CANCELADA</span>
            </div>
            <p className="text-zinc-200">
              <strong>Motivo registrado:</strong> {os.motivo_cancelamento || 'Não informado.'}
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DOCUMENTO OFICIAL A4 PARA VISUALIZAÇÃO E IMPRESSÃO                       */}
        {/* Layout idêntico ao modelo Impérios Car (Preto, Vermelho e Branco)         */}
        {/* ========================================================================= */}
        <div className="overflow-y-auto flex-1 p-2 sm:p-4 print:p-0 bg-zinc-950/60 print:bg-white rounded-xl print:rounded-none shadow-xl print:shadow-none print:overflow-visible">
          <DocumentoOSImpressao os={os} oficina={oficina} />
        </div>

        {/* Histórico de Alterações de Status (Audit Trail - Section 18) */}
        {historico.length > 0 && (
          <div className="mt-4 pt-4 border-t border-zinc-800 text-xs no-print">
            <h4 className="text-zinc-400 font-semibold mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Histórico de Alterações de Status (Auditoria)</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {historico.map((h) => (
                <div key={h.id} className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-[11px] text-zinc-300">
                  <span className="font-semibold text-white">{h.status_anterior}</span> → <span className="font-bold text-red-400">{h.status_novo}</span>
                  <span className="text-zinc-500 ml-1.5">em {formatDateTime(h.criado_em)} por {h.usuario_nome}</span>
                  {h.motivo && <span className="text-red-400 ml-1">({h.motivo})</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal de Confirmação e Motivo do Cancelamento (Section 19) */}
        {cancelModalAberto && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4">
            <div className="bg-zinc-900 border border-red-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-red-500">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-bold text-white">Cancelar Ordem de Serviço</h3>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                Você está prestes a cancelar a <strong className="text-white font-mono">{os.numero_formatado}</strong>.
                De acordo com as diretrizes operacionais, é obrigatório registrar o motivo do cancelamento.
              </p>

              {erroCancelamento && (
                <div className="p-2.5 bg-red-950 border border-red-800 rounded text-red-300 text-xs">
                  {erroCancelamento}
                </div>
              )}

              <form onSubmit={handleConfirmarCancelamento} className="space-y-4">
                <div>
                  <label className="block text-zinc-300 text-xs font-semibold mb-1">
                    Motivo do Cancelamento <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Ex: Cliente desistiu do orçamento devido ao valor das peças; veículo vendido antes do início do serviço..."
                    value={motivoCancelamento}
                    onChange={(e) => setMotivoCancelamento(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCancelModalAberto(false)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={cancelando}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-bold rounded-lg shadow transition disabled:opacity-50"
                  >
                    {cancelando ? 'Cancelando...' : 'Confirmar Cancelamento'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Envio via WhatsApp com PDF */}
        {modalWhatsAppAberto && (
          <ModalEnvioWhatsAppOS
            os={os}
            oficina={oficina}
            onClose={() => setModalWhatsAppAberto(false)}
          />
        )}

      </div>
    </div>
  );
};

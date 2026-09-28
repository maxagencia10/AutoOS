import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  FileText,
  AlertCircle,
  Loader2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  FolderOpen,
  FolderCheck,
  ClipboardCheck,
  Image,
} from 'lucide-react';
import { OrdemServico, OficinaConfig } from '../types';
import { DocumentoOSImpressao } from './DocumentoOSImpressao';
import {
  buildOSFilename,
  buildWhatsAppOSMessage,
  generateOSPDFFromElement,
  triggerPDFDownload,
  formatPhoneForWhatsApp,
  savePDFToServerFolder,
  openPDFFolderInExplorer,
  copyOSImageToClipboard,
  getPDFFolderInfo,
  PDFResult,
} from '../utils/pdfGenerator';
import { OficinaRepository } from '../services/dbRepository';
import { formatPhone } from '../utils/formatters';

interface ModalEnvioWhatsAppOSProps {
  os: OrdemServico;
  oficina?: OficinaConfig | null;
  onClose: () => void;
}

export const ModalEnvioWhatsAppOS: React.FC<ModalEnvioWhatsAppOSProps> = ({
  os,
  oficina: oficinaProp,
  onClose,
}) => {
  const [oficina, setOficina] = useState<OficinaConfig | null>(oficinaProp || null);
  const [telefone, setTelefone] = useState<string>(os.cliente_whatsapp || os.cliente_telefone || '');
  const [gerandoPDF, setGerandoPDF] = useState<boolean>(true);
  const [pdfResult, setPdfResult] = useState<PDFResult | null>(null);
  const [erroPDF, setErroPDF] = useState<string>('');
  
  // Status do salvamento na pasta exclusiva
  const [salvandoPasta, setSalvandoPasta] = useState<boolean>(false);
  const [salvoNaPasta, setSalvoNaPasta] = useState<boolean>(false);
  const [caminhoPasta, setCaminhoPasta] = useState<string>('PDFs_Ordens_de_Servico');
  const [caminhoCompleto, setCaminhoCompleto] = useState<string>('');
  const [pastaAbertaSucesso, setPastaAbertaSucesso] = useState<boolean>(false);

  // Status de cópia de texto e imagem
  const [copiadoTexto, setCopiadoTexto] = useState<boolean>(false);
  const [copiandoImagem, setCopiandoImagem] = useState<boolean>(false);
  const [copiadoImagemSucesso, setCopiadoImagemSucesso] = useState<boolean>(false);
  const [compartilhado, setCompartilhado] = useState<boolean>(false);
  const [mensagemEnviadaGuia, setMensagemEnviadaGuia] = useState<boolean>(false);

  const docRef = useRef<HTMLDivElement>(null);
  const filename = buildOSFilename(os);
  const mensagemWhatsApp = buildWhatsAppOSMessage(os, oficina?.nome_fantasia || oficina?.nome || 'AutoOS Mecânica');

  useEffect(() => {
    if (!oficinaProp) {
      OficinaRepository.get().then((of) => setOficina(of)).catch(() => {});
    }
    getPDFFolderInfo().then((info) => {
      if (info.folder) setCaminhoPasta(info.folder);
    });
  }, [oficinaProp]);

  // Gera o PDF automaticamente e salva na pasta exclusiva 'PDFs_Ordens_de_Servico'
  useEffect(() => {
    let cancelado = false;

    const processarPDF = async () => {
      setGerandoPDF(true);
      setErroPDF('');
      try {
        // Aguarda 450ms para garantir carregamento de fontes e renderização do DOM
        await new Promise((r) => setTimeout(r, 450));
        if (cancelado) return;

        const targetElement = docRef.current || document.getElementById('documento-ordem-servico-a4');
        if (!targetElement) {
          throw new Error('Não foi possível localizar o documento da OS para gerar o PDF.');
        }

        const res = await generateOSPDFFromElement(targetElement, filename);
        if (cancelado) return;
        setPdfResult(res);

        // Salva automaticamente na pasta dedicada
        setSalvandoPasta(true);
        const saveRes = await savePDFToServerFolder(filename, res.blob);
        if (!cancelado) {
          if (saveRes.ok) {
            setSalvoNaPasta(true);
            if (saveRes.folder) setCaminhoPasta(saveRes.folder);
            if (saveRes.fullPath) setCaminhoCompleto(saveRes.fullPath);
          } else {
            console.warn('Aviso ao salvar na pasta local:', saveRes.error);
          }
        }
      } catch (err: any) {
        console.error('Erro ao gerar/salvar PDF da OS:', err);
        if (!cancelado) {
          setErroPDF(err.message || 'Falha ao processar o PDF da Ordem de Serviço.');
        }
      } finally {
        if (!cancelado) {
          setGerandoPDF(false);
          setSalvandoPasta(false);
        }
      }
    };

    processarPDF();

    return () => {
      cancelado = true;
    };
  }, [os.id, filename]);

  const handleCopiarMensagem = async () => {
    try {
      await navigator.clipboard.writeText(mensagemWhatsApp);
      setCopiadoTexto(true);
      setTimeout(() => setCopiadoTexto(false), 3000);
    } catch {
      // fallback
    }
  };

  const handleAbrirPastaWindows = async () => {
    const res = await openPDFFolderInExplorer();
    if (res.ok) {
      setPastaAbertaSucesso(true);
      setTimeout(() => setPastaAbertaSucesso(false), 4000);
    } else {
      alert('A pasta exclusiva é: ' + caminhoPasta + '\n\nSeu servidor local do AutoOS cria e mantém os arquivos salvos nela.');
    }
  };

  const handleCopiarImagemOS = async () => {
    const targetElement = docRef.current || document.getElementById('documento-ordem-servico-a4');
    if (!targetElement) return;

    setCopiandoImagem(true);
    try {
      const ok = await copyOSImageToClipboard(targetElement);
      if (ok) {
        setCopiadoImagemSucesso(true);
        setTimeout(() => setCopiadoImagemSucesso(false), 4000);
      } else {
        alert('Não foi possível copiar a imagem diretamente para a área de transferência. Use o arquivo PDF salvo na pasta exclusiva!');
      }
    } finally {
      setCopiandoImagem(false);
    }
  };

  const handleBaixarPDF = () => {
    if (!pdfResult) return;
    triggerPDFDownload(pdfResult.blob, filename);
  };

  const handleEnviarWhatsApp = async () => {
    const cleanPhone = formatPhoneForWhatsApp(telefone);
    if (!cleanPhone) {
      alert('Por favor, informe um número de WhatsApp válido do cliente (com DDD).');
      return;
    }

    // 1. Tenta compartilhamento nativo com o arquivo PDF anexado via Web Share API
    if (pdfResult && typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
      try {
        const shareData = {
          title: `Ordem de Serviço ${os.numero_formatado || os.id}`,
          text: mensagemWhatsApp,
          files: [pdfResult.file],
        };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          setCompartilhado(true);
          return;
        }
      } catch (e: any) {
        if (e.name === 'AbortError') return;
        console.warn('Web Share fallback:', e);
      }
    }

    // 2. Garante o salvamento local do arquivo e faz download preventivo
    if (pdfResult) {
      triggerPDFDownload(pdfResult.blob, filename);
    }

    // 3. Tenta abrir a pasta exclusiva no Windows para facilitar o arraste
    openPDFFolderInExplorer().catch(() => {});

    // 4. Abre a conversa no WhatsApp Web com o texto pré-digitado
    const whatsappUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(mensagemWhatsApp)}`;
    try {
      window.open(whatsappUrl, '_blank');
    } catch {
      window.location.href = whatsappUrl;
    }

    setMensagemEnviadaGuia(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto no-print">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative my-6 flex flex-col space-y-4">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Enviar Ordem de Serviço via WhatsApp
                </h2>
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 font-mono font-bold text-xs">
                  {os.numero_formatado || `#${os.id.slice(0, 6)}`}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Geração em PDF oficial de alta definição com pasta exclusiva no computador.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Destaque da Pasta Exclusiva para os PDFs das OS */}
        <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-2 border-emerald-500/40 rounded-xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <FolderCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white">
                    Pasta Exclusiva dos PDFs:
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-amber-300">
                    PDFs_Ordens_de_Servico
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1.5 flex-wrap">
                  <span>Arquivo:</span>
                  <strong className="text-white font-mono">{filename}</strong>
                  {gerandoPDF || salvandoPasta ? (
                    <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Gravando na pasta...
                    </span>
                  ) : salvoNaPasta ? (
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Salvo com Sucesso
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded font-medium">
                      PDF Pronto
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Ações da Pasta e Cópia */}
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                id="btn-abrir-pasta-pdf-windows"
                onClick={handleAbrirPastaWindows}
                title="Abre a pasta exclusiva no Windows Explorer para visualizar ou arrastar o arquivo"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 active:bg-amber-500/35 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                <FolderOpen className="w-4 h-4 text-amber-400" />
                <span>{pastaAbertaSucesso ? 'Pasta Aberta!' : 'Abrir Pasta no Windows'}</span>
              </button>

              <button
                type="button"
                onClick={handleBaixarPDF}
                disabled={gerandoPDF || !pdfResult}
                title="Baixar arquivo PDF diretamente no navegador"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-zinc-300 hover:text-white rounded-lg text-xs font-medium transition border border-zinc-700 disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Baixar</span>
              </button>
            </div>
          </div>

          {caminhoCompleto && (
            <p className="text-[10px] text-zinc-500 font-mono truncate border-t border-zinc-800 pt-1.5">
              Local: {caminhoCompleto}
            </p>
          )}
        </div>

        {erroPDF && (
          <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{erroPDF}</span>
          </div>
        )}

        {/* Campo do WhatsApp do Cliente */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-300">
            Número de WhatsApp do Cliente (com DDD):
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-500 font-mono">
                📱 +55
              </span>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full pl-16 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs sm:text-sm font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <span className="text-[11px] text-zinc-400 hidden sm:inline">
              Destinatário: <strong className="text-white">{os.cliente_nome}</strong>
            </span>
          </div>
        </div>

        {/* Pré-visualização do Texto e Botão de Cópia da OS */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-zinc-300">
              Mensagem com resumo dos serviços e valores:
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopiarImagemOS}
                disabled={copiandoImagem}
                title="Copia a imagem oficial da OS para você simplesmente colar (Ctrl+V) no WhatsApp Web!"
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-[11px] font-semibold transition cursor-pointer"
              >
                {copiadoImagemSucesso ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-blue-400" />
                    <span>Copiada! Cole com Ctrl+V</span>
                  </>
                ) : (
                  <>
                    <Image className="w-3.5 h-3.5" />
                    <span>{copiandoImagem ? 'Copiando...' : 'Copiar Imagem (Ctrl+V)'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopiarMensagem}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition cursor-pointer"
              >
                {copiadoTexto ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar texto</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 font-mono whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed border-l-4 border-l-emerald-500">
            {mensagemWhatsApp}
          </div>
        </div>

        {/* 3 Formas Práticas de Anexar a OS */}
        <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3.5 text-xs text-zinc-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-emerald-400">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Como anexar o documento no WhatsApp:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-zinc-300">
            <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800">
              <strong className="text-white block mb-0.5">📁 Método 1: Pasta Exclusiva (Arrastar)</strong>
              <span>
                O PDF já foi salvo na pasta <strong className="text-amber-300 font-mono">PDFs_Ordens_de_Servico</strong>. Ao abrir o WhatsApp, basta arrastar o arquivo para dentro da conversa!
              </span>
            </div>
            <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800">
              <strong className="text-white block mb-0.5">📋 Método 2: Colar Direto (Ctrl+V)</strong>
              <span>
                Clique no botão azul <strong className="text-blue-300">"Copiar Imagem"</strong> acima e, na janela do WhatsApp, pressione <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-white font-mono text-[10px]">Ctrl+V</kbd>. A OS anexa na hora!
              </span>
            </div>
          </div>
        </div>

        {/* Botões de Ação Inferiores */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition border border-zinc-700 cursor-pointer"
          >
            Fechar
          </button>

          <button
            type="button"
            onClick={handleAbrirPastaWindows}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-amber-300 hover:text-amber-200 rounded-xl text-xs font-bold transition border border-amber-500/40 cursor-pointer"
          >
            <FolderOpen className="w-4 h-4 text-amber-400" />
            <span>Abrir Pasta PDFs_OS</span>
          </button>

          <button
            type="button"
            id="btn-confirmar-envio-whatsapp"
            onClick={handleEnviarWhatsApp}
            disabled={gerandoPDF}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950 transition border border-emerald-500 disabled:opacity-50 cursor-pointer"
          >
            {gerandoPDF ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Preparando PDF na pasta...</span>
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4" />
                <span>Abrir WhatsApp & Anexar OS</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Renderização em segundo plano do documento para conversão em PDF e Imagem */}
      <div
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: '794px',
          zIndex: -1,
          opacity: 0,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        <div ref={docRef}>
          <DocumentoOSImpressao os={os} oficina={oficina} />
        </div>
      </div>
    </div>
  );
};

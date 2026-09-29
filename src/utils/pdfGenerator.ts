import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { OrdemServico } from '../types';
import { formatCurrency, formatPlaca } from './formatters';

export interface PDFResult {
  blob: Blob;
  file: File;
  filename: string;
  url: string;
}

/**
 * Sanitiza o nome do arquivo para padrão limpo (ex: OS_000001_Cliente_Nome.pdf)
 */
export function buildOSFilename(os: OrdemServico): string {
  const numero = (os.numero_formatado || String(os.numero || '1')).replace(/\D/g, '').padStart(6, '0');
  const cliente = (os.cliente_nome || 'Cliente')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .slice(0, 20);
  return `OS_${numero}_${cliente}.pdf`;
}

/**
 * Constrói a mensagem completa e estruturada da Ordem de Serviço para envio no WhatsApp
 */
export function buildWhatsAppOSMessage(os: OrdemServico, oficinaNome: string = 'AutoOS Mecânica'): string {
  const numero = os.numero_formatado || `#${os.id.slice(0, 6)}`;
  const cliente = os.cliente_nome || 'Cliente';
  const veiculo = os.veiculo_modelo || (os.veiculo_marca ? `${os.veiculo_marca} ${os.veiculo_modelo || ''}` : 'Veículo');
  const placa = formatPlaca(os.veiculo_placa || '');
  const km = os.quilometragem ? `${os.quilometragem.toLocaleString('pt-BR')} km` : '-';
  const total = formatCurrency(os.total || 0);

  // Lista os itens principais (peças e serviços) de forma resumida e organizada
  let itensTexto = '';
  if (os.itens && os.itens.length > 0) {
    itensTexto = '\n\n🔧 *Serviços e Peças:*';
    os.itens.slice(0, 8).forEach((item, idx) => {
      itensTexto += `\n${idx + 1}. ${item.descricao} (${item.quantidade}x) - ${formatCurrency(item.valor_total || 0)}`;
    });
    if (os.itens.length > 8) {
      itensTexto += `\n...e mais ${os.itens.length - 8} item(ns) no PDF detalhado.`;
    }
  }

  const garantiaTexto = os.garantia ? `\n🛡️ *Garantia:* ${os.garantia}` : '';

  return `🚗 *ORDEM DE SERVIÇO - ${oficinaNome.toUpperCase()}* 🚗

Olá, *${cliente}*! Tudo bem?
Segue o resumo da sua *${numero}*:

📋 *Status:* *${os.status}*
🚘 *Veículo:* ${veiculo}
🔢 *Placa:* ${placa}
⏱️ *Quilometragem:* ${km}${itensTexto}

💰 *VALOR TOTAL:* *${total}*${garantiaTexto}

📎 *Segue anexo o documento oficial em PDF com todos os detalhes e laudo técnico.*

Ficamos à disposição para qualquer dúvida!`;
}

/**
 * Gera um arquivo PDF de alta definição a partir do elemento DOM de impressão A4
 */
export async function generateOSPDFFromElement(
  element: HTMLElement,
  filename: string
): Promise<PDFResult> {
  // Configurações otimizadas para A4 (210mm x 297mm) com scale 2 para alta nitidez
  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 794,
      scrollX: 0,
      scrollY: 0,
      imageTimeout: 15000,
    });
  } catch (err: any) {
    console.warn('html2canvas primário falhou, tentando fallback com scale 1.5...', err);
    canvas = await html2canvas(element, {
      scale: 1.5,
      useCORS: false,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 794,
    });
  }

  if (!canvas || canvas.width === 0 || canvas.height === 0) {
    throw new Error('Falha ao capturar a imagem do documento da OS para gerar o PDF.');
  }

  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = 210; // largura A4 em mm
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  // Se o conteúdo ultrapassar 297mm (1 página A4), divide em páginas proporcionalmente
  const pageHeight = 297;
  let heightLeft = pdfHeight;
  let position = 0;

  pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - pdfHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;
  }

  const blob = pdf.output('blob');
  const file = new File([blob], filename, { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  return { blob, file, filename, url };
}

/**
 * Dispara o download direto do arquivo PDF no navegador
 */
export function triggerPDFDownload(blob: Blob, filename: string): void {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(link.href), 10000);
}

/**
 * Formata o telefone para link direto do WhatsApp (DDI 55 + DDD + Número limpo)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  let clean = (phone || '').replace(/\D/g, '');
  if (!clean) return '';
  if (clean.length === 10 || clean.length === 11) {
    clean = '55' + clean;
  }
  return clean;
}

export interface SaveServerResult {
  ok: boolean;
  folder?: string;
  folderName?: string;
  fullPath?: string;
  filename?: string;
  size?: number;
  message?: string;
  error?: string;
}

/**
 * Salva o arquivo PDF diretamente na pasta exclusiva 'PDFs_Ordens_de_Servico' do computador
 */
export async function savePDFToServerFolder(filename: string, blob: Blob): Promise<SaveServerResult> {
  try {
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const res = reader.result as string;
        const base64 = res.split(',')[1] || res;
        resolve(base64);
      };
      reader.onerror = reject;
    });
    reader.readAsDataURL(blob);
    const base64 = await base64Promise;

    const res = await fetch('/api/salvar-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, base64 }),
    });

    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json().catch(() => ({}));
    return { ok: false, error: errData.error || 'Falha na resposta do servidor local' };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Servidor local não acessível para salvar direto em pasta' };
  }
}

/**
 * Abre a pasta exclusiva de PDFs diretamente no Windows Explorer
 */
export async function openPDFFolderInExplorer(): Promise<{ ok: boolean; folder?: string; error?: string }> {
  try {
    const res = await fetch('/api/abrir-pasta-pdf', { method: 'POST' });
    if (res.ok) {
      return await res.json();
    }
    return { ok: false, error: 'Falha ao acionar explorador de arquivos' };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

/**
 * Obtém informações sobre a pasta exclusiva de PDFs
 */
export async function getPDFFolderInfo(): Promise<{ ok: boolean; folder?: string; folderName?: string }> {
  try {
    const res = await fetch('/api/pasta-pdf-info');
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return { ok: true, folderName: 'PDFs_Ordens_de_Servico' };
}

/**
 * Renderiza o documento da OS e copia como imagem PNG de alta resolução para a Área de Transferência.
 * Isso permite colar (Ctrl+V) diretamente no WhatsApp Web!
 */
export async function copyOSImageToClipboard(element: HTMLElement): Promise<boolean> {
  try {
    const canvas = await html2canvas(element, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 794,
    });

    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          resolve(false);
          return;
        }

        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({
                'image/png': blob,
              }),
            ]);
            resolve(true);
            return;
          } catch (e) {
            console.warn('Falha na escrita da imagem na área de transferência:', e);
          }
        }
        resolve(false);
      }, 'image/png');
    });
  } catch (err) {
    console.error('Erro ao copiar imagem da OS:', err);
    return false;
  }
}


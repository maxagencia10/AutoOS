import { jsPDF } from 'jspdf';
import { OrdemServico, OficinaConfig } from '../types';
import { formatCurrency, formatPlaca, formatDate } from './formatters';
import { PDFResult } from './pdfGenerator';

/**
 * Gera o documento oficial da Ordem de Serviço em PDF diretamente via jsPDF vetorial puro.
 * Não depende do DOM, não depende de canvas ou fontes carregadas.
 * 100% à prova de falhas em qualquer navegador ou ambiente.
 */
export function generateOSPDFVectorDirect(
  os: OrdemServico,
  oficina: OficinaConfig | null,
  filename: string
): PDFResult {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  // 1. Cabeçalho Esportivo Oficial AutoOS
  doc.setFillColor(18, 18, 22);
  doc.rect(margin, y, contentWidth, 28, 'F');

  // Faixa vermelha de destaque
  doc.setFillColor(220, 38, 38);
  doc.rect(margin, y, 4, 28, 'F');
  doc.rect(margin, y + 27, contentWidth, 1, 'F');

  // Nome da Oficina
  const nomeOficina = (oficina?.nome_fantasia || oficina?.nome || 'OFICINA MECÂNICA ESPECIALIZADA').toUpperCase();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(nomeOficina, margin + 8, y + 8);

  // Subtítulo e Contatos
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(212, 212, 216);

  const cnpj = oficina?.cnpj ? `CNPJ: ${oficina.cnpj}` : '';
  const whats = oficina?.whatsapp ? `WhatsApp: ${oficina.whatsapp}` : (oficina?.telefone ? `Tel: ${oficina.telefone}` : '');
  const endLinha = oficina?.logradouro ? `${oficina.logradouro}, ${oficina.numero || 's/n'}` : 'São Paulo - SP';

  doc.text([cnpj, whats].filter(Boolean).join('  |  '), margin + 8, y + 15);
  doc.text(endLinha, margin + 8, y + 21);

  // Número da OS em destaque no canto direito
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(239, 68, 68);
  const numOS = os.numero_formatado || `#${os.id.slice(0, 6)}`;
  doc.text(numOS, pageWidth - margin - 6, y + 11, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(161, 161, 170);
  doc.text(`Emissão: ${formatDate(os.data)} ${os.hora || ''}`, pageWidth - margin - 6, y + 18, { align: 'right' });

  // Status Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`Status: ${os.status}`, pageWidth - margin - 6, y + 24, { align: 'right' });

  y += 34;

  // 2. Bloco: Dados do Cliente e Veículo (Grid de 2 colunas)
  const colW = (contentWidth - 4) / 2;

  // Coluna Cliente
  doc.setFillColor(244, 244, 245);
  doc.rect(margin, y, colW, 30, 'F');
  doc.setDrawColor(228, 228, 231);
  doc.rect(margin, y, colW, 30, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(24, 24, 27);
  doc.text('DADOS DO CLIENTE', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(63, 63, 70);
  doc.text(`Nome: ${os.cliente_nome || 'Consumidor'}`, margin + 4, y + 12);
  doc.text(`Telefone: ${os.cliente_whatsapp || os.cliente_telefone || '-'}`, margin + 4, y + 17);
  doc.text(`Endereço: ${os.cliente_endereco || '-'}`, margin + 4, y + 22);
  doc.text(`CPF/CNPJ: ${os.cliente_cpf_cnpj || '-'}`, margin + 4, y + 27);

  // Coluna Veículo
  const colX2 = margin + colW + 4;
  doc.setFillColor(244, 244, 245);
  doc.rect(colX2, y, colW, 30, 'F');
  doc.setDrawColor(228, 228, 231);
  doc.rect(colX2, y, colW, 30, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(24, 24, 27);
  doc.text('DADOS DO VEÍCULO', colX2 + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(63, 63, 70);
  const veic = os.veiculo_modelo || (os.veiculo_marca ? `${os.veiculo_marca} ${os.veiculo_modelo || ''}` : 'Veículo');
  doc.text(`Veículo: ${veic}`, colX2 + 4, y + 12);
  doc.text(`Placa: ${formatPlaca(os.veiculo_placa || '')}`, colX2 + 4, y + 17);
  const kmStr = os.quilometragem ? `${os.quilometragem.toLocaleString('pt-BR')} km` : '-';
  doc.text(`Km: ${kmStr}  |  Ano: ${os.veiculo_ano || '-'}`, colX2 + 4, y + 22);
  doc.text(`Cor: ${os.veiculo_cor || '-'}`, colX2 + 4, y + 27);

  y += 35;

  // 3. Queixa / Relato do Cliente
  if (os.reclamacao_cliente || os.diagnostico_avaliacao) {
    doc.setFillColor(250, 250, 250);
    doc.rect(margin, y, contentWidth, 16, 'F');
    doc.setDrawColor(228, 228, 231);
    doc.rect(margin, y, contentWidth, 16, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(24, 24, 27);
    doc.text('RELATO / SOLICITAÇÃO DO CLIENTE:', margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(82, 82, 91);
    const relato = (os.reclamacao_cliente || os.diagnostico_avaliacao || '-').slice(0, 140);
    doc.text(relato, margin + 4, y + 11);

    y += 20;
  }

  // 4. Tabela de Itens (Peças e Serviços)
  doc.setFillColor(24, 24, 27);
  doc.rect(margin, y, contentWidth, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('DESCRIÇÃO DO SERVIÇO / PEÇA', margin + 4, y + 4.8);
  doc.text('TIPO', margin + 105, y + 4.8);
  doc.text('QTD', margin + 130, y + 4.8);
  doc.text('UNITÁRIO', margin + 150, y + 4.8);
  doc.text('TOTAL', pageWidth - margin - 4, y + 4.8, { align: 'right' });

  y += 7;

  // Linhas dos Itens
  const itens = os.itens && os.itens.length > 0 ? os.itens : [
    { descricao: 'Revisão e Manutenção Geral', tipo: 'SERVICO' as const, quantidade: 1, valor_unitario: os.total, valor_total: os.total }
  ];

  itens.forEach((item, idx) => {
    // Alternância de cor nas linhas
    if (idx % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(248, 248, 248);
    }
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setDrawColor(240, 240, 240);
    doc.line(margin, y + 7, margin + contentWidth, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(39, 39, 42);

    const desc = (item.descricao || 'Item de serviço').slice(0, 52);
    doc.text(desc, margin + 4, y + 4.8);
    doc.text(item.tipo === 'PECA' ? 'Peça' : 'Serviço', margin + 105, y + 4.8);
    doc.text(String(item.quantidade || 1), margin + 130, y + 4.8);
    doc.text(formatCurrency(item.valor_unitario || 0), margin + 150, y + 4.8);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(item.valor_total || 0), pageWidth - margin - 4, y + 4.8, { align: 'right' });

    y += 7;
  });

  y += 4;

  // 5. Totalizadores e Garantia
  doc.setFillColor(244, 244, 245);
  doc.rect(margin, y, contentWidth, 22, 'F');
  doc.setDrawColor(228, 228, 231);
  doc.rect(margin, y, contentWidth, 22, 'S');

  // Lado esquerdo: Garantia e Laudo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 24, 27);
  doc.text('TERMO DE GARANTIA & OBSERVAÇÕES:', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(82, 82, 91);
  const garantiaTxt = os.garantia || 'Garantia de 90 dias conforme artigo 26 do Código de Defesa do Consumidor.';
  doc.text(garantiaTxt, margin + 4, y + 12);
  doc.text('Veículo testado e inspecionado segundo normas técnicas vigentes.', margin + 4, y + 17);

  // Lado direito: Valor Total
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(82, 82, 91);
  doc.text('VALOR TOTAL DA OS:', pageWidth - margin - 45, y + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(220, 38, 38);
  doc.text(formatCurrency(os.total || 0), pageWidth - margin - 4, y + 16, { align: 'right' });

  y += 28;

  // 6. Campos de Assinatura (Cliente e Oficina)
  const signW = (contentWidth - 10) / 2;
  const signY = Math.max(y, 250);

  // Assinatura Oficina
  doc.setDrawColor(161, 161, 170);
  doc.line(margin + 6, signY + 12, margin + signW - 6, signY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(82, 82, 91);
  doc.text(nomeOficina, margin + signW / 2, signY + 16, { align: 'center' });
  doc.text('Responsável Técnico / Mecânico', margin + signW / 2, signY + 20, { align: 'center' });

  // Assinatura Cliente
  const signX2 = margin + signW + 10;
  doc.line(signX2 + 6, signY + 12, signX2 + signW - 6, signY + 12);
  doc.text(os.cliente_nome || 'Assinatura do Cliente', signX2 + signW / 2, signY + 16, { align: 'center' });
  doc.text('Declaro que retirei o veículo revisado e em ordem', signX2 + signW / 2, signY + 20, { align: 'center' });

  // Rodapé Oficial
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(161, 161, 170);
  doc.text('Documento gerado eletronicamente por AutoOS - Sistema de Gestão para Oficinas Mecânicas', pageWidth / 2, 288, { align: 'center' });

  const blob = doc.output('blob');
  const file = new File([blob], filename, { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  return { blob, file, filename, url };
}

import React from 'react';
import { OrdemServico, OficinaConfig } from '../types';
import { BannerCabecalhoOficial } from './BannerCabecalhoOficial';
import { BarraTituloOS } from './BarraTituloOS';

interface DocumentoOSProps {
  os: OrdemServico;
  oficina: OficinaConfig | null;
  modoCabecalho?: 'imagem' | 'editavel';
}

export const DocumentoOSImpressao: React.FC<DocumentoOSProps> = ({ os, oficina }) => {
  // Formatação de valores estilo brasileiro (ex: 800,00 ou 1.600,00)
  const formatMoeda = (val: number) => {
    return (val || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDataEmissao = (dataStr: string) => {
    if (!dataStr) return '11/09/2025';
    const parts = dataStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dataStr;
  };

  // Determinar número com padding de 6 dígitos (ex: 000125)
  const numeroFormatado = os.numero_formatado
    ? os.numero_formatado.replace(/\D/g, '').padStart(6, '0')
    : String(os.numero || 125).padStart(6, '0');

  // Valores padrão fiéis ao PDF caso campo esteja vazio
  const clienteNome = os.cliente_nome || 'Valter Marcelino da Silva Júnior';
  const clienteEndereco = os.cliente_endereco || 'Rua Valober, nº 464';
  const clienteCep = os.cliente_cep ? os.cliente_cep.replace(/\D/g, '') : '02442140';

  const veiculoModelo = os.veiculo_modelo || 'Renault Megane 1.6 16 válvulas';
  const veiculoAno = os.veiculo_ano || '2000';
  const veiculoCor = os.veiculo_cor || 'Cinza';

  const totalCalculado = os.total || os.subtotal || 1600.0;

  return (
    <div
      id="documento-ordem-servico-a4"
      className="w-full max-w-[794px] mx-auto bg-white text-black font-sans shadow-2xl print:shadow-none print:max-w-none print:w-full overflow-hidden border border-zinc-300 print:border-none"
      style={{ boxSizing: 'border-box' }}
    >
      {/* ========================================================================= */}
      {/* 1. CABEÇALHO DO DOCUMENTO (BANNER OFICIAL IMPÉRIOS CAR CONFORME ANEXO)    */}
      {/* ========================================================================= */}
      <BannerCabecalhoOficial oficina={oficina} />

      {/* ========================================================================= */}
      {/* CONTEÚDO PRINCIPAL COM MARGENS ALINHADAS IGUAIS AO PDF                    */}
      {/* ========================================================================= */}
      <div className="p-3.5 sm:p-5 space-y-3 bg-white text-black">
        
        {/* ======================================================================= */}
        {/* 2. BARRA DE TÍTULO OFICIAL (ORDEM DE SERVIÇO + Nº + DATA DE EMISSÃO)   */}
        {/* ======================================================================= */}
        <BarraTituloOS
          numeroOS={numeroFormatado}
          dataEmissao={formatDataEmissao(os.data)}
        />

        {/* ======================================================================= */}
        {/* 3. DADOS DO CLIENTE E DADOS DO VEÍCULO (2 COLUNAS IDÊNTICAS AO PDF)     */}
        {/* ======================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Caixa: DADOS DO CLIENTE */}
          <div className="border-2 border-black rounded-xl overflow-hidden flex flex-col">
            <div className="bg-black text-white px-3 py-1.5 flex items-center gap-2">
              {/* Ícone de Usuário Sólido Branco */}
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white text-white shrink-0">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              <span className="text-xs sm:text-[13px] font-black uppercase tracking-wider text-white">
                DADOS DO CLIENTE
              </span>
            </div>
            <div className="p-3 text-xs sm:text-sm text-black space-y-1.5 bg-white flex-1">
              <div className="flex items-baseline">
                <span className="font-bold w-20 shrink-0 text-black">Nome:</span>
                <span className="font-semibold text-black">{clienteNome}</span>
              </div>
              <div className="flex items-baseline">
                <span className="font-bold w-20 shrink-0 text-black">Endereço:</span>
                <span className="text-black font-normal">{clienteEndereco}</span>
              </div>
              <div className="flex items-baseline">
                <span className="font-bold w-20 shrink-0 text-black">CEP:</span>
                <span className="font-mono text-black font-normal">{clienteCep}</span>
              </div>
            </div>
          </div>

          {/* Caixa: DADOS DO VEÍCULO */}
          <div className="border-2 border-black rounded-xl overflow-hidden flex flex-col">
            <div className="bg-black text-white px-3 py-1.5 flex items-center gap-2">
              {/* Ícone de Veículo Frontal Sólido Branco */}
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white text-white shrink-0">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-4.66l.12-.34h13.77l.11.34V17z" />
                <circle cx="7.5" cy="14.5" r="1.5" />
                <circle cx="16.5" cy="14.5" r="1.5" />
              </svg>
              <span className="text-xs sm:text-[13px] font-black uppercase tracking-wider text-white">
                DADOS DO VEÍCULO
              </span>
            </div>
            <div className="p-3 text-xs sm:text-sm text-black space-y-1.5 bg-white flex-1">
              <div className="flex items-baseline">
                <span className="font-bold w-16 shrink-0 text-black">Veículo:</span>
                <span className="font-semibold text-black">{veiculoModelo}</span>
              </div>
              <div className="flex items-baseline">
                <span className="font-bold w-16 shrink-0 text-black">Ano:</span>
                <span className="font-mono text-black font-normal">{veiculoAno}</span>
              </div>
              <div className="flex items-baseline">
                <span className="font-bold w-16 shrink-0 text-black">Cor:</span>
                <span className="text-black font-normal">{veiculoCor}</span>
              </div>
            </div>
          </div>

        </div>

        {/* ======================================================================= */}
        {/* 4. TABELA DE SERVIÇOS PRESTADOS (EXATAMENTE COM A LINHA DE TOTAL DO PDF) */}
        {/* ======================================================================= */}
        <div className="border-2 border-black rounded-xl overflow-hidden">
          {/* Barra Superior Preta */}
          <div className="bg-black text-white px-3 py-1.5 flex items-center gap-2">
            {/* Ícone de Chave Mecânica Branco */}
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white text-white shrink-0">
              <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
            </svg>
            <span className="text-xs sm:text-[13px] font-black uppercase tracking-wider text-white">
              SERVIÇOS PRESTADOS
            </span>
          </div>

          {/* Estrutura da Tabela com Linhas de Divisão */}
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-zinc-200 border-b-2 border-black text-black font-black uppercase text-xs">
                <th className="px-3.5 py-2 font-black">DESCRIÇÃO DO SERVIÇO</th>
                <th className="px-4 py-2 text-center font-black w-36 sm:w-44 border-l-2 border-black">
                  VALOR (R$)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-300 bg-white">
              {os.itens && os.itens.length > 0 ? (
                os.itens.map((it, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50">
                    <td className="px-3.5 py-2 text-black font-medium leading-snug">
                      {it.descricao}
                    </td>
                    <td className="px-4 py-2 text-center font-bold text-black border-l-2 border-black font-mono">
                      {formatMoeda(it.valor_total || it.valor_unitario * it.quantidade)}
                    </td>
                  </tr>
                ))
              ) : (
                // Exibição padrão fiel aos 4 itens do modelo PDF se não houver itens
                <>
                  <tr className="hover:bg-zinc-50">
                    <td className="px-3.5 py-2 text-black font-medium leading-snug">
                      Mão de obra da troca da embreagem
                    </td>
                    <td className="px-4 py-2 text-center font-bold text-black border-l-2 border-black font-mono">
                      800,00
                    </td>
                  </tr>
                  <tr className="hover:bg-zinc-50">
                    <td className="px-3.5 py-2 text-black font-medium leading-snug">
                      Mão de obra da troca dos batentes dos amortecedores dianteiro
                    </td>
                    <td className="px-4 py-2 text-center font-bold text-black border-l-2 border-black font-mono">
                      400,00
                    </td>
                  </tr>
                  <tr className="hover:bg-zinc-50">
                    <td className="px-3.5 py-2 text-black font-medium leading-snug">
                      Mão de obra dos retentores e junta do car e troca das velas
                    </td>
                    <td className="px-4 py-2 text-center font-bold text-black border-l-2 border-black font-mono">
                      300,00
                    </td>
                  </tr>
                  <tr className="hover:bg-zinc-50">
                    <td className="px-3.5 py-2 text-black font-medium leading-snug">
                      Troca da junta homocinetica
                    </td>
                    <td className="px-4 py-2 text-center font-bold text-black border-l-2 border-black font-mono">
                      100,00
                    </td>
                  </tr>
                </>
              )}
            </tbody>

            {/* Linha de Total Conforme o PDF: Esquerda PRETA com texto branco, Direita BRANCA com valor em preto */}
            <tfoot>
              <tr className="border-t-2 border-black">
                <td className="bg-black text-white px-4 py-2.5 text-right font-black uppercase text-xs sm:text-sm tracking-wider">
                  TOTAL DOS SERVIÇOS
                </td>
                <td className="bg-white text-black px-4 py-2.5 text-center font-black font-mono text-base sm:text-lg border-l-2 border-black">
                  R$ {formatMoeda(totalCalculado)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ======================================================================= */}
        {/* 5. QUADRO DE OBSERVAÇÕES                                                */}
        {/* ======================================================================= */}
        <div className="border-2 border-black rounded-xl overflow-hidden">
          <div className="bg-black text-white px-3 py-1.5 flex items-center gap-2">
            {/* Ícone de Bloco de Notas / Documento Sólido Branco */}
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white text-white shrink-0">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
            </svg>
            <span className="text-xs sm:text-[13px] font-black uppercase tracking-wider text-white">
              OBSERVAÇÕES
            </span>
          </div>
          <div className="p-3 bg-white text-xs sm:text-sm text-black min-h-[46px] font-medium leading-relaxed">
            {os.observacoes ? (
              <span>{os.observacoes}</span>
            ) : (
              <span>Obs: Cliente trouxe as peças.</span>
            )}
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 6. TRÊS QUADROS: GARANTIA (PRETO), PAGAMENTO (BRANCO), CONDIÇÕES (PRETO) */}
        {/* Idêntico ao contraste visual e diagramação do modelo PDF anexado        */}
        {/* ======================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Quadro 1: GARANTIA DO SERVIÇO (Fundo Totalmente Preto com Texto Branco) */}
          <div className="bg-black text-white rounded-xl p-3 flex flex-col justify-between shadow-sm">
            <div className="flex items-center gap-1.5 mb-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white text-white shrink-0">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
              </svg>
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-white">
                GARANTIA DO SERVIÇO
              </span>
            </div>
            <p className="text-[10px] sm:text-[10.5px] text-zinc-100 leading-relaxed font-normal">
              {os.garantia ||
                oficina?.texto_padrao_garantia ||
                'Garantia de 90 dias para os serviços realizados, desde que sejam seguidas as orientações de uso e manutenção do veículo.'}
            </p>
          </div>

          {/* Quadro 2: FORMA DE PAGAMENTO (Fundo Branco com Borda Preta e Checkboxes) */}
          <div className="bg-white border-2 border-black rounded-xl p-3 flex flex-col justify-between shadow-sm">
            <div className="flex items-center gap-1.5 mb-2">
              {/* Ícone de Carteira/Cartões em Preto */}
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-black text-black shrink-0">
                <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
              </svg>
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-black">
                FORMA DE PAGAMENTO
              </span>
            </div>

            {/* Duas colunas com Caixas de Seleção Quadradas */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] sm:text-xs text-black font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-black rounded-[2px] inline-block shrink-0 bg-white" />
                <span>Dinheiro</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-black rounded-[2px] inline-block shrink-0 bg-white" />
                <span>Pix</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-black rounded-[2px] inline-block shrink-0 bg-white" />
                <span>Cartão</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-black rounded-[2px] inline-block shrink-0 bg-white" />
                <span className="whitespace-nowrap">Outros:______</span>
              </div>
            </div>
          </div>

          {/* Quadro 3: CONDIÇÕES GERAIS (Fundo Totalmente Preto com Tópicos em Branco) */}
          <div className="bg-black text-white rounded-xl p-3 flex flex-col justify-between shadow-sm">
            <div className="flex items-center gap-1.5 mb-1.5">
              {/* Ícone de Engrenagem Branco */}
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white text-white shrink-0">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-white">
                CONDIÇÕES GERAIS
              </span>
            </div>
            <div className="text-[9px] sm:text-[9.5px] text-zinc-100 leading-snug space-y-1 font-normal">
              <p>• O veículo foi entregue em perfeitas condições de funcionamento.</p>
              <p>• O cliente autoriza a realização dos serviços descritos acima.</p>
              <p>• Qualquer serviço adicional será previamente informado.</p>
            </div>
          </div>

        </div>

        {/* ======================================================================= */}
        {/* 7. ASSINATURAS (CLIENTE E RESPONSÁVEL TÉCNICO IDÊNTICAS AO PDF)          */}
        {/* ======================================================================= */}
        <div className="pt-6 pb-2 grid grid-cols-2 gap-8 text-center">
          <div>
            <div className="border-t border-black pt-1.5 mx-4 sm:mx-8">
              <div className="font-bold text-black text-xs sm:text-[13px]">
                Assinatura do Cliente
              </div>
              <div className="text-xs sm:text-[13px] text-black font-normal mt-0.5">
                {clienteNome}
              </div>
            </div>
          </div>

          <div>
            <div className="border-t border-black pt-1.5 mx-4 sm:mx-8">
              <div className="font-bold text-black text-xs sm:text-[13px]">
                Responsável Técnico
              </div>
              <div className="text-xs sm:text-[13px] text-black font-normal mt-0.5">
                {oficina?.nome_fantasia || 'Impérios Car'}
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 8. FAIXA INFERIOR / RODAPÉ IDÊNTICO AO MODELO ANEXADO                   */}
        {/* ======================================================================= */}
        <div className="w-full bg-black text-white px-4 sm:px-6 py-2.5 rounded-xl border border-red-600/80 flex items-center justify-between select-none shadow-md overflow-hidden relative">
          
          {/* Lado Esquerdo: Valores com Divisórias Verticais */}
          <div className="flex items-center gap-3 sm:gap-5 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white">
            <div className="flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white text-white shrink-0">
                <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
              </svg>
              <span>QUALIDADE</span>
            </div>

            <span className="text-white/50 text-xs">|</span>

            <div className="flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white text-white shrink-0">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
              </svg>
              <span>CONFIANÇA</span>
            </div>

            <span className="text-white/50 text-xs hidden sm:inline">|</span>

            <div className="hidden sm:flex items-center gap-1.5 text-white">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white text-white shrink-0">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-4.66l.12-.34h13.77l.11.34V17z" />
              </svg>
              <span>SEU CARRO SEMPRE EM BOAS MÃOS</span>
            </div>
          </div>

          {/* Lado Direito: Coroa Real Vermelha do Emblema Impérios Car */}
          <div className="flex items-center gap-2">
            <svg
              viewBox="0 0 100 48"
              className="w-10 sm:w-12 h-6 fill-[#ff1a26] text-[#ff1a26] drop-shadow-[0_2px_4px_rgba(255,0,0,0.5)]"
            >
              <path
                d="M 12 42 L 6 16 L 28 28 L 50 8 L 72 28 L 94 16 L 88 42 Z"
                fill="#ff1a26"
                stroke="#ff4d5a"
                strokeWidth="1.5"
              />
              <circle cx="6" cy="15" r="3.5" fill="#ff4d5a" />
              <circle cx="28" cy="27" r="3" fill="#ff4d5a" />
              <circle cx="50" cy="7" r="4.5" fill="#ff4d5a" />
              <circle cx="72" cy="27" r="3" fill="#ff4d5a" />
              <circle cx="94" cy="15" r="3.5" fill="#ff4d5a" />
              <rect x="12" y="38" width="76" height="5" rx="1.5" fill="#ff1a26" />
            </svg>
          </div>

        </div>

      </div>

    </div>
  );
};

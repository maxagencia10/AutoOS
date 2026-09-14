import React from 'react';

interface BarraTituloOSProps {
  numeroOS: string | number;
  dataEmissao: string;
  className?: string;
}

/**
 * Barra de Título da Ordem de Serviço
 * Reprodução fiel da arte gráfica oficial enviada no modelo do anexo:
 * - Contorno vermelho automotivo arredondado (#e00613)
 * - Fundo preto profundo
 * - Cunha vermelha chanfrada à esquerda com chave de boca branca inclinada
 * - Título em itálico pesado "ORDEM DE SERVIÇO"
 * - Badge arredondada branca com o número da OS "Nº 000125"
 * - Divisória vertical e bloco com ícone de calendário com anéis e "DATA DE EMISSÃO"
 */
export const BarraTituloOS: React.FC<BarraTituloOSProps> = ({
  numeroOS,
  dataEmissao,
  className = '',
}) => {
  // Garante a formatação do número com 6 dígitos (ex: 000125)
  const numLimpo = typeof numeroOS === 'number'
    ? String(numeroOS).padStart(6, '0')
    : String(numeroOS).replace(/\D/g, '').padStart(6, '0') || '000125';

  return (
    <div
      id="barra-titulo-ordem-servico"
      className={`w-full relative select-none rounded-xl overflow-hidden border-[2.5px] border-[#e00613] bg-[#0a0a0d] shadow-md ${className}`}
      style={{
        backgroundImage: `
          radial-gradient(circle at 10% 50%, rgba(224, 6, 19, 0.15) 0%, transparent 40%),
          radial-gradient(circle at 90% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
          repeating-linear-gradient(45deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 2px, transparent 2px, transparent 6px)
        `,
      }}
    >
      <div className="flex items-center justify-between min-h-[50px] sm:min-h-[56px] pr-2 sm:pr-4">
        
        {/* LADO ESQUERDO: Cunha Vermelha Inclinada + Chave de Boca + TÍTULO "ORDEM DE SERVIÇO" */}
        <div className="flex items-center gap-2 sm:gap-3.5 flex-1">
          {/* Cunha Vermelha Inclinada */}
          <div
            className="h-[50px] sm:h-[56px] w-14 sm:w-18 bg-[#e00613] flex items-center justify-center relative flex-shrink-0"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 74% 100%, 0 100%)',
            }}
          >
            {/* Ícone de Chave de Boca em Branco com orifício e inclinação */}
            <svg
              viewBox="0 0 32 32"
              className="w-6 h-6 sm:w-7 sm:h-7 text-white fill-current -ml-1.5 transform rotate-[-45deg] drop-shadow-sm"
            >
              <path d="M 19 3 C 14 3 11 6.5 12 11 L 4.5 18.5 C 3.5 19.5 3.5 21 4.5 22 L 6 23.5 C 7 24.5 8.5 24.5 9.5 23.5 L 17 16 C 21.5 17 25 14 25 9 C 23.5 10.5 21.5 11 19.5 9.5 C 17.5 8 18 6 19 3 Z M 7 21 C 6.45 21 6 20.55 6 20 C 6 19.45 6.45 19 7 19 C 7.55 19 8 19.45 8 20 C 8 20.55 7.55 21 7 21 Z" />
            </svg>
          </div>

          {/* Texto "ORDEM DE SERVIÇO" em Itálico Pesado Branco */}
          <h2 className="text-white font-black italic tracking-wide text-base sm:text-2xl lg:text-[24px] uppercase leading-none whitespace-nowrap drop-shadow-md">
            ORDEM DE SERVIÇO
          </h2>
        </div>

        {/* LADO DIREITO: Badge do Número da OS + Divisória + Data de Emissão */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          
          {/* Badge Branca com o Número da OS */}
          <div
            className="bg-white px-2.5 sm:px-3.5 py-1 sm:py-1.5 flex items-center justify-center rounded-lg border border-zinc-200 shadow-sm"
            style={{ minWidth: '95px' }}
          >
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-black font-black text-xs sm:text-sm tracking-tight uppercase font-sans">
                Nº
              </span>
              <span className="text-black font-black text-sm sm:text-lg tracking-tight font-mono">
                {numLimpo}
              </span>
            </div>
          </div>

          {/* Divisória Vertical Branca */}
          <div className="h-6 sm:h-7 w-[1.5px] bg-white/40 mx-0.5" />

          {/* Bloco de Data de Emissão com Ícone de Calendário */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-white">
            {/* Ícone de Calendário com 2 anéis superiores e grade */}
            <div className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center flex-shrink-0">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-current fill-none stroke-[2] stroke-linecap-round stroke-linejoin-round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="8" y1="2" x2="8" y2="5" strokeWidth="2.5" />
                <line x1="16" y1="2" x2="16" y2="5" strokeWidth="2.5" />
                <circle cx="8" cy="13" r="1" fill="currentColor" />
                <circle cx="12" cy="13" r="1" fill="currentColor" />
                <circle cx="16" cy="13" r="1" fill="currentColor" />
                <circle cx="8" cy="17" r="1" fill="currentColor" />
                <circle cx="12" cy="17" r="1" fill="currentColor" />
                <circle cx="16" cy="17" r="1" fill="currentColor" />
              </svg>
            </div>

            {/* Texto DATA DE EMISSÃO e a Data Formatada */}
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[8px] sm:text-[9px] font-black tracking-wider text-white uppercase">
                DATA DE EMISSÃO
              </span>
              <span className="text-xs sm:text-sm font-black tracking-tight text-white font-mono">
                {dataEmissao || '11/09/2025'}
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

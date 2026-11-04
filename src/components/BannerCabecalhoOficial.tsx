import React from 'react';
import { OficinaConfig } from '../types';
import defaultBgImg from '../assets/images/automotive_dark_bg_1789341510867.jpg';

interface BannerCabecalhoOficialProps {
  oficina?: OficinaConfig | null;
  className?: string;
  forceMode?: 'composto' | 'imagem_unica';
}

/**
 * Banner Oficial de Cabeçalho da Ordem de Serviço
 * Integra os elementos visuais da oficina:
 * 1. Fundo automotivo (textura esportiva de fibra de carbono e aletas vermelhas)
 * 2. Logotipo da oficina (com fundo transparente ou emblema estilizado com o nome da loja)
 * 3. Informações de contato e localização (WhatsApp, CNPJ, Endereço e Slogan)
 */
export const BannerCabecalhoOficial: React.FC<BannerCabecalhoOficialProps> = ({
  oficina,
  className = '',
  forceMode,
}) => {
  // Modo imagem única customizada ou camadas integradas
  const modo = forceMode || oficina?.modo_cabecalho || 'composto';

  if (modo === 'imagem' && oficina?.banner_cabecalho) {
    return (
      <div
        id="banner-cabecalho-oficial"
        className={`w-full relative overflow-hidden select-none bg-black border-b-2 border-[#e00613] ${className}`}
      >
        <img
          src={oficina.banner_cabecalho}
          alt={oficina?.nome || 'Oficina Mecânica'}
          className="w-full h-auto object-cover block select-none print:w-full"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Imagens das camadas
  const bgImg = oficina?.cabecalho_fundo || defaultBgImg;
  const logoImg = oficina?.cabecalho_logo || oficina?.logo;
  const escritasImg = oficina?.cabecalho_escritas;

  const isLogoPng = typeof logoImg === 'string' && (logoImg.startsWith('data:image/png') || logoImg.endsWith('.png'));
  const isEscritasPng = typeof escritasImg === 'string' && (escritasImg.startsWith('data:image/png') || escritasImg.endsWith('.png'));

  // Dados reais configurados da oficina
  const nomeOficina = oficina?.nome_fantasia || oficina?.nome || 'AUTO MECÂNICA';
  const whatsapp = oficina?.whatsapp || '';
  const cnpj = oficina?.cnpj || '';
  const enderecoLinha1 = oficina?.logradouro
    ? `${oficina.logradouro}${oficina.numero ? `, nº ${oficina.numero}` : ''}`
    : '';
  const enderecoLinha2 = [oficina?.bairro, oficina?.cidade, oficina?.estado].filter(Boolean).join(' - ');
  const slogan = oficina?.texto_institucional || 'Seu veículo em boas mãos!';

  return (
    <div
      id="banner-cabecalho-oficial"
      className={`w-full relative overflow-hidden select-none bg-[#050507] border-b-2 border-[#e00613] ${className}`}
      style={{ aspectRatio: '1376 / 440' }}
    >
      {/* CAMADA 1: FUNDO AUTOMOTIVO */}
      <img
        src={bgImg}
        alt="Fundo Automotivo"
        className="absolute inset-0 w-full h-full object-cover object-center select-none pointer-events-none"
        referrerPolicy="no-referrer"
      />

      {/* Camada sutil de gradiente para garantir alto contraste das escritas */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-black/70 pointer-events-none" />

      {/* Faixa inferior vermelha chanfrada de reforço esportivo */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#e00613] via-[#ff2a38] to-[#99000a] pointer-events-none" />

      {/* CONTEÚDO INTEGRADO PROPORCIONAL: LOGO (ESQUERDA) + ESCRITAS (DIREITA) */}
      <div className="relative z-10 w-full h-full flex items-center justify-between px-3 sm:px-6 md:px-8 py-2">
        
        {/* CAMADA 2: LOGOTIPO OU EMBLEMA DA OFICINA */}
        <div className="w-[48%] sm:w-[46%] md:w-[44%] h-full flex items-center justify-center relative px-2">
          {logoImg ? (
            <img
              src={logoImg}
              alt={nomeOficina}
              className="max-w-full max-h-[92%] object-contain block select-none pointer-events-none drop-shadow-[0_8px_20px_rgba(0,0,0,0.95)]"
              style={{
                mixBlendMode: isLogoPng ? 'normal' : 'screen',
                filter: isLogoPng ? 'drop-shadow(0 6px 14px rgba(0,0,0,0.9))' : 'contrast(1.1) brightness(1.05)',
              }}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center select-none max-w-full">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-800 border border-red-500/50 shadow-xl shadow-red-950 mb-1">
                <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 fill-white text-white">
                  <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
                </svg>
              </div>
              <h2 className="text-white font-black italic tracking-wide text-sm sm:text-lg md:text-xl uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] line-clamp-2 leading-tight">
                {nomeOficina}
              </h2>
              <span className="text-[9px] sm:text-[11px] font-bold text-red-400 tracking-wider uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] mt-0.5">
                Centro Automotivo Especializado
              </span>
            </div>
          )}
        </div>

        {/* CAMADA 3: ESCRITAS COM DADOS DA OFICINA */}
        <div className="w-[50%] sm:w-[52%] md:w-[54%] h-full flex items-center justify-end pl-2">
          {escritasImg ? (
            <img
              src={escritasImg}
              alt="Contatos e Localização"
              className="max-w-full max-h-[95%] object-contain select-none pointer-events-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
              style={{
                mixBlendMode: isEscritasPng ? 'normal' : 'screen',
                filter: isEscritasPng ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.85))' : 'contrast(1.15) brightness(1.1)',
              }}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full flex flex-col justify-center items-start pl-3 sm:pl-6 space-y-1 sm:space-y-1.5 md:space-y-2 select-none">
              
              {/* WhatsApp */}
              {whatsapp && (
                <div className="flex items-center gap-1.5 sm:gap-2.5">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-[#25D366] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(37,211,102,0.6)]">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-5 sm:h-5 md:w-5.5 md:h-5.5 fill-white text-white">
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.27-2.42 5.82-1.55 1.56-3.62 2.42-5.82 2.42-1.46 0-2.89-.39-4.14-1.13l-.3-.18-3.08.81.82-3-.19-.31a8.21 8.21 0 01-1.26-4.43c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.13-1.47-.73-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.65.81-.8 1-.15.19-.3.21-.55.08-.25-.13-1.07-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.3.38-.45.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.45.06-.68.32-.23.25-.89.87-.89 2.12s.91 2.46 1.04 2.63c.13.17 1.79 2.73 4.33 3.83.61.26 1.08.42 1.45.54.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.22-.16-.47-.28z" />
                    </svg>
                  </div>
                  <span className="text-white font-black text-sm sm:text-xl md:text-2xl lg:text-[26px] tracking-tight font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {whatsapp}
                  </span>
                </div>
              )}

              {/* CNPJ */}
              {cnpj && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-[4px] bg-[#e00613] flex items-center justify-center shrink-0 border border-white/20">
                    <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 fill-white text-white">
                      <rect x="4" y="4" width="4" height="4" rx="0.5" />
                      <rect x="10" y="4" width="4" height="4" rx="0.5" />
                      <rect x="16" y="4" width="4" height="4" rx="0.5" />
                      <rect x="4" y="10" width="4" height="4" rx="0.5" />
                      <rect x="10" y="10" width="4" height="4" rx="0.5" />
                      <rect x="16" y="10" width="4" height="4" rx="0.5" />
                      <rect x="4" y="16" width="4" height="4" rx="0.5" />
                      <rect x="10" y="16" width="4" height="4" rx="0.5" />
                      <rect x="16" y="16" width="4" height="4" rx="0.5" />
                    </svg>
                  </div>
                  <span className="text-white font-bold text-[10px] sm:text-xs md:text-sm lg:text-[15px] tracking-wide font-sans drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                    CNPJ: {cnpj}
                  </span>
                </div>
              )}

              {/* Endereço */}
              {(enderecoLinha1 || enderecoLinha2) && (
                <div className="flex items-start gap-1.5 sm:gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex items-center justify-center shrink-0 mt-0.5">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 fill-[#e00613] text-[#e00613] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                  </div>
                  <div className="flex flex-col leading-tight">
                    {enderecoLinha1 && (
                      <span className="text-white font-bold text-[10px] sm:text-xs md:text-sm lg:text-[14px] font-sans drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                        {enderecoLinha1}
                      </span>
                    )}
                    {enderecoLinha2 && (
                      <span className="text-white font-bold text-[9px] sm:text-[11px] md:text-xs lg:text-[13px] font-sans drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                        {enderecoLinha2}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Slogan */}
              {slogan && (
                <div className="pt-0.5 sm:pt-1 relative flex flex-col items-start">
                  <span
                    className="text-white text-xs sm:text-base md:text-xl lg:text-2xl font-bold tracking-wide select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                    style={{
                      fontFamily: "'Kaushan Script', 'Caveat', cursive, sans-serif",
                      transform: 'rotate(-2deg)',
                    }}
                  >
                    {slogan}
                  </span>

                  <svg
                    viewBox="0 0 240 14"
                    className="w-36 sm:w-48 md:w-56 h-2 sm:h-2.5 -mt-0.5 pointer-events-none"
                  >
                    <path
                      d="M 2 8 Q 80 1 160 5 Q 210 8 238 12 Q 160 9 80 5 Z"
                      fill="#e00613"
                    />
                  </svg>
                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  );
};

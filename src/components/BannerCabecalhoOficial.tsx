import React from 'react';
import { OficinaConfig } from '../types';
import headerBannerImg from '../assets/images/header_banner_imperios.png';
import defaultBgImg from '../assets/images/automotive_dark_bg_1789341510867.jpg';
import defaultLogoImg from '../assets/images/logo_imperios_car_3d_1789346970772.jpg';

interface BannerCabecalhoOficialProps {
  oficina?: OficinaConfig | null;
  className?: string;
  forceMode?: 'composto' | 'imagem_unica';
}

/**
 * Banner Oficial de Cabeçalho da Impérios Car
 * Une os 3 elementos enviados pelo usuário:
 * 1. Fundo (Textura fibra de carbono, colmeia hexagonal, aletas vermelhas e silhueta do carro)
 * 2. Logotipo 3D (Brasão dourado, coroa real vermelha, velocímetro, IMPÉRIOS CAR e chave)
 * 3. Escritas / Contatos (WhatsApp verde, CNPJ vermelho, Endereço com pin e Slogan "Seu carro em boas mãos!")
 * 
 * Remove o fundo do logo e das escritas (via mix-blend-mode: screen / transparência),
 * integrando todos os elementos proporcionalmente como uma única arte automotiva de alto padrão.
 */
export const BannerCabecalhoOficial: React.FC<BannerCabecalhoOficialProps> = ({
  oficina,
  className = '',
  forceMode,
}) => {
  // Se o usuário tiver enviado uma imagem única completa de banner e selecionado modo imagem única
  const modo = forceMode || oficina?.modo_cabecalho || 'composto';

  if (modo === 'imagem' && oficina?.banner_cabecalho) {
    return (
      <div
        id="banner-cabecalho-imperios-car"
        className={`w-full relative overflow-hidden select-none bg-black border-b-2 border-[#e00613] ${className}`}
      >
        <img
          src={oficina.banner_cabecalho}
          alt="Impérios Car Mecânica em Geral"
          className="w-full h-auto object-cover block select-none print:w-full"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Imagens das camadas (customizadas via upload ou oficiais padrão)
  const bgImg = oficina?.cabecalho_fundo || defaultBgImg;
  const logoImg = oficina?.cabecalho_logo || defaultLogoImg;
  const escritasImg = oficina?.cabecalho_escritas;

  const isLogoPng = typeof logoImg === 'string' && (logoImg.startsWith('data:image/png') || logoImg.endsWith('.png'));
  const isEscritasPng = typeof escritasImg === 'string' && (escritasImg.startsWith('data:image/png') || escritasImg.endsWith('.png'));

  // Dados das informações para camada vetorial caso não haja imagem de escritas
  const whatsapp = oficina?.whatsapp || '(11) 96944-0424';
  const cnpj = oficina?.cnpj || '33.566.871.0001.26';
  const enderecoLinha1 = oficina?.logradouro
    ? `${oficina.logradouro}, nº ${oficina.numero || '2055'}`
    : 'Avenida Direitos Humanos, nº 2055';
  const enderecoLinha2 = oficina?.cidade
    ? `${oficina.cidade} - ${oficina.estado || 'SP'}`
    : 'São Paulo - SP';
  const slogan = oficina?.texto_institucional || 'Seu carro em boas mãos!';

  return (
    <div
      id="banner-cabecalho-imperios-car"
      className={`w-full relative overflow-hidden select-none bg-[#050507] border-b-2 border-[#e00613] ${className}`}
      style={{ aspectRatio: '1376 / 440' }}
    >
      {/* ===================================================================== */}
      {/* CAMADA 1: FUNDO AUTOMOTIVO (Fundo.jfif)                               */}
      {/* ===================================================================== */}
      <img
        src={bgImg}
        alt="Fundo Automotivo Impérios Car"
        className="absolute inset-0 w-full h-full object-cover object-center select-none pointer-events-none"
        referrerPolicy="no-referrer"
      />

      {/* Camada sutil de gradiente para garantir alto contraste das escritas */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/60 pointer-events-none" />

      {/* Faixa inferior vermelha chanfrada de reforço esportivo */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#e00613] via-[#ff2a38] to-[#99000a] pointer-events-none" />

      {/* ===================================================================== */}
      {/* CONTEÚDO INTEGRADO PROPORCIONAL: LOGO (ESQUERDA) + ESCRITAS (DIREITA) */}
      {/* ===================================================================== */}
      <div className="relative z-10 w-full h-full flex items-center justify-between px-3 sm:px-6 md:px-8 py-2">
        
        {/* =================================================================== */}
        {/* CAMADA 2: LOGOTIPO 3D (Logo.jfif) com Fundo Removido                */}
        {/* =================================================================== */}
        <div className="w-[48%] sm:w-[46%] md:w-[44%] h-full flex items-center justify-center relative">
          <img
            src={logoImg}
            alt="Impérios Car Mecânica em Geral - Logotipo 3D"
            className="max-w-full max-h-[92%] object-contain block select-none pointer-events-none drop-shadow-[0_8px_20px_rgba(0,0,0,0.95)]"
            style={{
              mixBlendMode: isLogoPng ? 'normal' : 'screen',
              filter: isLogoPng ? 'drop-shadow(0 6px 14px rgba(0,0,0,0.9))' : 'contrast(1.1) brightness(1.05)',
            }}
            referrerPolicy="no-referrer"
          />
        </div>

        {/* =================================================================== */}
        {/* CAMADA 3: ESCRITAS (Escritas.jfif) com Fundo Removido               */}
        {/* =================================================================== */}
        <div className="w-[50%] sm:w-[52%] md:w-[54%] h-full flex items-center justify-end pl-2">
          {escritasImg ? (
            /* Se o usuário tiver feito upload da imagem Escritas.jfif */
            <img
              src={escritasImg}
              alt="Contatos e Localização Impérios Car"
              className="max-w-full max-h-[95%] object-contain select-none pointer-events-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
              style={{
                mixBlendMode: isEscritasPng ? 'normal' : 'screen',
                filter: isEscritasPng ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.85))' : 'contrast(1.15) brightness(1.1)',
              }}
              referrerPolicy="no-referrer"
            />
          ) : (
            /* Composição idêntica a Escritas.jfif com máxima nitidez vetorial */
            <div className="w-full flex flex-col justify-center items-start pl-3 sm:pl-6 space-y-1 sm:space-y-1.5 md:space-y-2 select-none">
              
              {/* WhatsApp com círculo verde brilhante */}
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

              {/* CNPJ com ícone quadrado vermelho */}
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

              {/* Endereço com pin vermelho */}
              <div className="flex items-start gap-1.5 sm:gap-2">
                <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex items-center justify-center shrink-0 mt-0.5">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 fill-[#e00613] text-[#e00613] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-white font-bold text-[10px] sm:text-xs md:text-sm lg:text-[14px] font-sans drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                    {enderecoLinha1}
                  </span>
                  <span className="text-white font-bold text-[9px] sm:text-[11px] md:text-xs lg:text-[13px] font-sans drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                    {enderecoLinha2}
                  </span>
                </div>
              </div>

              {/* Slogan manuscrito em itálico elegante com traço curvo vermelho */}
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

                {/* Traço curvo vermelho afilado idêntico à imagem */}
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

            </div>
          )}
        </div>

      </div>
    </div>
  );
};

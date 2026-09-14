import React from 'react';

export const LogoImperiosCar: React.FC<{ className?: string; subtitle?: string }> = ({
  className = "w-full h-auto",
  subtitle = "MECÂNICA EM GERAL"
}) => {
  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox="0 0 340 120"
        className="w-full max-w-[280px] h-auto drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="speedArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff1a1a" />
            <stop offset="50%" stopColor="#ff4d00" />
            <stop offset="100%" stopColor="#ffd700" />
          </linearGradient>
          <linearGradient id="textGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#efefef" />
            <stop offset="100%" stopColor="#b3b3b3" />
          </linearGradient>
          <linearGradient id="carRedGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d90429" />
            <stop offset="50%" stopColor="#ef233c" />
            <stop offset="100%" stopColor="#b7094c" />
          </linearGradient>
          <linearGradient id="chromeBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#888888" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#333333" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Arco Velocímetro Superior */}
        <path
          d="M 100 68 A 70 70 0 0 1 240 68"
          stroke="#262626"
          strokeWidth="16"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 104 68 A 66 66 0 0 1 236 68"
          stroke="url(#speedArcGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="4 6"
          fill="none"
        />
        {/* Marcadores e ponteiro velocímetro */}
        <circle cx="170" cy="68" r="6" fill="#ffffff" />
        <line x1="170" y1="68" x2="202" y2="34" stroke="#ff0000" strokeWidth="3" strokeLinecap="round" />
        <line x1="170" y1="68" x2="160" y2="78" stroke="#ffffff" strokeWidth="2" />

        {/* Base / Tarjeta de Contorno da Marca */}
        <path
          d="M 16 48 L 324 48 C 330 48 335 53 333 60 L 319 96 C 318 100 314 104 310 104 L 30 104 C 24 104 19 99 21 93 L 29 55 C 30 51 34 48 38 48 Z"
          fill="#0a0a0a"
          stroke="url(#chromeBorder)"
          strokeWidth="3.5"
        />

        {/* Texto IMPÉRIOS */}
        <text
          x="36"
          y="88"
          fontFamily="system-ui, -apple-system, 'Arial Black', sans-serif"
          fontWeight="900"
          fontSize="41"
          letterSpacing="0.5"
          fontStyle="italic"
          fill="url(#textGrad)"
          stroke="#000"
          strokeWidth="1.5"
          style={{ paintOrder: "stroke fill" }}
        >
          IMPÉRIOS
        </text>

        {/* Texto CAR em Vermelho Metálico */}
        <text
          x="234"
          y="88"
          fontFamily="system-ui, -apple-system, 'Arial Black', sans-serif"
          fontWeight="900"
          fontSize="41"
          fontStyle="italic"
          fill="url(#carRedGrad)"
          stroke="#ffffff"
          strokeWidth="1"
          style={{ paintOrder: "stroke fill" }}
        >
          CAR
        </text>

        {/* Emblema do pistão/engrenagem estilizado */}
        <circle cx="292" cy="74" r="16" stroke="url(#chromeBorder)" strokeWidth="3" fill="none" />
        <path d="M 292 63 L 292 85" stroke="#ff1a1a" strokeWidth="3" strokeLinecap="round" />
        <path d="M 281 74 L 303 74" stroke="#ff1a1a" strokeWidth="3" strokeLinecap="round" />
      </svg>

      {/* Faixa Inferior 'MECÂNICA EM GERAL' com listras esportivas */}
      <div className="w-full max-w-[280px] -mt-1 bg-black border-t-2 border-red-600 px-3 py-1 flex items-center justify-between text-white shadow-sm">
        <div className="flex gap-1">
          <div className="w-2.5 h-2.5 bg-red-600 transform -skew-x-12" />
          <div className="w-1.5 h-2.5 bg-red-600 transform -skew-x-12 opacity-75" />
          <div className="w-1 h-2.5 bg-red-600 transform -skew-x-12 opacity-50" />
        </div>
        <span className="text-[10px] font-black tracking-widest text-white uppercase italic">
          {subtitle}
        </span>
        <div className="flex gap-1">
          <div className="w-1 h-2.5 bg-red-600 transform -skew-x-12 opacity-50" />
          <div className="w-1.5 h-2.5 bg-red-600 transform -skew-x-12 opacity-75" />
          <div className="w-2.5 h-2.5 bg-red-600 transform -skew-x-12" />
        </div>
      </div>
    </div>
  );
};

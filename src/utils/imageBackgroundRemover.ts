/**
 * Utilitário de remoção de fundo de imagens para cabeçalho da OS
 * Executa em Canvas HTML5 no navegador sem dependências externas.
 * Transforma fundos escuros (como em Logo.jfif e Escritas.jfif) ou claros em transparência alfa perfeita (PNG).
 */

export interface BackgroundRemovalOptions {
  mode?: 'auto' | 'dark' | 'light';
  threshold?: number; // 0 a 100 (sensibilidade)
  feather?: number; // 0 a 50 (suavização das bordas)
}

/**
 * Remove o fundo de uma imagem (Data URL ou Image) e retorna uma Data URL PNG transparente.
 */
export async function removeImageBackground(
  imageSource: string | HTMLImageElement,
  options: BackgroundRemovalOptions = {}
): Promise<string> {
  const {
    mode = 'auto',
    threshold = 32, // Sensibilidade padrão ideal para fundos pretos automotivos
    feather = 24,   // Suavização anti-aliasing
  } = options;

  return new Promise((resolve, reject) => {
    const img = typeof imageSource === 'string' ? new Image() : imageSource;
    img.crossOrigin = 'anonymous';

    const process = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível obter contexto 2D do canvas'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const totalPixels = data.length / 4;

        // 1. Determina se o fundo é escuro ou claro (amostra os 4 cantos e bordas)
        let detectedMode = mode;
        if (mode === 'auto') {
          const samplePoints = [
            0, // top-left
            (canvas.width - 1) * 4, // top-right
            ((canvas.height - 1) * canvas.width) * 4, // bottom-left
            (canvas.width * canvas.height - 1) * 4, // bottom-right
            Math.floor(canvas.width / 2) * 4, // top-center
            Math.floor(canvas.width * (canvas.height - 1) + canvas.width / 2) * 4, // bottom-center
          ];

          let totalCornerLuma = 0;
          let samplesCount = 0;
          for (const ptr of samplePoints) {
            if (ptr < data.length) {
              const r = data[ptr];
              const g = data[ptr + 1];
              const b = data[ptr + 2];
              totalCornerLuma += 0.299 * r + 0.587 * g + 0.114 * b;
              samplesCount++;
            }
          }
          const avgCornerLuma = totalCornerLuma / (samplesCount || 1);
          detectedMode = avgCornerLuma > 150 ? 'light' : 'dark';
        }

        // 2. Processa cada pixel aplicando remoção do fundo e rampa de transparência
        const lowerLimit = Math.max(0, threshold);
        const upperLimit = Math.min(255, threshold + feather);

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const currentA = data[i + 3];

          if (currentA === 0) continue;

          if (detectedMode === 'dark') {
            // Fundo escuro (preto / quase preto)
            // Luma ou valor máximo do canal
            const maxVal = Math.max(r, g, b);
            const luma = 0.299 * r + 0.587 * g + 0.114 * b;
            const metric = Math.max(maxVal * 0.7, luma);

            if (metric <= lowerLimit) {
              // Fundo escuro puro: 100% transparente
              data[i + 3] = 0;
            } else if (metric < upperLimit) {
              // Borda suave / transição anti-aliasing
              const factor = (metric - lowerLimit) / (upperLimit - lowerLimit);
              data[i + 3] = Math.round(currentA * factor);
              
              // Remove a contaminação preta da cor original nas bordas
              if (factor > 0.05) {
                data[i] = Math.min(255, Math.round(r / factor));
                data[i + 1] = Math.min(255, Math.round(g / factor));
                data[i + 2] = Math.min(255, Math.round(b / factor));
              }
            }
          } else {
            // Fundo claro (branco / quase branco)
            const minVal = Math.min(r, g, b);
            const luma = 0.299 * r + 0.587 * g + 0.114 * b;
            const metric = Math.min(minVal * 0.7 + luma * 0.3, 255);

            const whiteLower = 255 - (threshold + feather);
            const whiteUpper = 255 - threshold;

            if (metric >= whiteUpper) {
              // Fundo branco puro: 100% transparente
              data[i + 3] = 0;
            } else if (metric > whiteLower) {
              const factor = (whiteUpper - metric) / (whiteUpper - whiteLower);
              data[i + 3] = Math.round(currentA * factor);
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        reject(err);
      }
    };

    if (typeof imageSource === 'string') {
      img.onload = process;
      img.onerror = () => reject(new Error('Falha ao carregar imagem para remoção de fundo'));
      img.src = imageSource;
    } else {
      if (imageSource.complete) {
        process();
      } else {
        imageSource.onload = process;
        imageSource.onerror = () => reject(new Error('Falha ao processar imagem carregada'));
      }
    }
  });
}

/* ==========================================================================
   LASHMENU — MOTOR AUTOMÁTICO DE COMPRESSÃO & CONVERSÃO DE IMAGENS (CANVAS/WEBP)
   ========================================================================== */

window.compressImageFile = async function (file, options = {}) {
  if (!file) return file;

  // 1. Ignora vídeos ou arquivos que não sejam imagens
  if (!file.type || !file.type.startsWith('image/')) {
    return file;
  }

  // 2. Se o arquivo já for extremamente leve (< 150 KB) e no formato webp, mantém original
  if (file.size && file.size < 150 * 1024 && file.type === 'image/webp') {
    return file;
  }

  const maxDimension = options.maxDimension || 1200; // 1200px para capas, 800px para procedimentos
  const quality = options.quality !== undefined ? options.quality : 0.82;
  const outputFormat = options.format || 'image/webp';

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(file); // Fallback seguro
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => resolve(file); // Fallback seguro
      img.onload = () => {
        try {
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          // Se a imagem for maior que a dimensão máxima permitida, calcula proporção
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(file);

          // Renderização de alta qualidade com suavização
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Tenta exportar em WebP primeiro
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                // Fallback para JPEG caso WebP falhar
                canvas.toBlob(
                  (jpegBlob) => {
                    if (!jpegBlob) return resolve(file);
                    const fileName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
                    const compressedFile = new File([jpegBlob], fileName, {
                      type: 'image/jpeg',
                      lastModified: Date.now()
                    });
                    console.log(`⚡ [LashCompress] Imagem otimizada (JPEG): ${(file.size / 1024).toFixed(0)}KB -> ${(jpegBlob.size / 1024).toFixed(0)}KB`);
                    resolve(compressedFile);
                  },
                  'image/jpeg',
                  quality
                );
                return;
              }

              const ext = outputFormat === 'image/webp' ? '.webp' : '.jpg';
              const fileName = file.name.replace(/\.[^/.]+$/, '') + ext;
              const compressedFile = new File([blob], fileName, {
                type: outputFormat,
                lastModified: Date.now()
              });

              console.log(`⚡ [LashCompress] Imagem otimizada (${ext}): ${(file.size / 1024).toFixed(0)}KB -> ${(blob.size / 1024).toFixed(0)}KB (${width}x${height}px)`);
              resolve(compressedFile);
            },
            outputFormat,
            quality
          );
        } catch (err) {
          console.warn('Aviso ao comprimir imagem, utilizando original:', err);
          resolve(file);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

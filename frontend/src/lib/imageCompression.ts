/**
 * Client-Side Image Compression for Offline PWA and Driver Field Logging
 *
 * Scales large smartphone camera photos (typically 4-12 MB) down to
 * max 1280px resolution and compresses to high-clarity JPEG (~100-200 KB).
 * This eliminates network timeouts in narrow municipal alleyways and reduces
 * IndexedDB storage footprint by over 90%.
 */

export interface CompressionResult {
  file: File;
  originalBytes: number;
  compressedBytes: number;
  savingsPercent: number;
  previewUrl: string;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function compressFieldPhoto(
  file: File,
  maxDimension = 1280,
  quality = 0.82
): Promise<CompressionResult> {
  const originalBytes = file.size;

  return new Promise((resolve) => {
    // If browser doesn't support Image or FileReader, return original
    if (typeof window === 'undefined' || !window.FileReader) {
      resolve({
        file,
        originalBytes,
        compressedBytes: originalBytes,
        savingsPercent: 0,
        previewUrl: URL.createObjectURL(file),
      });
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (readerEvent) => {
      const dataUrl = readerEvent.target?.result as string;
      const img = new Image();
      img.src = dataUrl;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate proportional dimensions
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            file,
            originalBytes,
            compressedBytes: originalBytes,
            savingsPercent: 0,
            previewUrl: dataUrl,
          });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({
                file,
                originalBytes,
                compressedBytes: originalBytes,
                savingsPercent: 0,
                previewUrl: dataUrl,
              });
              return;
            }

            const cleanName = file.name.replace(/\.[^.]+$/, '') + '-optimized.jpg';
            const compressedFile = new File([blob], cleanName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            const compressedBytes = compressedFile.size;
            const savingsPercent = Math.max(
              0,
              Math.round(((originalBytes - compressedBytes) / originalBytes) * 100)
            );

            const previewUrl = URL.createObjectURL(compressedFile);

            resolve({
              file: compressedFile,
              originalBytes,
              compressedBytes,
              savingsPercent,
              previewUrl,
            });
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        resolve({
          file,
          originalBytes,
          compressedBytes: originalBytes,
          savingsPercent: 0,
          previewUrl: dataUrl,
        });
      };
    };

    reader.onerror = () => {
      resolve({
        file,
        originalBytes,
        compressedBytes: originalBytes,
        savingsPercent: 0,
        previewUrl: URL.createObjectURL(file),
      });
    };
  });
}

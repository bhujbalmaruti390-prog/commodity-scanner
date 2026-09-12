/**
 * High-performance client-side image compressor and optimizer.
 * Scales down high-resolution camera images (e.g. 12-48MP) to an optimal 
 * resolution (max 1600px) and compresses to ~250-450KB JPEG.
 * Prevents HTTP payload size limits, network timeouts, and 'Failed to fetch' errors.
 */

export async function compressImage(
  source: string | File,
  maxDimension: number = 1600,
  quality: number = 0.82
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const img = new Image();

      img.onload = () => {
        try {
          let { width, height } = img;

          // Only downscale if the image exceeds maxDimension
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
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            // Fallback: return source if canvas context unavailable
            resolve(typeof source === 'string' ? source : URL.createObjectURL(source));
            return;
          }

          // Use high quality image smoothing for crisp text and numerals
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Fill white background for transparent PNGs before converting to JPEG
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (err) {
          console.warn('Canvas compression failed, using original source:', err);
          resolve(typeof source === 'string' ? source : URL.createObjectURL(source));
        }
      };

      img.onerror = () => {
        console.warn('Image loading failed in compressor, passing through source');
        resolve(typeof source === 'string' ? source : '');
      };

      if (typeof source === 'string') {
        img.src = source;
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target?.result as string;
        };
        reader.onerror = () => {
          resolve('');
        };
        reader.readAsDataURL(source);
      }
    } catch (err) {
      console.warn('Error in compressImage:', err);
      resolve(typeof source === 'string' ? source : '');
    }
  });
}

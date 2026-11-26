import { PhotoOrientation } from '../types/Photo';

export interface OptimizedImageResult {
  frameBlob: Blob;
  fullBlob: Blob;
  width: number;
  height: number;
  orientation: PhotoOrientation;
}

function loadImageElement(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function resizeToBlob(img: HTMLImageElement, maxDim: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const { naturalWidth: w, naturalHeight: h } = img;
    let nw = w;
    let nh = h;
    if (w > maxDim || h > maxDim) {
      if (w >= h) {
        nw = maxDim;
        nh = Math.round((h * maxDim) / w);
      } else {
        nh = maxDim;
        nw = Math.round((w * maxDim) / h);
      }
    }
    const canvas = document.createElement('canvas');
    canvas.width = nw;
    canvas.height = nh;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas 2D context unavailable'));
      return;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, nw, nh);
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to encode JPEG blob'));
      },
      'image/jpeg',
      quality
    );
  });
}

export async function optimizeUploadedImage(file: File): Promise<OptimizedImageResult> {
  const img = await loadImageElement(file);
  const width = img.naturalWidth;
  const height = img.naturalHeight;
  const orientation: PhotoOrientation =
    width > height ? 'landscape' : height > width ? 'portrait' : 'square';

  const [frameBlob, fullBlob] = await Promise.all([
    resizeToBlob(img, 768, 0.88),
    resizeToBlob(img, 1600, 0.92),
  ]);

  return { frameBlob, fullBlob, width, height, orientation };
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = /data:([^;]+)/.exec(header);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

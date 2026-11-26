import * as THREE from 'three';

const textureCache = new Map<string, Promise<THREE.Texture>>();

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    if (!src.startsWith('blob:') && !src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        resolve(img);
      } else {
        reject(new Error(`Empty image dimensions for ${src}`));
      }
    };
    img.onerror = () => reject(new Error(`Failed to load image ${src}`));
    img.src = src;
  });
}

function buildTextureFromImage(img: HTMLImageElement): THREE.Texture {
  const tex = new THREE.Texture(img);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Loads and caches museum photograph textures globally by URL so React StrictMode
 * remounts never dispose active textures or cause blank placeholder shaders.
 */
export function loadMuseumTexture(primaryUrl: string, fallbackUrl?: string): Promise<THREE.Texture> {
  const existing = textureCache.get(primaryUrl);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const img = await loadImageElement(primaryUrl);
      return buildTextureFromImage(img);
    } catch {
      if (fallbackUrl && fallbackUrl !== primaryUrl) {
        const img = await loadImageElement(fallbackUrl);
        return buildTextureFromImage(img);
      }
      // Retry primary once with cache-buster in case an earlier SW fetch aborted
      const sep = primaryUrl.includes('?') ? '&' : '?';
      const img = await loadImageElement(`${primaryUrl}${sep}cb=${Date.now()}`);
      return buildTextureFromImage(img);
    }
  })();

  // Keep resolved promise cached; if even fallback failed, evict so future attempts can retry
  const tracked = promise.catch((err) => {
    textureCache.delete(primaryUrl);
    throw err;
  });
  textureCache.set(primaryUrl, tracked);
  return tracked;
}

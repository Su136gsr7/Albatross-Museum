import * as THREE from 'three';

function createCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

export interface MuseumTextureSet {
  marbleFloor: THREE.CanvasTexture;
  marbleRoughness: THREE.CanvasTexture;
  walnutWood: THREE.CanvasTexture;
  plasterWall: THREE.CanvasTexture;
  dispose: () => void;
}

export function createMuseumTextures(): MuseumTextureSet {
  // 1. Cream & Warm Gold Veined Marble Floor
  const [fCanv, fCtx] = createCanvas(512, 512);
  fCtx.fillStyle = '#e7dfd3';
  fCtx.fillRect(0, 0, 512, 512);

  // Subtle tile grid (2x2 large museum slabs)
  fCtx.strokeStyle = 'rgba(130, 110, 88, 0.28)';
  fCtx.lineWidth = 3;
  for (const pos of [0, 256]) {
    fCtx.beginPath();
    fCtx.moveTo(pos, 0);
    fCtx.lineTo(pos, 512);
    fCtx.stroke();
    fCtx.beginPath();
    fCtx.moveTo(0, pos);
    fCtx.lineTo(512, pos);
    fCtx.stroke();
  }

  // Organic marble veining
  for (let i = 0; i < 24; i++) {
    fCtx.strokeStyle = i % 3 === 0 ? 'rgba(195, 165, 118, 0.16)' : 'rgba(120, 102, 86, 0.12)';
    fCtx.lineWidth = 0.8 + (i % 3) * 0.7;
    fCtx.beginPath();
    let x = (i * 73) % 512;
    let y = (i * 41) % 512;
    fCtx.moveTo(x, y);
    for (let s = 0; s < 7; s++) {
      x += Math.sin(i * 1.9 + s) * 62;
      y += 45 + Math.cos(i + s * 1.4) * 28;
      fCtx.lineTo(x, y);
    }
    fCtx.stroke();
  }

  const marbleFloor = new THREE.CanvasTexture(fCanv);
  marbleFloor.wrapS = THREE.RepeatWrapping;
  marbleFloor.wrapT = THREE.RepeatWrapping;
  marbleFloor.repeat.set(14, 14);
  marbleFloor.colorSpace = THREE.SRGBColorSpace;
  marbleFloor.anisotropy = 4;

  // 2. Marble Roughness Map (polished slabs with slightly matte grout)
  const [rCanv, rCtx] = createCanvas(256, 256);
  rCtx.fillStyle = '#323232';
  rCtx.fillRect(0, 0, 256, 256);
  rCtx.strokeStyle = '#999999';
  rCtx.lineWidth = 2;
  for (const pos of [0, 128]) {
    rCtx.beginPath(); rCtx.moveTo(pos, 0); rCtx.lineTo(pos, 256); rCtx.stroke();
    rCtx.beginPath(); rCtx.moveTo(0, pos); rCtx.lineTo(256, pos); rCtx.stroke();
  }
  const marbleRoughness = new THREE.CanvasTexture(rCanv);
  marbleRoughness.wrapS = THREE.RepeatWrapping;
  marbleRoughness.wrapT = THREE.RepeatWrapping;
  marbleRoughness.repeat.set(14, 14);

  // 3. Dark Walnut Wood Paneling
  const [wCanv, wCtx] = createCanvas(256, 256);
  wCtx.fillStyle = '#3b261b';
  wCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 2) {
    const alpha = 0.05 + 0.06 * Math.sin(y * 0.25);
    wCtx.fillStyle = y % 6 === 0 ? `rgba(20, 10, 6, ${alpha + 0.06})` : `rgba(88, 56, 38, ${alpha})`;
    wCtx.fillRect(0, y, 256, 2);
  }
  const walnutWood = new THREE.CanvasTexture(wCanv);
  walnutWood.wrapS = THREE.RepeatWrapping;
  walnutWood.wrapT = THREE.RepeatWrapping;
  walnutWood.repeat.set(3, 2);
  walnutWood.colorSpace = THREE.SRGBColorSpace;

  // 4. Subtle Warm Museum Plaster
  const [pCanv, pCtx] = createCanvas(256, 256);
  pCtx.fillStyle = '#f2ece2';
  pCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 650; i++) {
    const px = (i * 97) % 256;
    const py = (i * 53) % 256;
    pCtx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(170,152,130,0.05)';
    pCtx.fillRect(px, py, 3, 3);
  }
  const plasterWall = new THREE.CanvasTexture(pCanv);
  plasterWall.wrapS = THREE.RepeatWrapping;
  plasterWall.wrapT = THREE.RepeatWrapping;
  plasterWall.repeat.set(4, 2);
  plasterWall.colorSpace = THREE.SRGBColorSpace;

  return {
    marbleFloor,
    marbleRoughness,
    walnutWood,
    plasterWall,
    dispose: () => {
      marbleFloor.dispose();
      marbleRoughness.dispose();
      walnutWood.dispose();
      plasterWall.dispose();
    },
  };
}

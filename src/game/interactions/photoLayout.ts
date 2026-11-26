import { GalleryConfig } from '../../types/Gallery';
import { PhotoRecord } from '../../types/Photo';

export interface PlacedPhotoFrame {
  photo: PhotoRecord;
  position: [number, number, number];
  rotationY: number;
  /** Physical width & height of the artwork canvas inside the frame (meters) */
  artWidth: number;
  artHeight: number;
  /** Outward normal direction of the frame into the room */
  normal: [number, number];
  frameStyle: 'walnut' | 'gold' | 'champagne';
}

interface WallSlot {
  position: [number, number, number];
  rotationY: number;
  normal: [number, number];
}

function getGallerySlots(g: GalleryConfig): WallSlot[] {
  if (g.isSecret) {
    // Secret room walls allow extra photos if user assigns more beyond centerpiece
    const [cx, , cz] = g.center;
    return [
      { position: [cx - 4.2, 2.15, cz - 8.72], rotationY: 0, normal: [0, 1] },
      { position: [cx + 4.2, 2.15, cz - 8.72], rotationY: 0, normal: [0, 1] },
      { position: [cx - 8.72, 2.15, cz - 3.5], rotationY: Math.PI / 2, normal: [1, 0] },
      { position: [cx - 8.72, 2.15, cz + 3.5], rotationY: Math.PI / 2, normal: [1, 0] },
      { position: [cx + 8.72, 2.15, cz - 3.5], rotationY: -Math.PI / 2, normal: [-1, 0] },
      { position: [cx + 8.72, 2.15, cz + 3.5], rotationY: -Math.PI / 2, normal: [-1, 0] },
    ];
  }

  if (Math.abs(g.center[0]) !== 13) {
    // Custom user galleries exhibit along Grand Atrium West & East alcoves
    return [
      { position: [-5.72, 2.15, 9.0], rotationY: Math.PI / 2, normal: [1, 0] },
      { position: [-5.72, 2.15, 12.2], rotationY: Math.PI / 2, normal: [1, 0] },
      { position: [-5.72, 2.15, 15.2], rotationY: Math.PI / 2, normal: [1, 0] },
      { position: [5.72, 2.15, 9.0], rotationY: -Math.PI / 2, normal: [-1, 0] },
      { position: [5.72, 2.15, 12.2], rotationY: -Math.PI / 2, normal: [-1, 0] },
      { position: [5.72, 2.15, 15.2], rotationY: -Math.PI / 2, normal: [-1, 0] },
    ];
  }

  const [cx, , cz] = g.center;
  const isLeftWing = cx < 0;
  // Outer wall is at cx - 7.25 (left wing) or cx + 7.25 (right wing)
  const outerX = isLeftWing ? cx - 7.22 : cx + 7.22;
  const outerRotY = isLeftWing ? Math.PI / 2 : -Math.PI / 2;
  const outerNorm: [number, number] = isLeftWing ? [1, 0] : [-1, 0];

  const innerX = isLeftWing ? cx + 7.22 : cx - 7.22;
  const innerRotY = isLeftWing ? -Math.PI / 2 : Math.PI / 2;
  const innerNorm: [number, number] = isLeftWing ? [-1, 0] : [1, 0];

  // 11 cleanly spaced wall slots per gallery avoiding doorway opening at inner wall center
  return [
    // Outer wall (3 prime hero slots)
    { position: [outerX, 2.15, cz - 4.4], rotationY: outerRotY, normal: outerNorm },
    { position: [outerX, 2.15, cz], rotationY: outerRotY, normal: outerNorm },
    { position: [outerX, 2.15, cz + 4.4], rotationY: outerRotY, normal: outerNorm },
    // North wall (3 slots)
    { position: [cx - 4.4, 2.15, cz - 7.22], rotationY: 0, normal: [0, 1] },
    { position: [cx, 2.15, cz - 7.22], rotationY: 0, normal: [0, 1] },
    { position: [cx + 4.4, 2.15, cz - 7.22], rotationY: 0, normal: [0, 1] },
    // South wall (3 slots)
    { position: [cx + 4.4, 2.15, cz + 7.22], rotationY: Math.PI, normal: [0, -1] },
    { position: [cx, 2.15, cz + 7.22], rotationY: Math.PI, normal: [0, -1] },
    { position: [cx - 4.4, 2.15, cz + 7.22], rotationY: Math.PI, normal: [0, -1] },
    // Inner wall flanking doorway (2 slots)
    { position: [innerX, 2.15, cz - 4.8], rotationY: innerRotY, normal: innerNorm },
    { position: [innerX, 2.15, cz + 4.8], rotationY: innerRotY, normal: innerNorm },
  ];
}

export function computeFrameDimensions(photo: PhotoRecord): { artWidth: number; artHeight: number } {
  const aspect = photo.width > 0 && photo.height > 0 ? photo.width / photo.height : 4 / 3;
  if (photo.isForeverCenterpiece) {
    const artHeight = 2.35;
    return { artWidth: artHeight * aspect, artHeight };
  }
  if (photo.orientation === 'portrait') {
    const artHeight = photo.isFeaturePoster ? 1.85 : 1.58;
    return { artWidth: Math.min(1.65, artHeight * aspect), artHeight };
  }
  if (photo.orientation === 'square') {
    return { artWidth: 1.45, artHeight: 1.45 };
  }
  // Landscape
  const artWidth = photo.width / photo.height > 1.65 ? 2.15 : 1.92;
  return { artWidth, artHeight: artWidth / aspect };
}

export function buildPlacedFrames(
  galleries: GalleryConfig[],
  photos: PhotoRecord[],
  centerpiecePhotoId: string
): PlacedPhotoFrame[] {
  const placed: PlacedPhotoFrame[] = [];

  for (const g of galleries) {
    const galleryPhotos = photos
      .filter((p) => p.galleryId === g.id)
      .sort((a, b) => a.order - b.order);

    const slots = getGallerySlots(g);
    let slotIdx = 0;

    for (const photo of galleryPhotos) {
      // Secret room centerpiece is placed separately on the grand central shrine
      if (g.isSecret && photo.id === centerpiecePhotoId) continue;
      if (slotIdx >= slots.length) break;

      const slot = slots[slotIdx++];
      const { artWidth, artHeight } = computeFrameDimensions(photo);
      const frameStyle: PlacedPhotoFrame['frameStyle'] =
        photo.isFeaturePoster || g.isSecret
          ? 'gold'
          : g.index % 2 === 1
          ? 'walnut'
          : 'champagne';

      placed.push({
        photo,
        position: slot.position,
        rotationY: slot.rotationY,
        artWidth,
        artHeight,
        normal: slot.normal,
        frameStyle,
      });
    }
  }

  return placed;
}

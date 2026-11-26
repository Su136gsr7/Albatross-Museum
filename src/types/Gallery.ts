export interface GalleryConfig {
  id: string;
  index: number;
  name: string;
  subtitle: string;
  accentColor: string;
  wallColor: string;
  wainscotColor: string;
  floorTint: string;
  ambientHex: string;
  spotHex: string;
  /** World-space center of this gallery room */
  center: [number, number, number];
  /** Half-extents [hx, hz] of the interior room */
  halfSize: [number, number];
  isSecret?: boolean;
}

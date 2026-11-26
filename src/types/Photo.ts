export type PhotoOrientation = 'landscape' | 'portrait' | 'square';

export interface PhotoRecord {
  id: string;
  fileName: string;
  galleryId: string;
  order: number;
  title: string;
  description: string;
  date: string;
  location: string;
  width: number;
  height: number;
  orientation: PhotoOrientation;
  /** URL or DataURL/ObjectURL for the 3D wall frame (optimized ~768px) */
  frameUrl: string;
  /** URL or DataURL/ObjectURL for full-screen Memory Viewer (~1600px or original) */
  fullUrl: string;
  /** Optional Blob stored in IndexedDB for user-imported photos */
  frameBlob?: Blob;
  fullBlob?: Blob;
  isFeaturePoster?: boolean;
  isForeverCenterpiece?: boolean;
  source: 'mini-album' | 'user-import';
}

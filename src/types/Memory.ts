export type GameStage =
  | 'WELCOME'
  | 'CHARACTER_SELECT'
  | 'CHARACTER_INTRO'
  | 'MUSEUM'
  | 'MEMORY_VIEWER'
  | 'ALBATROSS_ROOM'
  | 'ALBATROSS_FLIGHT';

export interface ForeverUsConfig {
  heading: string;
  message: string;
  centerpiecePhotoId: string;
}

export interface MuseumBackupPayload {
  version: number;
  exportedAt: string;
  foreverUs: ForeverUsConfig;
  galleries: import('./Gallery').GalleryConfig[];
  photos: Array<{
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
    orientation: import('./Photo').PhotoOrientation;
    isFeaturePoster?: boolean;
    isForeverCenterpiece?: boolean;
    source: 'mini-album' | 'user-import';
    frameDataUrl?: string;
    fullDataUrl?: string;
  }>;
}

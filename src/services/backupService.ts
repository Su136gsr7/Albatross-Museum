import { GalleryConfig } from '../types/Gallery';
import { ForeverUsConfig, MuseumBackupPayload } from '../types/Memory';
import { PhotoRecord } from '../types/Photo';
import { blobToDataUrl, dataUrlToBlob } from './imageOptimizer';

export const backupService = {
  async createBackup(
    photos: PhotoRecord[],
    galleries: GalleryConfig[],
    foreverUs: ForeverUsConfig
  ): Promise<MuseumBackupPayload> {
    const serializedPhotos = await Promise.all(
      photos.map(async (p) => ({
        id: p.id,
        fileName: p.fileName,
        galleryId: p.galleryId,
        order: p.order,
        title: p.title,
        description: p.description,
        date: p.date,
        location: p.location,
        width: p.width,
        height: p.height,
        orientation: p.orientation,
        isFeaturePoster: p.isFeaturePoster,
        isForeverCenterpiece: p.isForeverCenterpiece,
        source: p.source,
        frameDataUrl: p.frameBlob ? await blobToDataUrl(p.frameBlob) : undefined,
        fullDataUrl: p.fullBlob ? await blobToDataUrl(p.fullBlob) : undefined,
      }))
    );

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      foreverUs,
      galleries,
      photos: serializedPhotos,
    };
  },

  downloadBackupJson(payload: MuseumBackupPayload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `our-little-universe-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  parseBackupPayload(rawJson: string): {
    photos: PhotoRecord[];
    galleries: GalleryConfig[];
    foreverUs: ForeverUsConfig;
  } {
    const parsed = JSON.parse(rawJson) as MuseumBackupPayload;
    if (!parsed || !Array.isArray(parsed.photos) || !Array.isArray(parsed.galleries)) {
      throw new Error('Invalid museum backup file format.');
    }
    const photos: PhotoRecord[] = parsed.photos.map((item) => {
      const frameBlob = item.frameDataUrl ? dataUrlToBlob(item.frameDataUrl) : undefined;
      const fullBlob = item.fullDataUrl ? dataUrlToBlob(item.fullDataUrl) : undefined;
      const safeName = item.fileName.replace(/[^a-zA-Z0-9._-]/g, '_') + '.jpg';
      return {
        id: item.id,
        fileName: item.fileName,
        galleryId: item.galleryId,
        order: item.order,
        title: item.title,
        description: item.description,
        date: item.date,
        location: item.location,
        width: item.width,
        height: item.height,
        orientation: item.orientation,
        isFeaturePoster: item.isFeaturePoster,
        isForeverCenterpiece: item.isForeverCenterpiece,
        source: item.source,
        frameBlob,
        fullBlob,
        frameUrl: frameBlob ? URL.createObjectURL(frameBlob) : `/album/frames/${safeName}`,
        fullUrl: fullBlob ? URL.createObjectURL(fullBlob) : `/album/full/${safeName}`,
      };
    });
    return {
      photos,
      galleries: parsed.galleries,
      foreverUs: parsed.foreverUs,
    };
  },
};

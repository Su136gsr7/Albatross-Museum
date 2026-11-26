import { PhotoRecord } from '../types/Photo';
import { GalleryConfig } from '../types/Gallery';
import { ForeverUsConfig } from '../types/Memory';

const DB_NAME = 'OurLittleUniverseDB';
const DB_VERSION = 1;

export const STORES = {
  PHOTOS: 'photos',
  GALLERIES: 'galleries',
  SETTINGS: 'settings',
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

export function openMuseumDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORES.PHOTOS)) {
        db.createObjectStore(STORES.PHOTOS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.GALLERIES)) {
        db.createObjectStore(STORES.GALLERIES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export interface StoredPhotoRow extends Omit<PhotoRecord, 'frameUrl' | 'fullUrl'> {
  frameUrl: string;
  fullUrl: string;
  frameBlob?: Blob;
  fullBlob?: Blob;
}

export const photoStorage = {
  async getAll(): Promise<PhotoRecord[]> {
    const db = await openMuseumDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PHOTOS, 'readonly');
      const req = tx.objectStore(STORES.PHOTOS).getAll();
      req.onsuccess = () => {
        const rows = (req.result as StoredPhotoRow[]).map((row) => ({
          ...row,
          frameUrl: row.frameBlob ? URL.createObjectURL(row.frameBlob) : row.frameUrl,
          fullUrl: row.fullBlob ? URL.createObjectURL(row.fullBlob) : row.fullUrl,
        }));
        rows.sort((a, b) => a.order - b.order);
        resolve(rows);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async put(photo: PhotoRecord): Promise<void> {
    const db = await openMuseumDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PHOTOS, 'readwrite');
      const row: StoredPhotoRow = {
        id: photo.id,
        fileName: photo.fileName,
        galleryId: photo.galleryId,
        order: photo.order,
        title: photo.title,
        description: photo.description,
        date: photo.date,
        location: photo.location,
        width: photo.width,
        height: photo.height,
        orientation: photo.orientation,
        frameUrl: photo.frameBlob ? '' : photo.frameUrl,
        fullUrl: photo.fullBlob ? '' : photo.fullUrl,
        frameBlob: photo.frameBlob,
        fullBlob: photo.fullBlob,
        isFeaturePoster: photo.isFeaturePoster,
        isForeverCenterpiece: photo.isForeverCenterpiece,
        source: photo.source,
      };
      tx.objectStore(STORES.PHOTOS).put(row);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async putMany(photos: PhotoRecord[]): Promise<void> {
    const db = await openMuseumDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PHOTOS, 'readwrite');
      const store = tx.objectStore(STORES.PHOTOS);
      for (const photo of photos) {
        store.put({
          ...photo,
          frameUrl: photo.frameBlob ? '' : photo.frameUrl,
          fullUrl: photo.fullBlob ? '' : photo.fullUrl,
        });
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async delete(id: string): Promise<void> {
    const db = await openMuseumDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PHOTOS, 'readwrite');
      tx.objectStore(STORES.PHOTOS).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async clear(): Promise<void> {
    const db = await openMuseumDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PHOTOS, 'readwrite');
      tx.objectStore(STORES.PHOTOS).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
};

export const settingsStorage = {
  async getForeverUs(): Promise<ForeverUsConfig | null> {
    const db = await openMuseumDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SETTINGS, 'readonly');
      const req = tx.objectStore(STORES.SETTINGS).get('foreverUs');
      req.onsuccess = () => resolve(req.result?.value ?? null);
      req.onerror = () => reject(req.error);
    });
  },

  async putForeverUs(config: ForeverUsConfig): Promise<void> {
    const db = await openMuseumDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SETTINGS, 'readwrite');
      tx.objectStore(STORES.SETTINGS).put({ key: 'foreverUs', value: config });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getAllGalleries(): Promise<GalleryConfig[]> {
    const db = await openMuseumDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.GALLERIES, 'readonly');
      const req = tx.objectStore(STORES.GALLERIES).getAll();
      req.onsuccess = () => {
        const res = (req.result as GalleryConfig[]) ?? [];
        res.sort((a, b) => a.index - b.index);
        resolve(res);
      };
      req.onerror = () => reject(req.error);
    });
  },
};

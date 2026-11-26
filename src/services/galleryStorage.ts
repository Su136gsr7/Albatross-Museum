import { GalleryConfig } from '../types/Gallery';
import { openMuseumDb, STORES } from './photoStorage';

export const galleryStorage = {
  async getAll(): Promise<GalleryConfig[]> {
    const db = await openMuseumDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.GALLERIES, 'readonly');
      const req = tx.objectStore(STORES.GALLERIES).getAll();
      req.onsuccess = () => {
        const list = (req.result as GalleryConfig[]) ?? [];
        list.sort((a, b) => a.index - b.index);
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async putMany(galleries: GalleryConfig[]): Promise<void> {
    const db = await openMuseumDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.GALLERIES, 'readwrite');
      const store = tx.objectStore(STORES.GALLERIES);
      for (const g of galleries) {
        store.put(g);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async put(gallery: GalleryConfig): Promise<void> {
    const db = await openMuseumDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.GALLERIES, 'readwrite');
      tx.objectStore(STORES.GALLERIES).put(gallery);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
};

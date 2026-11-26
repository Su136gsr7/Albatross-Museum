import { create } from 'zustand';
import { CharacterId } from '../types/Character';
import { GalleryConfig } from '../types/Gallery';
import { ForeverUsConfig, GameStage } from '../types/Memory';
import { PhotoRecord } from '../types/Photo';
import { DEFAULT_GALLERIES } from '../data/galleries/galleries';
import { DEFAULT_FOREVER_US, INITIAL_PHOTOS } from '../data/galleries/initialPhotos';
import { photoStorage, settingsStorage } from '../services/photoStorage';
import { galleryStorage } from '../services/galleryStorage';
import { audioService } from '../services/audioService';

export interface MobileInputState {
  moveX: number; // -1..1
  moveY: number; // -1..1 (forward positive)
  lookDeltaX: number;
  lookDeltaY: number;
}

interface GameStoreState {
  stage: GameStage;
  activePlayer: CharacterId;
  selectedHover: CharacterId | null;
  galleries: GalleryConfig[];
  photos: PhotoRecord[];
  foreverUs: ForeverUsConfig;
  currentGalleryId: string;
  nearbyPhotoId: string | null;
  activePhotoId: string | null;
  discoveredPhotoIds: string[];
  secretRoomUnlocked: boolean;
  secretRoomEntered: boolean;
  nearAlbatrossPortal: boolean;
  albatrossUnlocked: boolean;
  isPhotoManagerOpen: boolean;
  managerFocusPhotoId: string | null;
  isPointerLocked: boolean;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  isHydrated: boolean;
  teleportTarget: [number, number, number] | null;
  mobileInput: MobileInputState;

  hydrate: () => Promise<void>;
  setStage: (stage: GameStage) => void;
  setActivePlayer: (id: CharacterId) => void;
  setSelectedHover: (id: CharacterId | null) => void;
  setCurrentGalleryId: (id: string) => void;
  setNearbyPhotoId: (id: string | null) => void;
  openMemoryViewer: (photoId: string) => void;
  closeMemoryViewer: () => void;
  stepMemoryPhoto: (dir: -1 | 1) => void;
  setPhotoManagerOpen: (open: boolean, focusPhotoId?: string | null) => void;
  setPointerLocked: (locked: boolean) => void;
  toggleMusic: () => void;
  toggleSfx: () => void;
  requestTeleport: (pos: [number, number, number]) => void;
  clearTeleport: () => void;
  setMobileMove: (x: number, y: number) => void;
  addMobileLookDelta: (dx: number, dy: number) => void;
  consumeMobileLookDelta: () => { dx: number; dy: number };
  enterSecretRoom: () => void;
  setNearAlbatrossPortal: (near: boolean) => void;
  openAlbatrossRoom: () => void;
  startAlbatrossFlight: () => void;
  returnToInitialStage: () => void;

  // Photo & gallery management mutations (persisted to IndexedDB)
  addPhotos: (newPhotos: PhotoRecord[]) => Promise<void>;
  updatePhoto: (photo: PhotoRecord) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;
  reorderGalleryPhotos: (galleryId: string, orderedIds: string[]) => Promise<void>;
  addGallery: (gallery: GalleryConfig) => Promise<void>;
  updateForeverUs: (config: ForeverUsConfig) => Promise<void>;
  restoreFromBackup: (
    photos: PhotoRecord[],
    galleries: GalleryConfig[],
    foreverUs: ForeverUsConfig
  ) => Promise<void>;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  stage: 'WELCOME',
  activePlayer: 'MUNNA',
  selectedHover: null,
  galleries: DEFAULT_GALLERIES,
  photos: INITIAL_PHOTOS,
  foreverUs: DEFAULT_FOREVER_US,
  currentGalleryId: 'atrium',
  nearbyPhotoId: null,
  activePhotoId: null,
  discoveredPhotoIds: [],
  secretRoomUnlocked: true,
  secretRoomEntered: false,
  nearAlbatrossPortal: false,
  albatrossUnlocked: false,
  isPhotoManagerOpen: false,
  managerFocusPhotoId: null,
  isPointerLocked: false,
  musicEnabled: true,
  sfxEnabled: true,
  isHydrated: false,
  teleportTarget: null,
  mobileInput: { moveX: 0, moveY: 0, lookDeltaX: 0, lookDeltaY: 0 },

  hydrate: async () => {
    try {
      const [storedPhotos, storedGalleries, storedForever] = await Promise.all([
        photoStorage.getAll(),
        galleryStorage.getAll(),
        settingsStorage.getForeverUs(),
      ]);

      let finalGalleries = storedGalleries;
      if (finalGalleries.length === 0) {
        finalGalleries = DEFAULT_GALLERIES;
        await galleryStorage.putMany(DEFAULT_GALLERIES);
      }

      let finalPhotos = storedPhotos;
      if (finalPhotos.length === 0) {
        finalPhotos = INITIAL_PHOTOS;
        await photoStorage.putMany(INITIAL_PHOTOS);
      } else {
        // Ensure built-in mini-album entries retain valid URLs & none are missing from older DB versions
        const initialById = new Map(INITIAL_PHOTOS.map((p) => [p.id, p]));
        let repaired = false;
        finalPhotos = finalPhotos.map((p) => {
          const def = initialById.get(p.id);
          if (def && !p.frameBlob && (!p.frameUrl || !p.fullUrl)) {
            repaired = true;
            return { ...p, frameUrl: def.frameUrl, fullUrl: def.fullUrl };
          }
          return p;
        });
        if (repaired) {
          await photoStorage.putMany(finalPhotos);
        }
      }

      let finalForever = storedForever;
      if (!finalForever) {
        finalForever = DEFAULT_FOREVER_US;
        await settingsStorage.putForeverUs(DEFAULT_FOREVER_US);
      }

      set({
        photos: finalPhotos,
        galleries: finalGalleries,
        foreverUs: finalForever,
        isHydrated: true,
      });
    } catch (err) {
      console.error('IndexedDB hydration failed, using defaults:', err);
      set({ isHydrated: true });
    }
  },

  setStage: (stage) => set({ stage }),
  setActivePlayer: (activePlayer) => set({ activePlayer }),
  setSelectedHover: (selectedHover) => set({ selectedHover }),

  setCurrentGalleryId: (id) => {
    if (get().currentGalleryId !== id) {
      audioService.playRoomTransition();
      set({ currentGalleryId: id });
    }
  },

  setNearbyPhotoId: (nearbyPhotoId) => set({ nearbyPhotoId }),

  openMemoryViewer: (photoId) => {
    audioService.playPhotoInteract();
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    set((s) => ({
      stage: 'MEMORY_VIEWER',
      activePhotoId: photoId,
      isPointerLocked: false,
      discoveredPhotoIds: s.discoveredPhotoIds.includes(photoId)
        ? s.discoveredPhotoIds
        : [...s.discoveredPhotoIds, photoId],
    }));
  },

  closeMemoryViewer: () => set({ stage: 'MUSEUM', activePhotoId: null }),

  stepMemoryPhoto: (dir) => {
    const { activePhotoId, photos } = get();
    if (!activePhotoId || photos.length === 0) return;
    const current = photos.find((p) => p.id === activePhotoId);
    const sameGallery = current
      ? photos
          .filter((p) => p.galleryId === current.galleryId)
          .sort((a, b) => a.order - b.order)
      : photos;
    const pool = sameGallery.length > 1 ? sameGallery : photos;
    const idx = pool.findIndex((p) => p.id === activePhotoId);
    const nextIdx = (idx + dir + pool.length) % pool.length;
    const nextId = pool[nextIdx].id;
    audioService.playPhotoInteract();
    set((s) => ({
      activePhotoId: nextId,
      discoveredPhotoIds: s.discoveredPhotoIds.includes(nextId)
        ? s.discoveredPhotoIds
        : [...s.discoveredPhotoIds, nextId],
    }));
  },

  setPhotoManagerOpen: (open, focusPhotoId = null) => {
    if (open && document.pointerLockElement) {
      document.exitPointerLock();
    }
    set({
      isPhotoManagerOpen: open,
      managerFocusPhotoId: open ? focusPhotoId : null,
      isPointerLocked: open ? false : get().isPointerLocked,
    });
  },

  setPointerLocked: (isPointerLocked) => set({ isPointerLocked }),

  toggleMusic: () => {
    const next = !get().musicEnabled;
    audioService.setMusicEnabled(next);
    set({ musicEnabled: next });
  },

  toggleSfx: () => {
    const next = !get().sfxEnabled;
    audioService.setSfxEnabled(next);
    set({ sfxEnabled: next });
  },

  requestTeleport: (teleportTarget) => set({ teleportTarget }),
  clearTeleport: () => set({ teleportTarget: null }),

  setMobileMove: (moveX, moveY) =>
    set((s) => ({ mobileInput: { ...s.mobileInput, moveX, moveY } })),

  addMobileLookDelta: (dx, dy) =>
    set((s) => ({
      mobileInput: {
        ...s.mobileInput,
        lookDeltaX: s.mobileInput.lookDeltaX + dx,
        lookDeltaY: s.mobileInput.lookDeltaY + dy,
      },
    })),

  consumeMobileLookDelta: () => {
    const { lookDeltaX, lookDeltaY } = get().mobileInput;
    if (lookDeltaX !== 0 || lookDeltaY !== 0) {
      set((s) => ({
        mobileInput: { ...s.mobileInput, lookDeltaX: 0, lookDeltaY: 0 },
      }));
    }
    return { dx: lookDeltaX, dy: lookDeltaY };
  },

  enterSecretRoom: () => {
    if (!get().secretRoomEntered) {
      audioService.playRoomTransition();
      set({ secretRoomEntered: true });
    }
  },

  setNearAlbatrossPortal: (nearAlbatrossPortal) => {
    if (get().nearAlbatrossPortal !== nearAlbatrossPortal) {
      set({ nearAlbatrossPortal });
    }
  },

  openAlbatrossRoom: () => {
    audioService.playRoomTransition();
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    set({
      stage: 'ALBATROSS_ROOM',
      isPointerLocked: false,
      nearAlbatrossPortal: false,
      nearbyPhotoId: null,
      activePhotoId: null,
    });
  },

  startAlbatrossFlight: () => {
    audioService.playAlbatrossTransform();
    set({ stage: 'ALBATROSS_FLIGHT', albatrossUnlocked: true });
  },

  returnToInitialStage: () => {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    set({
      stage: 'WELCOME',
      currentGalleryId: 'atrium',
      nearbyPhotoId: null,
      activePhotoId: null,
      nearAlbatrossPortal: false,
      isPointerLocked: false,
      isPhotoManagerOpen: false,
      albatrossUnlocked: true,
    });
  },

  addPhotos: async (newPhotos) => {
    await photoStorage.putMany(newPhotos);
    set((s) => ({ photos: [...s.photos, ...newPhotos] }));
  },

  updatePhoto: async (photo) => {
    await photoStorage.put(photo);
    set((s) => ({
      photos: s.photos.map((p) => (p.id === photo.id ? photo : p)),
    }));
  },

  deletePhoto: async (id) => {
    await photoStorage.delete(id);
    set((s) => ({
      photos: s.photos.filter((p) => p.id !== id),
    }));
  },

  reorderGalleryPhotos: async (galleryId, orderedIds) => {
    const updated = get().photos.map((p) => {
      if (p.galleryId !== galleryId) return p;
      const newOrder = orderedIds.indexOf(p.id);
      return newOrder >= 0 ? { ...p, order: newOrder } : p;
    });
    const touched = updated.filter((p) => p.galleryId === galleryId);
    await photoStorage.putMany(touched);
    set({ photos: updated });
  },

  addGallery: async (gallery) => {
    await galleryStorage.put(gallery);
    set((s) => ({ galleries: [...s.galleries, gallery] }));
  },

  updateForeverUs: async (foreverUs) => {
    await settingsStorage.putForeverUs(foreverUs);
    set({ foreverUs });
  },

  restoreFromBackup: async (photos, galleries, foreverUs) => {
    await photoStorage.clear();
    await photoStorage.putMany(photos);
    await galleryStorage.putMany(galleries);
    await settingsStorage.putForeverUs(foreverUs);
    set({ photos, galleries, foreverUs });
  },
}));

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Download,
  FolderOpen,
  Heart,
  ImagePlus,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { optimizeUploadedImage } from '../../services/imageOptimizer';
import { backupService } from '../../services/backupService';
import { PhotoRecord } from '../../types/Photo';

export const PhotoManager: React.FC = () => {
  const isOpen = useGameStore((s) => s.isPhotoManagerOpen);
  const managerFocusPhotoId = useGameStore((s) => s.managerFocusPhotoId);
  const setOpen = useGameStore((s) => s.setPhotoManagerOpen);
  const photos = useGameStore((s) => s.photos);
  const galleries = useGameStore((s) => s.galleries);
  const foreverUs = useGameStore((s) => s.foreverUs);
  const addPhotos = useGameStore((s) => s.addPhotos);
  const updatePhoto = useGameStore((s) => s.updatePhoto);
  const deletePhoto = useGameStore((s) => s.deletePhoto);
  const reorderGalleryPhotos = useGameStore((s) => s.reorderGalleryPhotos);
  const addGallery = useGameStore((s) => s.addGallery);
  const updateForeverUs = useGameStore((s) => s.updateForeverUs);
  const restoreFromBackup = useGameStore((s) => s.restoreFromBackup);

  const [selectedGalleryId, setSelectedGalleryId] = useState<string>('gallery-1');
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [newGalleryName, setNewGalleryName] = useState('');
  const [busyMessage, setBusyMessage] = useState<string | null>(null);
  const [foreverHeading, setForeverHeading] = useState(foreverUs.heading);
  const [foreverMsg, setForeverMsg] = useState(foreverUs.message);

  useEffect(() => {
    setForeverHeading(foreverUs.heading);
    setForeverMsg(foreverUs.message);
  }, [foreverUs.heading, foreverUs.message]);

  useEffect(() => {
    if (isOpen && managerFocusPhotoId) {
      const target = photos.find((p) => p.id === managerFocusPhotoId);
      if (target) {
        setSelectedGalleryId(target.galleryId);
        setEditingPhotoId(target.id);
      }
    }
  }, [isOpen, managerFocusPhotoId, photos]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, setOpen]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const galleryPhotos = photos
    .filter((p) => p.galleryId === selectedGalleryId)
    .sort((a, b) => a.order - b.order);

  const editingPhoto = photos.find((p) => p.id === editingPhotoId) ?? galleryPhotos[0] ?? null;

  const importFiles = async (files: File[]) => {
    const valid = files.filter((f) => /\.(jpe?g|png|webp)$/i.test(f.name) || f.type.startsWith('image/'));
    if (valid.length === 0) {
      setBusyMessage('No supported JPG, JPEG, PNG, or WebP photographs found.');
      return;
    }
    setBusyMessage(`Optimizing & importing ${valid.length} photograph(s) to IndexedDB...`);
    try {
      const baseOrder = galleryPhotos.length;
      const created: PhotoRecord[] = [];
      for (let i = 0; i < valid.length; i++) {
        const f = valid[i];
        const opt = await optimizeUploadedImage(f);
        created.push({
          id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          fileName: f.name,
          galleryId: selectedGalleryId,
          order: baseOrder + i,
          title: f.name.replace(/\.[^.]+$/, ''),
          description: '',
          date: '',
          location: '',
          width: opt.width,
          height: opt.height,
          orientation: opt.orientation,
          frameBlob: opt.frameBlob,
          fullBlob: opt.fullBlob,
          frameUrl: URL.createObjectURL(opt.frameBlob),
          fullUrl: URL.createObjectURL(opt.fullBlob),
          source: 'user-import',
        });
      }
      await addPhotos(created);
      setEditingPhotoId(created[0]?.id ?? null);
      setBusyMessage(`Imported ${created.length} photograph(s) into IndexedDB.`);
    } catch (err) {
      setBusyMessage(`Import error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleBrowseFolder = async () => {
    const picker = (window as unknown as { showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker;
    if (!picker) {
      fileInputRef.current?.click();
      return;
    }
    try {
      const dirHandle = await picker();
      const collected: File[] = [];
      const walk = async (handle: FileSystemDirectoryHandle) => {
        for await (const [, entry] of (handle as unknown as { entries(): AsyncIterable<[string, FileSystemHandle]> }).entries()) {
          if (entry.kind === 'file') {
            const f = await (entry as FileSystemFileHandle).getFile();
            if (/\.(jpe?g|png|webp)$/i.test(f.name)) collected.push(f);
          } else if (entry.kind === 'directory') {
            await walk(entry as FileSystemDirectoryHandle);
          }
        }
      };
      await walk(dirHandle);
      await importFiles(collected);
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        fileInputRef.current?.click();
      }
    }
  };

  const handleReplaceImage = async (file: File) => {
    if (!editingPhoto) return;
    setBusyMessage('Replacing photograph...');
    const opt = await optimizeUploadedImage(file);
    await updatePhoto({
      ...editingPhoto,
      fileName: file.name,
      width: opt.width,
      height: opt.height,
      orientation: opt.orientation,
      frameBlob: opt.frameBlob,
      fullBlob: opt.fullBlob,
      frameUrl: URL.createObjectURL(opt.frameBlob),
      fullUrl: URL.createObjectURL(opt.fullBlob),
      source: 'user-import',
    });
    setBusyMessage('Photograph replaced and saved.');
  };

  const handleMove = async (photoId: string, dir: -1 | 1) => {
    const ids = galleryPhotos.map((p) => p.id);
    const idx = ids.indexOf(photoId);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= ids.length) return;
    [ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]];
    await reorderGalleryPhotos(selectedGalleryId, ids);
  };

  const handleAddGallery = async () => {
    const trimmed = newGalleryName.trim();
    if (!trimmed) return;
    const idx = galleries.length + 1;
    const id = `gallery-custom-${Date.now()}`;
    await addGallery({
      id,
      index: idx,
      name: trimmed.toUpperCase(),
      subtitle: `Gallery ${idx}`,
      accentColor: '#d4af6a',
      wallColor: '#efe7da',
      wainscotColor: '#3b281e',
      floorTint: '#e7ddd0',
      ambientHex: '#fff3e0',
      spotHex: '#ffdca8',
      center: [0, 0, 12],
      halfSize: [5.8, 5.8],
    });
    setNewGalleryName('');
    setSelectedGalleryId(id);
  };

  const handleExportBackup = async () => {
    setBusyMessage('Creating encrypted-local JSON backup...');
    const payload = await backupService.createBackup(photos, galleries, foreverUs);
    backupService.downloadBackupJson(payload);
    setBusyMessage('Backup JSON downloaded.');
  };

  const handleRestoreBackup = async (file: File) => {
    setBusyMessage('Restoring backup...');
    try {
      const txt = await file.text();
      const restored = backupService.parseBackupPayload(txt);
      await restoreFromBackup(restored.photos, restored.galleries, restored.foreverUs);
      setBusyMessage('Backup restored successfully!');
    } catch (err) {
      setBusyMessage(`Restore failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-md sm:p-6">
      <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#d4af6a]/40 bg-[#17110d] text-[#f5efe6] shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d4af6a]/20 px-5 py-4">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#d4af6a]">
              Owner Administration · IndexedDB Persistent Storage
            </span>
            <h2 className="font-serif text-2xl font-semibold text-[#f8efe1]">
              Manage Museum Photographs &amp; Galleries
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBrowseFolder}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#d4af6a] bg-[#d4af6a] px-4 py-1.5 text-xs font-semibold text-[#1a120d] hover:bg-[#e4c17c]"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              Browse Folder (Mini Album)
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#d4af6a]/50 bg-[#271b14] px-4 py-1.5 text-xs font-medium text-[#f5efe6] hover:border-[#d4af6a]"
            >
              <ImagePlus className="h-3.5 w-3.5 text-[#d4af6a]" />
              Add Photos
            </button>
            <button
              onClick={handleExportBackup}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs hover:bg-white/15"
            >
              <Download className="h-3.5 w-3.5 text-[#d4af6a]" />
              Backup
            </button>
            <button
              onClick={() => backupInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs hover:bg-white/15"
            >
              <Upload className="h-3.5 w-3.5 text-[#d4af6a]" />
              Restore
            </button>
            <button
              onClick={() => setOpen(false)}
              className="ml-1 rounded-full border border-white/15 bg-white/5 p-2 hover:bg-white/15"
              aria-label="Close manager"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void importFiles(Array.from(e.target.files));
            e.target.value = '';
          }}
        />
        <input
          ref={replaceInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleReplaceImage(f);
            e.target.value = '';
          }}
        />
        <input
          ref={backupInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleRestoreBackup(f);
            e.target.value = '';
          }}
        />

        {busyMessage && (
          <div className="border-b border-[#d4af6a]/20 bg-[#2a1d15] px-5 py-2 text-xs text-[#f2d291]">
            {busyMessage}
          </div>
        )}

        {/* Body */}
        <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-12">
          {/* Left: Galleries */}
          <div className="border-b border-[#d4af6a]/15 p-4 md:col-span-3 md:overflow-y-auto md:border-b-0 md:border-r">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#b9a68e]">
              Galleries ({galleries.length})
            </p>
            <div className="space-y-1.5">
              {galleries.map((g) => {
                const count = photos.filter((p) => p.galleryId === g.id).length;
                const active = selectedGalleryId === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => {
                      setSelectedGalleryId(g.id);
                      setEditingPhotoId(null);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition ${
                      active
                        ? 'border-[#d4af6a] bg-[#2a1d15] text-[#f8efe1]'
                        : 'border-white/5 bg-white/[0.02] text-[#c7b69f] hover:border-[#d4af6a]/40'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="text-[10px] text-[#d4af6a]">{g.subtitle}</div>
                      <div className="truncate font-semibold">{g.name}</div>
                    </div>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex gap-1.5">
              <input
                value={newGalleryName}
                onChange={(e) => setNewGalleryName(e.target.value)}
                placeholder="New gallery title..."
                className="w-full rounded-lg border border-white/15 bg-[#110c09] px-2.5 py-1.5 text-xs text-[#f5efe6] focus:border-[#d4af6a] focus:outline-none"
              />
              <button
                onClick={handleAddGallery}
                className="rounded-lg border border-[#d4af6a]/50 bg-[#2a1d15] px-2.5 text-[#d4af6a] hover:bg-[#3a281d]"
                title="Create gallery"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Secret Room Message Editor */}
            <div className="mt-6 rounded-xl border border-[#d4af6a]/25 bg-[#1f1510] p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d4af6a]">
                <Heart className="h-3 w-3" /> Forever Us Message
              </div>
              <input
                value={foreverHeading}
                onChange={(e) => setForeverHeading(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-[#120d0a] px-2.5 py-1.5 text-xs"
              />
              <textarea
                rows={4}
                value={foreverMsg}
                onChange={(e) => setForeverMsg(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-[#120d0a] px-2.5 py-1.5 text-xs"
              />
              <button
                onClick={() => {
                  void updateForeverUs({
                    ...foreverUs,
                    heading: foreverHeading,
                    message: foreverMsg,
                  });
                  setBusyMessage('Forever Us Room message updated!');
                }}
                className="mt-2 w-full rounded-lg bg-[#d4af6a] py-1.5 text-xs font-semibold text-[#1a120d]"
              >
                Save Secret Room Message
              </button>
            </div>
          </div>

          {/* Middle: Gallery Photo List */}
          <div className="border-b border-[#d4af6a]/15 p-4 md:col-span-4 md:overflow-y-auto md:border-b-0 md:border-r">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#b9a68e]">
              Wall Arrangement ({galleryPhotos.length})
            </p>
            {galleryPhotos.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/15 p-6 text-center text-xs text-[#9c8b76]">
                No photos assigned to this gallery yet. Click “Browse Folder” or “Add Photos” above.
              </div>
            ) : (
              <div className="space-y-2">
                {galleryPhotos.map((p, idx) => (
                  <div
                    key={p.id}
                    onClick={() => setEditingPhotoId(p.id)}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-2 transition ${
                      editingPhoto?.id === p.id
                        ? 'border-[#d4af6a] bg-[#2a1d15]'
                        : 'border-white/5 bg-white/[0.02] hover:border-white/20'
                    }`}
                  >
                    <img
                      src={p.frameUrl}
                      alt={p.title}
                      className="h-14 w-14 flex-shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold">{p.title || p.fileName}</div>
                      <div className="text-[10px] text-[#a7957f]">
                        {p.orientation} · {p.date || 'No date'}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => void handleMove(p.id, -1)}
                        disabled={idx === 0}
                        className="rounded bg-white/5 p-1 hover:bg-white/15 disabled:opacity-25"
                        title="Move earlier"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => void handleMove(p.id, 1)}
                        disabled={idx === galleryPhotos.length - 1}
                        className="rounded bg-white/5 p-1 hover:bg-white/15 disabled:opacity-25"
                        title="Move later"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Selected Photo Inspector */}
          <div className="overflow-y-auto p-5 md:col-span-5">
            {editingPhoto ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#d4af6a]">
                      Memory Details
                    </p>
                    <h3 className="font-serif text-xl font-semibold">{editingPhoto.fileName}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => replaceInputRef.current?.click()}
                      className="rounded-lg border border-white/15 px-3 py-1 text-xs hover:border-[#d4af6a]"
                    >
                      Replace
                    </button>
                    <button
                      onClick={() => {
                        void deletePhoto(editingPhoto.id);
                        setEditingPhotoId(null);
                      }}
                      className="rounded-lg border border-red-400/30 bg-red-500/10 p-1.5 text-red-300 hover:bg-red-500/20"
                      title="Delete photograph"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex h-44 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#100b08]">
                  <img
                    src={editingPhoto.frameUrl}
                    alt={editingPhoto.title}
                    className="max-h-full w-auto object-contain"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] text-[#b9a68e]">Title</label>
                    <input
                      value={editingPhoto.title}
                      onChange={(e) => void updatePhoto({ ...editingPhoto, title: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-[#100b08] px-3 py-1.5 text-xs focus:border-[#d4af6a] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#b9a68e]">Gallery</label>
                    <select
                      value={editingPhoto.galleryId}
                      onChange={(e) => {
                        const targetGalId = e.target.value;
                        const nextOrder = photos.filter((p) => p.galleryId === targetGalId).length;
                        void updatePhoto({ ...editingPhoto, galleryId: targetGalId, order: nextOrder });
                        setSelectedGalleryId(targetGalId);
                        setEditingPhotoId(editingPhoto.id);
                      }}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-[#100b08] px-3 py-1.5 text-xs focus:border-[#d4af6a] focus:outline-none"
                    >
                      {galleries.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.subtitle}: {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-[#b9a68e]">Date</label>
                    <input
                      value={editingPhoto.date}
                      placeholder="YYYY-MM-DD"
                      onChange={(e) => void updatePhoto({ ...editingPhoto, date: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-[#100b08] px-3 py-1.5 text-xs focus:border-[#d4af6a] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#b9a68e]">Location (optional)</label>
                    <input
                      value={editingPhoto.location}
                      placeholder="e.g. Vallimalai, Vellore"
                      onChange={(e) =>
                        void updatePhoto({ ...editingPhoto, location: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-white/15 bg-[#100b08] px-3 py-1.5 text-xs focus:border-[#d4af6a] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-[#b9a68e]">Personal Description</label>
                  <textarea
                    rows={3}
                    value={editingPhoto.description}
                    placeholder="Write what this moment means to Munna & Azhagi..."
                    onChange={(e) =>
                      void updatePhoto({ ...editingPhoto, description: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-white/15 bg-[#100b08] px-3 py-2 text-xs focus:border-[#d4af6a] focus:outline-none"
                  />
                </div>

                <button
                  onClick={() => {
                    void updateForeverUs({ ...foreverUs, centerpiecePhotoId: editingPhoto.id });
                    setBusyMessage(`Set "${editingPhoto.title}" as Forever Us Room centerpiece!`);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-[#d4af6a]/50 bg-[#2a1d15] px-4 py-1.5 text-xs text-[#f2d291] hover:border-[#d4af6a]"
                >
                  <Heart className="h-3.5 w-3.5" />
                  Set as Forever Us Centerpiece
                </button>
              </div>
            ) : (
              <p className="text-xs text-[#9c8b76]">Select a photograph to edit its details.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Edit3, MapPin, X } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

export const MemoryViewer: React.FC = () => {
  const stage = useGameStore((s) => s.stage);
  const activePhotoId = useGameStore((s) => s.activePhotoId);
  const photos = useGameStore((s) => s.photos);
  const galleries = useGameStore((s) => s.galleries);
  const closeMemoryViewer = useGameStore((s) => s.closeMemoryViewer);
  const stepMemoryPhoto = useGameStore((s) => s.stepMemoryPhoto);
  const setPhotoManagerOpen = useGameStore((s) => s.setPhotoManagerOpen);

  useEffect(() => {
    if (stage !== 'MEMORY_VIEWER') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMemoryViewer();
      if (e.key === 'ArrowLeft') stepMemoryPhoto(-1);
      if (e.key === 'ArrowRight') stepMemoryPhoto(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stage, closeMemoryViewer, stepMemoryPhoto]);

  if (stage !== 'MEMORY_VIEWER' || !activePhotoId) return null;

  const photo = photos.find((p) => p.id === activePhotoId);
  if (!photo) return null;

  const gallery = galleries.find((g) => g.id === photo.galleryId);
  const galleryPool = photos
    .filter((p) => p.galleryId === photo.galleryId)
    .sort((a, b) => a.order - b.order);
  const poolIndex = Math.max(0, galleryPool.findIndex((p) => p.id === photo.id));

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0e0a08]/95 backdrop-blur-xl animate-fadeIn">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-[#d4af6a]/20 px-4 py-3 sm:px-8">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#d4af6a]">
            {gallery ? `${gallery.subtitle} · ${gallery.name}` : 'Memory Archive'} · Photo{' '}
            {poolIndex + 1} of {galleryPool.length}
          </span>
          <h3 className="font-serif text-xl font-semibold text-[#f8efe1] sm:text-2xl">
            {photo.title || photo.fileName}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              closeMemoryViewer();
              setPhotoManagerOpen(true, photo.id);
            }}
            className="flex items-center gap-1.5 rounded-full border border-[#d4af6a]/40 bg-[#241812] px-3.5 py-1.5 text-xs font-medium text-[#f5efe6] hover:border-[#d4af6a]"
          >
            <Edit3 className="h-3.5 w-3.5 text-[#d4af6a]" />
            <span className="hidden sm:inline">Edit Memory</span>
          </button>
          <button
            onClick={closeMemoryViewer}
            aria-label="Close memory viewer"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[#f5efe6] hover:bg-white/15"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Photo Canvas + Metadata */}
      <div className="relative flex flex-1 flex-col items-center justify-center gap-5 overflow-y-auto px-4 py-5 lg:flex-row lg:gap-10 lg:px-12">
        <button
          onClick={() => stepMemoryPhoto(-1)}
          aria-label="Previous photograph"
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-[#d4af6a]/40 bg-[#1a120d]/85 p-3 text-[#f8efe1] shadow-lg backdrop-blur-md transition hover:scale-105 hover:border-[#d4af6a] sm:left-6"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div className="flex max-h-[68vh] max-w-[82vw] items-center justify-center overflow-hidden rounded-xl border border-[#d4af6a]/40 bg-[#18110d] p-2 shadow-[0_24px_70px_rgba(0,0,0,0.85)] lg:max-w-[58vw]">
          <img
            src={photo.fullUrl}
            alt={photo.title || photo.fileName}
            className="max-h-[64vh] w-auto max-w-full rounded-lg object-contain"
          />
        </div>

        <div className="w-full max-w-md rounded-2xl border border-[#d4af6a]/25 bg-[#1b130e]/90 p-6 backdrop-blur-md">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#d4af6a]">
            Preserved Memory
          </p>
          <h4 className="mt-1 font-serif text-3xl font-semibold text-[#f8efe1]">
            {photo.title || photo.fileName}
          </h4>

          <div className="mt-4 flex flex-wrap gap-3 text-xs text-[#d6c5ad]">
            {photo.date && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d4af6a]/30 bg-[#271b14] px-3 py-1">
                <Calendar className="h-3.5 w-3.5 text-[#d4af6a]" />
                {photo.date}
              </span>
            )}
            {photo.location && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d4af6a]/30 bg-[#271b14] px-3 py-1">
                <MapPin className="h-3.5 w-3.5 text-[#d4af6a]" />
                {photo.location}
              </span>
            )}
          </div>

          <div className="mt-5 border-t border-white/10 pt-4">
            {photo.description ? (
              <p className="whitespace-pre-line font-serif text-lg leading-relaxed text-[#efe4d4]">
                {photo.description}
              </p>
            ) : (
              <p className="text-sm italic text-[#9e8d77]">
                No personal description added yet. Use “Edit Memory” to record your story, date, or location for this photograph.
              </p>
            )}
          </div>

          <p className="mt-5 text-[11px] text-[#8a7965]">
            Source file: {photo.fileName} · {photo.width}×{photo.height}
          </p>
        </div>

        <button
          onClick={() => stepMemoryPhoto(1)}
          aria-label="Next photograph"
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-[#d4af6a]/40 bg-[#1a120d]/85 p-3 text-[#f8efe1] shadow-lg backdrop-blur-md transition hover:scale-105 hover:border-[#d4af6a] sm:right-6"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

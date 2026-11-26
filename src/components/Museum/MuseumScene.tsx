import React, { Suspense, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { MuseumEnvironment } from '../../game/lighting/MuseumEnvironment';
import * as THREE from 'three';
import {
  Compass,
  Heart,
  Images,
  Music,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { MuseumWorld } from './MuseumWorld';
import { MuseumMiniMap } from './MuseumMiniMap';
import { PlayerController } from '../Player/PlayerController';
import { MemoryViewer } from '../MemoryViewer/MemoryViewer';
import { PhotoManager } from '../PhotoManager/PhotoManager';
import { MobileControls } from '../MobileControls/MobileControls';
import { useGameStore } from '../../store/gameStore';
import { CHARACTERS } from '../../data/characters/characters';

export const MuseumScene: React.FC = () => {
  const galleries = useGameStore((s) => s.galleries);
  const photos = useGameStore((s) => s.photos);
  const foreverUs = useGameStore((s) => s.foreverUs);
  const currentGalleryId = useGameStore((s) => s.currentGalleryId);
  const nearbyPhotoId = useGameStore((s) => s.nearbyPhotoId);
  const discoveredPhotoIds = useGameStore((s) => s.discoveredPhotoIds);
  const isPointerLocked = useGameStore((s) => s.isPointerLocked);
  const musicEnabled = useGameStore((s) => s.musicEnabled);
  const sfxEnabled = useGameStore((s) => s.sfxEnabled);
  const secretRoomEntered = useGameStore((s) => s.secretRoomEntered);
  const nearAlbatrossPortal = useGameStore((s) => s.nearAlbatrossPortal);
  const openAlbatrossRoom = useGameStore((s) => s.openAlbatrossRoom);
  const setPhotoManagerOpen = useGameStore((s) => s.setPhotoManagerOpen);
  const toggleMusic = useGameStore((s) => s.toggleMusic);
  const toggleSfx = useGameStore((s) => s.toggleSfx);
  const requestTeleport = useGameStore((s) => s.requestTeleport);
  const openMemoryViewer = useGameStore((s) => s.openMemoryViewer);

  const playerPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 13.5));
  const canvasDomRef = useRef<HTMLCanvasElement | null>(null);
  const [secretDoorOpen, setSecretDoorOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [closingModalOpen, setClosingModalOpen] = useState(false);

  const currentGallery = galleries.find((g) => g.id === currentGalleryId);
  const nearbyPhoto = nearbyPhotoId ? photos.find((p) => p.id === nearbyPhotoId) : null;

  const handleLockMouse = () => {
    const el = canvasDomRef.current;
    if (el && el.requestPointerLock && !('ontouchstart' in window)) {
      try {
        el.requestPointerLock();
      } catch {
        // Fallback drag look remains active
      }
    }
  };

  const handleJumpToGallery = (galleryId: string) => {
    const g = galleries.find((x) => x.id === galleryId);
    if (!g) return;
    if (g.isSecret) {
      setSecretDoorOpen(true);
      requestTeleport([0, 0, -58]);
    } else if (Math.abs(g.center[0]) !== 13) {
      requestTeleport([0, 0, 13.5]);
    } else {
      // Spawn cleanly inside doorway entrance of the chosen gallery
      const entryX = g.center[0] < 0 ? -6.8 : 6.8;
      requestTeleport([entryX, 0, g.center[2]]);
    }
    setNavOpen(false);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#140f0c] select-none">
      <Canvas
        dpr={[1, 1.25]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 2.2, 17], fov: 50, near: 0.1, far: 120 }}
        onCreated={({ gl }) => {
          canvasDomRef.current = gl.domElement;
        }}
        onDoubleClick={handleLockMouse}
      >
        <color attach="background" args={['#140f0c']} />
        <fog attach="fog" args={['#1a130e', 24, 72]} />

        <Suspense fallback={null}>
          <MuseumEnvironment intensity={0.35} />
          <MuseumWorld
            playerPosRef={playerPosRef}
            onSecretDoorChange={setSecretDoorOpen}
          />
          <PlayerController
            playerPosRef={playerPosRef}
            secretDoorOpen={secretDoorOpen}
          />
        </Suspense>
      </Canvas>

      {/* Top Museum HUD Bar */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-20 flex flex-wrap items-start justify-between gap-2 p-3 sm:p-5">
        {/* Current Gallery & Couple Pill */}
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-[#d4af6a]/30 bg-[#17110d]/80 px-4 py-2.5 backdrop-blur-md">
          <div className="flex -space-x-2">
            <div className="h-9 w-9 overflow-hidden rounded-full border border-[#d4af6a]/70">
              <img src={CHARACTERS.MUNNA.avatarPosterUrl} alt="Munna" className="h-full w-full object-cover" />
            </div>
            <div className="h-9 w-9 overflow-hidden rounded-full border border-[#e0a97b]/70">
              <img src={CHARACTERS.AZHAGI.avatarPosterUrl} alt="Azhagi" className="h-full w-full object-cover" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#d4af6a]">
              <span>MUNNA &amp; AZHAGI</span>
              <span>·</span>
              <span>
                {discoveredPhotoIds.length}/{photos.length} Memories
              </span>
            </div>
            <div className="font-serif text-lg font-semibold text-[#f8efe1]">
              {currentGallery
                ? `${currentGallery.subtitle}: ${currentGallery.name}`
                : currentGalleryId === 'corridor'
                ? 'Grand Gallery Corridor'
                : 'Grand Entrance Atrium'}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          <button
            onClick={() => setNavOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#d4af6a]/40 bg-[#17110d]/85 px-3.5 py-2 text-xs font-medium text-[#f5efe6] backdrop-blur-md hover:border-[#d4af6a]"
          >
            <Compass className="h-3.5 w-3.5 text-[#d4af6a]" />
            <span>Galleries</span>
          </button>
          <button
            onClick={() => setPhotoManagerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#d4af6a]/40 bg-[#17110d]/85 px-3.5 py-2 text-xs font-medium text-[#f5efe6] backdrop-blur-md hover:border-[#d4af6a]"
          >
            <Images className="h-3.5 w-3.5 text-[#d4af6a]" />
            <span className="hidden sm:inline">Manage Photos</span>
          </button>
          <button
            onClick={toggleMusic}
            className="rounded-full border border-white/15 bg-[#17110d]/85 p-2 text-[#dfd1bd] backdrop-blur-md hover:border-[#d4af6a]/60"
            title={musicEnabled ? 'Mute Ambient Music' : 'Play Ambient Music'}
          >
            <Music className={`h-4 w-4 ${musicEnabled ? 'text-[#d4af6a]' : 'opacity-40'}`} />
          </button>
          <button
            onClick={toggleSfx}
            className="rounded-full border border-white/15 bg-[#17110d]/85 p-2 text-[#dfd1bd] backdrop-blur-md hover:border-[#d4af6a]/60"
            title={sfxEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
          >
            {sfxEnabled ? (
              <Volume2 className="h-4 w-4 text-[#d4af6a]" />
            ) : (
              <VolumeX className="h-4 w-4 opacity-40" />
            )}
          </button>
        </div>
      </div>

      {/* Gallery Quick-Jump Drawer */}
      {navOpen && (
        <div className="fixed right-4 top-20 z-30 w-72 rounded-2xl border border-[#d4af6a]/40 bg-[#17110d]/95 p-3 shadow-2xl backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#d4af6a]">
              Museum Wing Guide
            </span>
            <button
              onClick={() => {
                requestTeleport([0, 0, 13.5]);
                setNavOpen(false);
              }}
              className="text-[11px] text-[#d4af6a] underline"
            >
              Entrance
            </button>
          </div>
          <div className="space-y-1.5">
            {galleries.map((g) => {
              const roomPhotos = photos.filter((p) => p.galleryId === g.id);
              const foundCount = roomPhotos.filter((p) => discoveredPhotoIds.includes(p.id)).length;
              return (
                <button
                  key={g.id}
                  onClick={() => handleJumpToGallery(g.id)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition ${
                    currentGalleryId === g.id
                      ? 'border-[#d4af6a] bg-[#2c1e16]'
                      : 'border-white/10 bg-white/[0.03] hover:border-[#d4af6a]/50'
                  }`}
                >
                  <div>
                    <div className="text-[10px] text-[#d4af6a]">{g.subtitle}</div>
                    <div className="font-semibold text-[#f8efe1]">{g.name}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-[#dfd1bd]">
                      {foundCount}/{roomPhotos.length}
                    </span>
                    {g.isSecret && <Sparkles className="h-3.5 w-3.5 text-[#f2cb85]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Secret Room Emotional Closing Banner */}
      {currentGalleryId === 'forever-us-secret' && secretRoomEntered && !closingModalOpen && !nearAlbatrossPortal && (
        <div className="pointer-events-auto fixed bottom-24 left-1/2 z-20 -translate-x-1/2">
          <button
            onClick={() => setClosingModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-[#f2cb85] bg-[#2a1b12]/90 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#f8e6c2] shadow-[0_0_30px_rgba(242,203,133,0.35)] backdrop-blur-md hover:scale-105"
          >
            <Heart className="h-4 w-4 text-[#f2cb85]" />
            Open Forever Us Reflection
          </button>
        </div>
      )}

      {/* Secret Wall Albatross Trial Prompt (behind centerpiece image — works on Desktop & Android) */}
      {nearAlbatrossPortal && (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-30 w-[92vw] max-w-md -translate-x-1/2 md:bottom-16">
          <button
            onClick={openAlbatrossRoom}
            className="pointer-events-auto flex w-full items-center justify-center gap-3 rounded-full border border-[#f7da97] bg-gradient-to-r from-[#2e1b13]/95 via-[#43271a]/95 to-[#2e1b13]/95 px-5 py-3 text-center text-xs font-semibold text-[#fff1d6] shadow-[0_0_35px_rgba(242,203,133,0.45)] backdrop-blur-md transition hover:scale-105 sm:text-sm"
          >
            <Sparkles className="h-4 w-4 flex-shrink-0 text-[#f5d590]" />
            <span>Click / Press E — Get your Albatross with Infinite Love</span>
          </button>
        </div>
      )}

      {/* Cinematic Closing Experience Modal */}
      {closingModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0d0907]/90 p-6 backdrop-blur-xl">
          <div className="max-w-xl rounded-3xl border border-[#d4af6a]/50 bg-gradient-to-b from-[#231711] to-[#140d0a] p-8 text-center shadow-2xl">
            <Sparkles className="mx-auto h-7 w-7 text-[#f2cb85]" />
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-[#d4af6a]">
              Our Little Universe · Forever Us
            </p>
            <h3 className="mt-2 font-serif text-4xl font-semibold text-[#f8efe1]">
              {foreverUs.heading}
            </h3>
            <p className="mt-4 font-serif text-xl italic leading-relaxed text-[#eadbc6]">
              “{foreverUs.message}”
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setClosingModalOpen(false)}
                className="rounded-full border border-[#d4af6a] bg-[#d4af6a] px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-[#1a120d]"
              >
                Continue Exploring
              </button>
              <button
                onClick={() => {
                  setClosingModalOpen(false);
                  setPhotoManagerOpen(true);
                }}
                className="rounded-full border border-[#d4af6a]/45 px-6 py-2.5 text-xs uppercase tracking-widest text-[#f5efe6]"
              >
                Edit This Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Proximity Interaction Prompt */}
      {nearbyPhoto && (
        <div className="pointer-events-none fixed bottom-16 left-1/2 z-20 hidden -translate-x-1/2 md:block">
          <button
            onClick={() => openMemoryViewer(nearbyPhoto.id)}
            className="pointer-events-auto flex items-center gap-3 rounded-full border border-[#d4af6a] bg-[#1a120d]/90 px-6 py-3 text-sm font-medium text-[#f8efe1] shadow-[0_10px_35px_rgba(0,0,0,0.65)] backdrop-blur-md transition hover:scale-105"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#d4af6a] text-xs font-bold text-[#1a120d]">
              E
            </span>
            <span>Press E to explore this memory</span>
          </button>
        </div>
      )}

      {/* Desktop Controls Hint Footer */}
      <div className="pointer-events-none fixed bottom-3 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-4 rounded-full border border-white/10 bg-[#140f0c]/70 px-5 py-1.5 text-[11px] text-[#cbb89d] backdrop-blur-md md:flex">
        <span>WASD — Walk</span>
        <span>·</span>
        <span>Drag or Double-Click — Look ({isPointerLocked ? 'ESC to release' : 'Locked off'})</span>
        <span>·</span>
        <span>E / Click Frame — Explore Memory</span>
      </div>

      <MuseumMiniMap
        playerPosRef={playerPosRef}
        galleries={galleries}
        photos={photos}
        discoveredPhotoIds={discoveredPhotoIds}
        currentGalleryId={currentGalleryId}
        onJumpToGallery={handleJumpToGallery}
      />
      <MobileControls />
      <MemoryViewer />
      <PhotoManager />
    </div>
  );
};

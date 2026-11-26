import React, { useEffect, useRef, useState } from 'react';
import { Eye } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

export const MobileControls: React.FC = () => {
  const stage = useGameStore((s) => s.stage);
  const nearbyPhotoId = useGameStore((s) => s.nearbyPhotoId);
  const openMemoryViewer = useGameStore((s) => s.openMemoryViewer);
  const setMobileMove = useGameStore((s) => s.setMobileMove);
  const addMobileLookDelta = useGameStore((s) => s.addMobileLookDelta);

  const [knob, setKnob] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const joyOriginRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const lookTouchRef = useRef<{ id: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const check = () => {
      const coarse = typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window || navigator.maxTouchPoints > 0);
      setIsTouchDevice(Boolean(coarse || window.innerWidth < 768));
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (stage !== 'MUSEUM' || !isTouchDevice) return null;

  const maxRadius = 42;

  const resetJoy = () => {
    joyOriginRef.current = null;
    setKnob({ x: 0, y: 0 });
    setMobileMove(0, 0);
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      {/* Left Virtual Joystick */}
      <div
        className="pointer-events-auto absolute bottom-7 left-6 flex h-28 w-28 touch-none items-center justify-center rounded-full border border-[#d4af6a]/45 bg-[#17110d]/60 backdrop-blur-md"
        onTouchStart={(e) => {
          const t = e.changedTouches[0];
          const rect = e.currentTarget.getBoundingClientRect();
          joyOriginRef.current = {
            id: t.identifier,
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          };
          const dx = t.clientX - joyOriginRef.current.x;
          const dy = t.clientY - joyOriginRef.current.y;
          const dist = Math.min(maxRadius, Math.hypot(dx, dy));
          const ang = Math.atan2(dy, dx);
          const kx = Math.cos(ang) * dist;
          const ky = Math.sin(ang) * dist;
          setKnob({ x: kx, y: ky });
          setMobileMove(kx / maxRadius, -ky / maxRadius);
        }}
        onTouchMove={(e) => {
          if (!joyOriginRef.current) return;
          for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if (t.identifier === joyOriginRef.current.id) {
              const dx = t.clientX - joyOriginRef.current.x;
              const dy = t.clientY - joyOriginRef.current.y;
              const dist = Math.min(maxRadius, Math.hypot(dx, dy));
              const ang = Math.atan2(dy, dx);
              const kx = Math.cos(ang) * dist;
              const ky = Math.sin(ang) * dist;
              setKnob({ x: kx, y: ky });
              setMobileMove(kx / maxRadius, -ky / maxRadius);
            }
          }
        }}
        onTouchEnd={resetJoy}
        onTouchCancel={resetJoy}
      >
        <div
          className="h-11 w-11 rounded-full border border-[#f5d590] bg-[#d4af6a]/75 shadow-lg"
          style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
        />
      </div>

      {/* Right Touch Look Area */}
      <div
        className="pointer-events-auto absolute bottom-24 right-0 top-20 w-1/2 touch-none"
        onTouchStart={(e) => {
          const t = e.changedTouches[0];
          lookTouchRef.current = { id: t.identifier, x: t.clientX, y: t.clientY };
        }}
        onTouchMove={(e) => {
          if (!lookTouchRef.current) return;
          for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if (t.identifier === lookTouchRef.current.id) {
              const dx = t.clientX - lookTouchRef.current.x;
              const dy = t.clientY - lookTouchRef.current.y;
              lookTouchRef.current = { id: t.identifier, x: t.clientX, y: t.clientY };
              addMobileLookDelta(dx * 1.4, dy * 1.2);
            }
          }
        }}
        onTouchEnd={() => {
          lookTouchRef.current = null;
        }}
        onTouchCancel={() => {
          lookTouchRef.current = null;
        }}
      />

      {/* Mobile Tap-to-Interact Memory Button */}
      {nearbyPhotoId && (
        <button
          onClick={() => openMemoryViewer(nearbyPhotoId)}
          className="pointer-events-auto absolute bottom-10 right-6 flex items-center gap-2 rounded-full border border-[#d4af6a] bg-[#d4af6a] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#1a120d] shadow-xl"
        >
          <Eye className="h-4 w-4" />
          Explore Memory
        </button>
      )}
    </div>
  );
};

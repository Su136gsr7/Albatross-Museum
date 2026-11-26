import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { Map as MapIcon, Minimize2 } from 'lucide-react';
import { GalleryConfig } from '../../types/Gallery';
import { PhotoRecord } from '../../types/Photo';

interface MuseumMiniMapProps {
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
  galleries: GalleryConfig[];
  photos: PhotoRecord[];
  discoveredPhotoIds: string[];
  currentGalleryId: string;
  onJumpToGallery: (galleryId: string) => void;
}

// World bounds mapped to SVG viewBox (0..180 x 0..240):
// X: [-22 .. +22] -> width 44m  => sx = 90 + x * 3.8
// Z: [-74 .. +19] -> height 93m => sy = 10 + (z + 74) * 2.35
const mapX = (x: number) => 90 + x * 3.8;
const mapZ = (z: number) => 12 + (z + 74) * 2.35;

export const MuseumMiniMap: React.FC<MuseumMiniMapProps> = ({
  playerPosRef,
  galleries,
  photos,
  discoveredPhotoIds,
  currentGalleryId,
  onJumpToGallery,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [pos, setPos] = useState({ x: 0, z: 13.5 });

  useEffect(() => {
    const id = window.setInterval(() => {
      const p = playerPosRef.current;
      setPos((prev) =>
        Math.abs(prev.x - p.x) < 0.08 && Math.abs(prev.z - p.z) < 0.08
          ? prev
          : { x: p.x, z: p.z }
      );
    }, 110);
    return () => clearInterval(id);
  }, [playerPosRef]);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="pointer-events-auto fixed bottom-4 right-4 z-20 hidden items-center gap-1.5 rounded-full border border-[#d4af6a]/45 bg-[#17110d]/85 px-3.5 py-2 text-xs text-[#f5efe6] shadow-lg backdrop-blur-md hover:border-[#d4af6a] md:inline-flex"
      >
        <MapIcon className="h-3.5 w-3.5 text-[#d4af6a]" />
        <span>Map</span>
      </button>
    );
  }

  return (
    <div className="pointer-events-auto fixed bottom-4 right-4 z-20 hidden w-48 overflow-hidden rounded-2xl border border-[#d4af6a]/35 bg-[#140e0b]/88 p-2.5 shadow-2xl backdrop-blur-md md:block">
      <div className="mb-1.5 flex items-center justify-between px-1">
        <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#d4af6a]">
          Museum Floorplan
        </span>
        <button
          onClick={() => setCollapsed(true)}
          title="Minimize floorplan"
          className="rounded p-0.5 text-[#b9a68e] hover:text-[#f5efe6]"
        >
          <Minimize2 className="h-3 w-3" />
        </button>
      </div>

      <svg viewBox="0 0 180 242" className="h-52 w-full">
        {/* Secret Forever Us Sanctuary */}
        <rect
          x={mapX(-9)}
          y={mapZ(-73)}
          width={18 * 3.8}
          height={18 * 2.35}
          rx={4}
          fill={currentGalleryId === 'forever-us-secret' ? 'rgba(212,175,106,0.28)' : 'rgba(54,34,22,0.75)'}
          stroke="#d4af6a"
          strokeWidth={1.1}
          className="cursor-pointer"
          onClick={() => onJumpToGallery('forever-us-secret')}
        />
        <text x={90} y={mapZ(-64) + 2} textAnchor="middle" fontSize="7" fill="#f5d590" pointerEvents="none">
          FOREVER US
        </text>

        {/* Central Spine Corridor */}
        <rect
          x={mapX(-2.8)}
          y={mapZ(-55)}
          width={5.6 * 3.8}
          height={61 * 2.35}
          fill="rgba(235,222,204,0.12)"
          stroke="rgba(212,175,106,0.35)"
          strokeWidth={0.8}
        />

        {/* Grand Entrance Atrium */}
        <rect
          x={mapX(-6)}
          y={mapZ(6)}
          width={12 * 3.8}
          height={12 * 2.35}
          rx={3}
          fill={currentGalleryId === 'atrium' ? 'rgba(212,175,106,0.22)' : 'rgba(235,222,204,0.14)'}
          stroke="rgba(212,175,106,0.5)"
          strokeWidth={0.9}
        />
        <text x={90} y={mapZ(12) + 2} textAnchor="middle" fontSize="6.5" fill="#d9c6ad" pointerEvents="none">
          ATRIUM
        </text>

        {/* 6 Wing Galleries */}
        {galleries
          .filter((g) => !g.isSecret && Math.abs(g.center[0]) === 13)
          .map((g) => {
            const [cx, , cz] = g.center;
            const active = currentGalleryId === g.id;
            const roomPhotos = photos.filter((p) => p.galleryId === g.id);
            const allDone = roomPhotos.length > 0 && roomPhotos.every((p) => discoveredPhotoIds.includes(p.id));
            return (
              <g key={g.id} className="cursor-pointer" onClick={() => onJumpToGallery(g.id)}>
                {/* Connecting Door Passage */}
                <rect
                  x={cx < 0 ? mapX(-5.5) : mapX(2.8)}
                  y={mapZ(cz - 1.7)}
                  width={2.7 * 3.8}
                  height={3.4 * 2.35}
                  fill="rgba(212,175,106,0.20)"
                />
                <rect
                  x={mapX(cx - 7.5)}
                  y={mapZ(cz - 7.5)}
                  width={15 * 3.8}
                  height={15 * 2.35}
                  rx={3}
                  fill={active ? 'rgba(212,175,106,0.30)' : 'rgba(255,244,228,0.09)'}
                  stroke={active ? '#f5d590' : allDone ? '#7fd69e' : 'rgba(212,175,106,0.45)'}
                  strokeWidth={active ? 1.4 : 0.85}
                />
                <text
                  x={mapX(cx)}
                  y={mapZ(cz) + 2}
                  textAnchor="middle"
                  fontSize="7"
                  fontWeight="bold"
                  fill={active ? '#fff3da' : '#d6c4aa'}
                >
                  {g.subtitle.replace('Gallery ', 'G')}
                </text>
              </g>
            );
          })}

        {/* Live Couple Marker */}
        <circle cx={mapX(pos.x)} cy={mapZ(pos.z)} r={5.2} fill="rgba(255,158,189,0.28)" />
        <circle cx={mapX(pos.x)} cy={mapZ(pos.z)} r={2.8} fill="#ff8fb3" stroke="#fff7ed" strokeWidth={1.1} />
      </svg>

      <div className="mt-1 flex items-center justify-between px-1 text-[9px] text-[#baa68c]">
        <span>Click any room to visit</span>
        <span className="text-[#f2cb85]">
          {discoveredPhotoIds.length}/{photos.length}
        </span>
      </div>
    </div>
  );
};

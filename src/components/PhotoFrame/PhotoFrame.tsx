import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { PlacedPhotoFrame } from '../../game/interactions/photoLayout';
import { loadMuseumTexture } from '../../game/interactions/photoTextures';
import { useGameStore } from '../../store/gameStore';

interface PhotoFrameProps {
  frame: PlacedPhotoFrame;
}

const FRAME_COLORS: Record<PlacedPhotoFrame['frameStyle'], { outer: string; metalness: number; roughness: number }> = {
  walnut: { outer: '#3a2318', metalness: 0.12, roughness: 0.48 },
  gold: { outer: '#cfa458', metalness: 0.82, roughness: 0.28 },
  champagne: { outer: '#b89a67', metalness: 0.65, roughness: 0.36 },
};

export const PhotoFrame: React.FC<PhotoFrameProps> = ({ frame }) => {
  const nearbyPhotoId = useGameStore((s) => s.nearbyPhotoId);
  const openMemoryViewer = useGameStore((s) => s.openMemoryViewer);
  const [hovered, setHovered] = useState(false);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  const isNearby = nearbyPhotoId === frame.photo.id;
  const active = isNearby || hovered;

  useEffect(() => {
    let cancelled = false;
    setTexture(null);

    void loadMuseumTexture(frame.photo.frameUrl, frame.photo.fullUrl)
      .then((tex) => {
        if (!cancelled) {
          setTexture(tex);
        }
      })
      .catch(() => {
        // Keep subtle warm matte placeholder if a user-uploaded blob is unreadable
      });

    return () => {
      cancelled = true;
    };
  }, [frame.photo.frameUrl, frame.photo.fullUrl]);

  const { artWidth, artHeight } = frame;
  const matWidth = artWidth + 0.18;
  const matHeight = artHeight + 0.18;
  const outerWidth = matWidth + 0.14;
  const outerHeight = matHeight + 0.14;
  const style = FRAME_COLORS[frame.frameStyle];

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    openMemoryViewer(frame.photo.id);
  };

  return (
    <group
      position={frame.position}
      rotation={[0, frame.rotationY, 0]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Outer Museum Molding Frame */}
      <mesh position={[0, 0, 0.03]} castShadow receiveShadow>
        <boxGeometry args={[outerWidth, outerHeight, 0.06]} />
        <meshStandardMaterial
          color={style.outer}
          metalness={style.metalness}
          roughness={style.roughness}
          emissive={active ? '#d4af6a' : '#000000'}
          emissiveIntensity={active ? 0.35 : 0}
        />
      </mesh>

      {/* Recessed Archival Cream Matboard */}
      <mesh position={[0, 0, 0.062]}>
        <boxGeometry args={[matWidth, matHeight, 0.015]} />
        <meshStandardMaterial color="#f5efe4" roughness={0.85} />
      </mesh>

      {/* Actual Photograph Surface */}
      <mesh position={[0, 0, 0.075]}>
        <planeGeometry args={[artWidth, artHeight]} />
        {texture ? (
          <meshStandardMaterial
            key={texture.uuid}
            color="#ffffff"
            map={texture}
            roughness={0.38}
            metalness={0.0}
            emissive="#ffffff"
            emissiveMap={texture}
            emissiveIntensity={active ? 0.52 : 0.36}
          />
        ) : (
          <meshStandardMaterial key="loading" color="#47362a" roughness={0.8} />
        )}
      </mesh>

      {/* Museum Brass Picture Rail Lamp */}
      <group position={[0, outerHeight / 2 + 0.18, 0.22]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.022, 0.022, Math.min(outerWidth * 0.65, 1.1), 12]} />
          <meshStandardMaterial color="#d4af6a" metalness={0.88} roughness={0.22} />
        </mesh>
        {/* Warm light bar */}
        <mesh position={[0, -0.02, 0]}>
          <boxGeometry args={[Math.min(outerWidth * 0.58, 0.98), 0.014, 0.025]} />
          <meshStandardMaterial
            color="#ffe5b4"
            emissive="#ffd288"
            emissiveIntensity={active ? 2.4 : 1.3}
          />
        </mesh>
        {/* Arm to wall */}
        <mesh position={[0, 0.0, -0.11]}>
          <boxGeometry args={[0.03, 0.03, 0.22]} />
          <meshStandardMaterial color="#b38c46" metalness={0.85} roughness={0.3} />
        </mesh>
      </group>

      {/* Subtle golden highlight aura when player is nearby */}
      {active && (
        <mesh position={[0, 0, 0.015]}>
          <planeGeometry args={[outerWidth + 0.14, outerHeight + 0.14]} />
          <meshBasicMaterial color="#f0c878" transparent opacity={0.24} />
        </mesh>
      )}
    </group>
  );
};

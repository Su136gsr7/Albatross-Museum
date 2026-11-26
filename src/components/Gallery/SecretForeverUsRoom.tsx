import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Text } from '@react-three/drei';
import { useGameStore } from '../../store/gameStore';
import { computeFrameDimensions } from '../../game/interactions/photoLayout';
import { loadMuseumTexture } from '../../game/interactions/photoTextures';
import { audioService } from '../../services/audioService';

interface SecretRoomProps {
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
  onDoorStateChange: (open: boolean) => void;
}

export const SecretForeverUsRoom: React.FC<SecretRoomProps> = ({
  playerPosRef,
  onDoorStateChange,
}) => {
  const photos = useGameStore((s) => s.photos);
  const foreverUs = useGameStore((s) => s.foreverUs);
  const openMemoryViewer = useGameStore((s) => s.openMemoryViewer);
  const enterSecretRoom = useGameStore((s) => s.enterSecretRoom);

  const leftDoorRef = useRef<THREE.Group>(null);
  const rightDoorRef = useRef<THREE.Group>(null);
  const [doorOpen, setDoorOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [centerTex, setCenterTex] = useState<THREE.Texture | null>(null);

  const centerpiece =
    photos.find((p) => p.id === foreverUs.centerpiecePhotoId) ||
    photos.find((p) => p.isForeverCenterpiece) ||
    photos[0];

  useEffect(() => {
    if (!centerpiece) return;
    let cancelled = false;
    setCenterTex(null);
    void loadMuseumTexture(centerpiece.fullUrl, centerpiece.frameUrl)
      .then((tex) => {
        if (!cancelled) {
          setCenterTex(tex);
        }
      })
      .catch(() => {
        // Ignore transient failure
      });
    return () => {
      cancelled = true;
    };
  }, [centerpiece]);

  useFrame((_, delta) => {
    const pz = playerPosRef.current.z;
    const px = playerPosRef.current.x;
    const nearPortal = Math.abs(px) < 3.4 && pz < -49.5;
    if (nearPortal && !doorOpen) {
      setDoorOpen(true);
      onDoorStateChange(true);
      audioService.playDoorOpen();
    }
    if (pz < -56) {
      enterSecretRoom();
    }

    const targetAngle = doorOpen ? Math.PI * 0.46 : 0;
    if (leftDoorRef.current) {
      leftDoorRef.current.rotation.y = THREE.MathUtils.lerp(
        leftDoorRef.current.rotation.y,
        -targetAngle,
        Math.min(1, delta * 3.2)
      );
    }
    if (rightDoorRef.current) {
      rightDoorRef.current.rotation.y = THREE.MathUtils.lerp(
        rightDoorRef.current.rotation.y,
        targetAngle,
        Math.min(1, delta * 3.2)
      );
    }
  });

  const dims = centerpiece ? computeFrameDimensions({ ...centerpiece, isForeverCenterpiece: true }) : { artWidth: 1.9, artHeight: 2.35 };

  return (
    <group>
      {/* Secret Sanctuary Double Doors at Z = -55 */}
      <group position={[0, 0, -55]}>
        <Text
          position={[0, 3.65, 0.28]}
          fontSize={0.22}
          color="#f2cb85"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.18}
        >
          THE FOREVER US ROOM
        </Text>

        {/* Left Door Leaf */}
        <group ref={leftDoorRef} position={[-1.75, 0, 0]}>
          <mesh position={[0.87, 1.72, 0]}>
            <boxGeometry args={[1.72, 3.44, 0.16]} />
            <meshStandardMaterial color="#382217" roughness={0.45} />
          </mesh>
          <mesh position={[0.87, 1.72, 0.09]}>
            <boxGeometry args={[1.35, 2.9, 0.03]} />
            <meshStandardMaterial color="#d4af6a" metalness={0.75} roughness={0.28} wireframe />
          </mesh>
        </group>

        {/* Right Door Leaf */}
        <group ref={rightDoorRef} position={[1.75, 0, 0]}>
          <mesh position={[-0.87, 1.72, 0]}>
            <boxGeometry args={[1.72, 3.44, 0.16]} />
            <meshStandardMaterial color="#382217" roughness={0.45} />
          </mesh>
          <mesh position={[-0.87, 1.72, 0.09]}>
            <boxGeometry args={[1.35, 2.9, 0.03]} />
            <meshStandardMaterial color="#d4af6a" metalness={0.75} roughness={0.28} wireframe />
          </mesh>
        </group>
      </group>

      {/* Secret Room Interior @ (0, 0, -64) */}
      <group position={[0, 0, -64]}>
        {/* Rich Warm Dark-Marble Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[18, 18]} />
          <meshStandardMaterial color="#2a1b14" roughness={0.32} metalness={0.15} />
        </mesh>

        {/* Golden Radial Floor Medallion */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]}>
          <ringGeometry args={[2.5, 2.7, 40]} />
          <meshStandardMaterial color="#d4af6a" metalness={0.75} roughness={0.28} emissive="#7a5b28" emissiveIntensity={0.25} />
        </mesh>

        {/* Central Elevated Dais */}
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[1.45, 1.65, 0.36, 32]} />
          <meshStandardMaterial color="#3d271c" roughness={0.40} />
        </mesh>
        <mesh position={[0, 0.37, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.42, 0.035, 10, 40]} />
          <meshStandardMaterial color="#f0c878" metalness={0.78} roughness={0.25} />
        </mesh>

        {/* Grand Centerpiece Frame */}
        {centerpiece && (
          <group
            position={[0, 1.95, 0]}
            onClick={(e) => {
              e.stopPropagation();
              openMemoryViewer(centerpiece.id);
            }}
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
            {/* Support Plinth */}
            <mesh position={[0, -0.75, 0]}>
              <boxGeometry args={[dims.artWidth + 0.5, 1.1, 0.35]} />
              <meshStandardMaterial color="#281a13" roughness={0.42} />
            </mesh>
            {/* Outer Gold Frame */}
            <mesh>
              <boxGeometry args={[dims.artWidth + 0.36, dims.artHeight + 0.36, 0.12]} />
              <meshStandardMaterial
                color="#d8af62"
                metalness={0.86}
                roughness={0.22}
                emissive="#f2cb85"
                emissiveIntensity={hovered ? 0.38 : 0.12}
              />
            </mesh>
            {/* Archival Mat */}
            <mesh position={[0, 0, 0.065]}>
              <boxGeometry args={[dims.artWidth + 0.18, dims.artHeight + 0.18, 0.02]} />
              <meshStandardMaterial color="#f5ede1" roughness={0.85} />
            </mesh>
            {/* Front Artwork */}
            <mesh position={[0, 0, 0.082]}>
              <planeGeometry args={[dims.artWidth, dims.artHeight]} />
              {centerTex ? (
                <meshStandardMaterial
                  key={centerTex.uuid}
                  color="#ffffff"
                  map={centerTex}
                  roughness={0.38}
                  emissive="#ffffff"
                  emissiveMap={centerTex}
                  emissiveIntensity={0.42}
                />
              ) : (
                <meshStandardMaterial key="loading" color="#47362a" roughness={0.8} />
              )}
            </mesh>
          </group>
        )}

        {/* Personal Dedication Wall Plaque on North Wall */}
        <group position={[0, 2.35, -8.72]}>
          <mesh>
            <boxGeometry args={[6.4, 2.4, 0.08]} />
            <meshStandardMaterial color="#1a110d" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0, 0.045]}>
            <boxGeometry args={[6.15, 2.15, 0.02]} />
            <meshStandardMaterial color="#d4af6a" metalness={0.8} roughness={0.28} wireframe />
          </mesh>
          <Text
            position={[0, 0.65, 0.06]}
            fontSize={0.28}
            color="#f5d590"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.12}
          >
            {foreverUs.heading}
          </Text>
          <Text
            position={[0, -0.15, 0.06]}
            fontSize={0.145}
            maxWidth={5.4}
            textAlign="center"
            lineHeight={1.45}
            color="#f2e6d5"
            anchorX="center"
            anchorY="middle"
          >
            {foreverUs.message}
          </Text>
        </group>

        <Sparkles count={45} scale={[14, 4.0, 14]} position={[0, 2.3, 0]} size={2.4} speed={0.22} color="#ffd78c" />
      </group>
    </group>
  );
};

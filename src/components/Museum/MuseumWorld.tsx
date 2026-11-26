import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { MUSEUM_WALLS } from '../../game/collision/museumCollision';
import { createMuseumTextures } from '../../game/lighting/museumTextures';
import { buildPlacedFrames } from '../../game/interactions/photoLayout';
import { useGameStore } from '../../store/gameStore';
import { PhotoFrame } from '../PhotoFrame/PhotoFrame';
import { SecretForeverUsRoom } from '../Gallery/SecretForeverUsRoom';

interface MuseumWorldProps {
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
  onSecretDoorChange: (open: boolean) => void;
}

export const MuseumWorld: React.FC<MuseumWorldProps> = ({
  playerPosRef,
  onSecretDoorChange,
}) => {
  const galleries = useGameStore((s) => s.galleries);
  const photos = useGameStore((s) => s.photos);
  const foreverUs = useGameStore((s) => s.foreverUs);

  const textures = useMemo(() => createMuseumTextures(), []);

  useEffect(() => {
    return () => {
      textures.dispose();
    };
  }, [textures]);

  const placedFrames = useMemo(
    () => buildPlacedFrames(galleries, photos, foreverUs.centerpiecePhotoId),
    [galleries, photos, foreverUs.centerpiecePhotoId]
  );

  const wingGalleries = useMemo(() => galleries.filter((g) => !g.isSecret), [galleries]);

  return (
    <group>
      {/* Global Warm Museum Lighting */}
      <ambientLight intensity={0.62} color="#fff1dc" />
      <hemisphereLight args={['#ffe8c8', '#3c2a1f', 0.55]} />
      <directionalLight
        position={[12, 18, 10]}
        intensity={0.95}
        color="#ffe8c4"
        castShadow
        shadow-bias={-0.0005}
        shadow-normalBias={0.03}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={90}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-80}
      />

      {/* Continuous Veined Marble Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -28]} receiveShadow>
        <planeGeometry args={[48, 102]} />
        <meshStandardMaterial
          map={textures.marbleFloor}
          roughnessMap={textures.marbleRoughness}
          roughness={0.28}
          metalness={0.08}
        />
      </mesh>

      {/* Subtle Warm Dark-Cream Ceiling Plane */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4.82, -28]}>
        <planeGeometry args={[48, 102]} />
        <meshStandardMaterial color="#dfd4c4" roughness={0.85} />
      </mesh>

      {/* Architectural Walls & Wainscoting */}
      {MUSEUM_WALLS.map((wall) => {
        const isWalnut = wall.variant === 'walnut';
        const isSecret = wall.variant === 'secret';
        const isGold = wall.variant === 'gold-trim';
        const gallery = wall.galleryId ? galleries.find((g) => g.id === wall.galleryId) : null;
        const wallColor = isGold
          ? '#d4af6a'
          : isSecret
          ? '#2e1f17'
          : isWalnut
          ? '#b89474'
          : gallery?.wallColor ?? '#efe7da';

        return (
          <group key={wall.id}>
            <mesh position={wall.position} castShadow receiveShadow>
              <boxGeometry args={wall.size} />
              <meshStandardMaterial
                map={isWalnut ? textures.walnutWood : isSecret || isGold ? null : textures.plasterWall}
                color={wallColor}
                roughness={isGold ? 0.28 : isWalnut ? 0.55 : 0.78}
                metalness={isGold ? 0.8 : 0.04}
              />
            </mesh>

            {/* Dark Walnut Baseboard Wainscoting on full-height walls */}
            {wall.size[1] > 4.0 && (
              <mesh position={[wall.position[0], 0.52, wall.position[2]]} receiveShadow>
                <boxGeometry args={[wall.size[0] + 0.04, 1.04, wall.size[2] + 0.04]} />
                <meshStandardMaterial
                  map={textures.walnutWood}
                  color={isSecret ? '#7a5a44' : '#c8a686'}
                  roughness={0.55}
                />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Grand Entrance Atrium Chandelier & Welcome Plaque */}
      <group position={[0, 0, 12]}>
        <pointLight position={[0, 4.2, 0]} intensity={24} distance={18} color="#ffe0ad" />
        <mesh position={[0, 4.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.15, 0.04, 12, 36]} />
          <meshStandardMaterial color="#d4af6a" metalness={0.88} roughness={0.22} emissive="#ffcf80" emissiveIntensity={0.45} />
        </mesh>
        <Text
          position={[0, 3.1, 5.72]}
          rotation={[0, Math.PI, 0]}
          fontSize={0.28}
          color="#d4af6a"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.14}
        >
          OUR LITTLE UNIVERSE
        </Text>
      </group>

      {/* Spine Corridor Warm Ceiling Strips & Lights */}
      {[0, -12, -22, -32, -42, -52].map((z) => (
        <group key={z} position={[0, 4.74, z]}>
          <mesh>
            <boxGeometry args={[1.4, 0.06, 0.24]} />
            <meshStandardMaterial color="#ffe5b8" emissive="#ffd188" emissiveIntensity={1.6} />
          </mesh>
          <pointLight position={[0, -0.35, 0]} intensity={16} distance={16} color="#ffe0b0" />
        </group>
      ))}
      <pointLight position={[0, 3.4, -53.2]} intensity={20} distance={14} color="#ffd588" />

      {/* Six Connected Gallery Interiors: Lighting, Doorway Signage & Center Rugs */}
      {wingGalleries.map((g) => {
        const [cx, , cz] = g.center;
        const isLeft = cx < 0;
        const doorSignX = isLeft ? -2.55 : 2.55;
        const doorSignRotY = isLeft ? Math.PI / 2 : -Math.PI / 2;

        return (
          <group key={g.id}>
            {/* Gallery Room Warm Overhead Light */}
            <pointLight position={[cx, 4.25, cz]} intensity={26} distance={18} color={g.spotHex} />
            <mesh position={[cx, 4.76, cz]}>
              <cylinderGeometry args={[0.9, 0.9, 0.05, 24]} />
              <meshStandardMaterial color="#fff0d4" emissive={g.spotHex} emissiveIntensity={1.4} />
            </mesh>

            {/* Distinct Floor Carpet / Inlay Accent */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.008, cz]} receiveShadow>
              <planeGeometry args={[6.4, 6.4]} />
              <meshStandardMaterial color={g.wainscotColor} roughness={0.92} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.011, cz]}>
              <ringGeometry args={[2.1, 2.22, 40]} />
              <meshStandardMaterial color={g.accentColor} metalness={0.75} roughness={0.3} />
            </mesh>

            {/* Brass Corridor Plaque Above Doorway */}
            <group position={[doorSignX, 3.62, cz]} rotation={[0, doorSignRotY, 0]}>
              <mesh>
                <boxGeometry args={[2.6, 0.56, 0.05]} />
                <meshStandardMaterial color="#241711" roughness={0.45} />
              </mesh>
              <mesh position={[0, 0, 0.03]}>
                <boxGeometry args={[2.46, 0.44, 0.02]} />
                <meshStandardMaterial color="#d4af6a" metalness={0.8} roughness={0.28} wireframe />
              </mesh>
              <Text
                position={[0, 0.09, 0.05]}
                fontSize={0.11}
                color="#d4af6a"
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.16}
              >
                {g.subtitle.toUpperCase()}
              </Text>
              <Text
                position={[0, -0.09, 0.05]}
                fontSize={0.145}
                color="#f7efe3"
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.08}
              >
                {g.name}
              </Text>
            </group>
          </group>
        );
      })}

      {/* All Actual Photograph Museum Frames */}
      {placedFrames.map((frame) => (
        <PhotoFrame key={frame.photo.id} frame={frame} />
      ))}

      {/* Secret Room: THE FOREVER US ROOM */}
      <SecretForeverUsRoom playerPosRef={playerPosRef} onDoorStateChange={onSecretDoorChange} />
    </group>
  );
};

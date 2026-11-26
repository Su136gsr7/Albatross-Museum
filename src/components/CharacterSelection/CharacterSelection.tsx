import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import { MuseumEnvironment } from '../../game/lighting/MuseumEnvironment';
import * as THREE from 'three';
import { CharacterModel } from '../../characters/CharacterModel';
import { CHARACTERS } from '../../data/characters/characters';
import { useGameStore } from '../../store/gameStore';
import { CharacterId } from '../../types/Character';
import { audioService } from '../../services/audioService';

interface PedestalProps {
  characterId: CharacterId;
  positionX: number;
  selected: boolean;
  hovered: boolean;
  onSelect: (id: CharacterId) => void;
  onHover: (id: CharacterId | null) => void;
}

const CharacterPedestal: React.FC<PedestalProps> = ({
  characterId,
  positionX,
  selected,
  hovered,
  onSelect,
  onHover,
}) => {
  const spinRef = useRef<THREE.Group>(null);
  const active = selected || hovered;

  useFrame((_, delta) => {
    if (spinRef.current) {
      // Keep characters facing front toward camera with subtle idle sway when selected
      const targetRot = selected ? Math.sin(performance.now() * 0.0012) * 0.14 : hovered ? 0.12 : 0;
      spinRef.current.rotation.y = THREE.MathUtils.lerp(spinRef.current.rotation.y, targetRot, Math.min(1, delta * 4));
    }
  });

  return (
    <group
      position={[positionX, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(characterId);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
        onHover(characterId);
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
        onHover(null);
      }}
    >
      {/* Marble & Gold Plinth */}
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <cylinderGeometry args={[0.85, 0.95, 0.24, 36]} />
        <meshStandardMaterial color={active ? '#3a271d' : '#251913'} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.245, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.84, 0.025, 12, 48]} />
        <meshStandardMaterial
          color={active ? '#f5d28a' : '#8d7244'}
          emissive={active ? '#d4af6a' : '#000000'}
          emissiveIntensity={active ? 0.55 : 0}
          metalness={0.85}
          roughness={0.25}
        />
      </mesh>

      {/* Spotlight above character */}
      <spotLight
        position={[0, 4.2, 1.8]}
        angle={0.45}
        penumbra={0.65}
        intensity={active ? 34 : 18}
        color={active ? '#ffe3b3' : '#ffd29d'}
        castShadow
        shadow-bias={-0.0005}
        shadow-normalBias={0.03}
      />

      {/* Realistic Character GLB */}
      <group ref={spinRef} position={[0, 0.24, 0]}>
        <CharacterModel
          characterId={characterId}
          animation={selected ? 'Wave' : 'Idle'}
          scale={1.08}
        />
      </group>
    </group>
  );
};

export const CharacterSelection: React.FC = () => {
  const { activePlayer, setActivePlayer, setStage } = useGameStore();
  const [hovered, setHovered] = useState<CharacterId | null>(null);
  const [chosen, setChosen] = useState<CharacterId>(activePlayer);

  const handleChoose = (id: CharacterId) => {
    audioService.playPhotoInteract();
    setChosen(id);
    setActivePlayer(id);
  };

  const handleConfirm = () => {
    audioService.playRoomTransition();
    setActivePlayer(chosen);
    setStage('CHARACTER_INTRO');
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#140f0c]">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 1.55, 4.6], fov: 42 }}>
        <color attach="background" args={['#140f0c']} />
        <fog attach="fog" args={['#140f0c', 6, 16]} />

        <ambientLight intensity={0.6} color="#ffe8cc" />
        <directionalLight position={[2.5, 4, 4]} intensity={1.3} color="#fff1dc" castShadow />
        <directionalLight position={[-3, 3, -2]} intensity={0.7} color="#d4af6a" />

        <Suspense fallback={null}>
          <MuseumEnvironment intensity={0.45} />
          <CharacterPedestal
            characterId="MUNNA"
            positionX={-1.25}
            selected={chosen === 'MUNNA'}
            hovered={hovered === 'MUNNA'}
            onSelect={handleChoose}
            onHover={setHovered}
          />
          <CharacterPedestal
            characterId="AZHAGI"
            positionX={1.25}
            selected={chosen === 'AZHAGI'}
            hovered={hovered === 'AZHAGI'}
            onSelect={handleChoose}
            onHover={setHovered}
          />
          <ContactShadows position={[0, 0.01, 0]} opacity={0.55} scale={10} blur={2.2} far={4} />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 2.6}
          maxPolarAngle={Math.PI / 1.95}
          target={[0, 1.15, 0]}
        />
      </Canvas>

      {/* Top Header */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center px-6 pt-6 text-center">
        <span className="text-[11px] font-medium uppercase tracking-[0.34em] text-[#d4af6a]">
          Choose Your Guide
        </span>
        <h2 className="mt-1 font-serif text-3xl font-semibold tracking-wider text-[#f7efe3] sm:text-5xl">
          Who Is Entering Today?
        </h2>
        <p className="mt-1 text-xs text-[#cbb89d]">
          Drag to inspect 3D models · Click a character or select below
        </p>
      </div>

      {/* Left / Right Selection Cards & Confirm Bar */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 bg-gradient-to-t from-[#120d0a] via-[#120d0a]/85 to-transparent px-4 pb-6 pt-12">
        <div className="pointer-events-auto grid w-full max-w-3xl grid-cols-2 gap-3 sm:gap-6">
          {(['MUNNA', 'AZHAGI'] as CharacterId[]).map((id) => {
            const prof = CHARACTERS[id];
            const isSel = chosen === id;
            return (
              <button
                key={id}
                onClick={() => handleChoose(id)}
                onMouseEnter={() => setHovered(id)}
                onMouseLeave={() => setHovered(null)}
                className={`flex flex-col items-start rounded-2xl border p-4 text-left backdrop-blur-md transition-all duration-300 ${
                  isSel
                    ? 'border-[#d4af6a] bg-[#2a1d15]/90 shadow-[0_0_28px_rgba(212,175,106,0.28)]'
                    : 'border-[#f5efe6]/15 bg-[#1b130e]/70 hover:border-[#d4af6a]/50'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-serif text-2xl font-semibold tracking-wider text-[#f8efe1]">
                    {prof.displayName}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${
                      isSel ? 'bg-[#d4af6a] text-[#1a120d]' : 'bg-white/10 text-[#cbb89d]'
                    }`}
                  >
                    {isSel ? 'Selected' : 'Select'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#c8b69e] line-clamp-2">{prof.tagline}</p>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleConfirm}
          className="pointer-events-auto rounded-full border border-[#d4af6a] bg-[#d4af6a] px-10 py-3.5 text-xs font-bold uppercase tracking-[0.26em] text-[#1a120d] shadow-[0_8px_32px_rgba(212,175,106,0.35)] transition-transform hover:scale-105"
        >
          Enter as {CHARACTERS[chosen].displayName}
        </button>
      </div>
    </div>
  );
};

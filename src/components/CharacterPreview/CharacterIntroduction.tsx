import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { MuseumEnvironment } from '../../game/lighting/MuseumEnvironment';
import { CharacterModel } from '../../characters/CharacterModel';
import { useGameStore } from '../../store/gameStore';

function CoupleIntroStage() {
  const groupRef = useRef<THREE.Group>(null);
  const syncClockRef = useRef<number>(0);

  useFrame(({ clock }, delta) => {
    syncClockRef.current += Math.min(delta, 0.05);
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.6) * 0.14;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.08, 0]}>
      <CharacterModel characterId="MUNNA" animation="Wave" position={[-0.265, 0, 0]} syncClockRef={syncClockRef} />
      <CharacterModel characterId="AZHAGI" animation="Wave" position={[0.265, 0, 0]} syncClockRef={syncClockRef} />
      <Sparkles count={24} scale={[1.4, 1.5, 0.8]} position={[0, 1.0, 0]} size={2.6} speed={0.4} color="#ff9ebd" />
    </group>
  );
}

export const CharacterIntroduction: React.FC = () => {
  const setStage = useGameStore((s) => s.setStage);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setStage('MUSEUM');
    }, 3400);
    return () => clearTimeout(timer);
  }, [setStage]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#140f0c]">
      <Canvas dpr={[1, 1.25]} gl={{ antialias: true, powerPreference: 'high-performance' }} camera={{ position: [0, 1.28, 2.75], fov: 40 }}>
        <color attach="background" args={['#140f0c']} />
        <ambientLight intensity={0.8} color="#ffe7c7" />
        <directionalLight position={[1.5, 3.8, 2.8]} intensity={1.1} color="#ffe0ac" />
        <Suspense fallback={null}>
          <MuseumEnvironment intensity={0.5} />
          <CoupleIntroStage />
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#120d0a] via-transparent to-[#120d0a]/60" />

      <div className="absolute inset-x-0 bottom-12 flex flex-col items-center px-6 text-center">
        <span className="text-xs font-medium uppercase tracking-[0.35em] text-[#d4af6a]">
          Hand in Hand · Grand Atrium
        </span>
        <h2 className="mt-2 font-serif text-4xl font-semibold tracking-wider text-[#f8efe1] sm:text-6xl">
          Munna &amp; Azhagi
        </h2>
        <p className="mt-3 max-w-md text-sm text-[#d4c3ac]">
          Walking together through every cherished memory we built.
        </p>
        <button
          onClick={() => setStage('MUSEUM')}
          className="mt-6 rounded-full border border-[#d4af6a]/60 bg-[#261a13]/85 px-6 py-2 text-xs uppercase tracking-[0.22em] text-[#f5efe6] backdrop-blur-md hover:border-[#d4af6a]"
        >
          Step Inside Now
        </button>
      </div>
    </div>
  );
};

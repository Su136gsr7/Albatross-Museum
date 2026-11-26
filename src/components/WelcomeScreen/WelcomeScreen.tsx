import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { audioService } from '../../services/audioService';

function MuseumExteriorScene({ doorsOpen }: { doorsOpen: boolean }) {
  const camRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 3.2, 16));
  const leftDoorRef = useRef<THREE.Group>(null);
  const rightDoorRef = useRef<THREE.Group>(null);

  const columns = useMemo(() => [-5.4, -3.6, -1.8, 1.8, 3.6, 5.4], []);

  useFrame(({ camera, clock }, delta) => {
    const t = clock.getElapsedTime();
    if (!doorsOpen) {
      camRef.current.set(Math.sin(t * 0.22) * 1.4, 2.9 + Math.sin(t * 0.35) * 0.2, 14.8 + Math.cos(t * 0.2) * 0.6);
      camera.position.lerp(camRef.current, Math.min(1, delta * 2.5));
      camera.lookAt(0, 2.4, 0);
    } else {
      camRef.current.set(0, 2.2, 4.5);
      camera.position.lerp(camRef.current, Math.min(1, delta * 1.6));
      camera.lookAt(0, 2.1, -6);
    }

    const targetAngle = doorsOpen ? Math.PI * 0.48 : 0;
    if (leftDoorRef.current) {
      leftDoorRef.current.rotation.y = THREE.MathUtils.lerp(leftDoorRef.current.rotation.y, -targetAngle, Math.min(1, delta * 3.5));
    }
    if (rightDoorRef.current) {
      rightDoorRef.current.rotation.y = THREE.MathUtils.lerp(rightDoorRef.current.rotation.y, targetAngle, Math.min(1, delta * 3.5));
    }
  });

  return (
    <>
      <color attach="background" args={['#120d0a']} />
      <fog attach="fog" args={['#120d0a', 10, 34]} />

      <ambientLight intensity={0.45} color="#ffdcb4" />
      <directionalLight position={[8, 14, 10]} intensity={1.8} color="#ffe3b8" castShadow />
      <pointLight position={[0, 5.2, 5.5]} intensity={22} distance={18} color="#ffcf87" />
      <pointLight position={[0, 3.0, -3.0]} intensity={32} distance={18} color="#ffd593" />

      {/* Warm reflective marble plaza */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 4]} receiveShadow>
        <planeGeometry args={[48, 36]} />
        <meshStandardMaterial color="#231a15" roughness={0.22} metalness={0.2} />
      </mesh>

      {/* Grand stepped entrance plinth */}
      {[0, 1, 2].map((step) => (
        <mesh key={step} position={[0, 0.12 + step * 0.16, 4.4 - step * 0.65]} receiveShadow>
          <boxGeometry args={[14 - step * 0.8, 0.16, 6.5 - step * 0.7]} />
          <meshStandardMaterial color="#e8dfd2" roughness={0.35} />
        </mesh>
      ))}

      {/* Museum Facade */}
      <mesh position={[-4.5, 3.8, 0.5]} castShadow receiveShadow>
        <boxGeometry args={[6.4, 7.0, 1.4]} />
        <meshStandardMaterial color="#eadfcf" roughness={0.55} />
      </mesh>
      <mesh position={[4.5, 3.8, 0.5]} castShadow receiveShadow>
        <boxGeometry args={[6.4, 7.0, 1.4]} />
        <meshStandardMaterial color="#eadfcf" roughness={0.55} />
      </mesh>
      {/* Pediment & Cornice */}
      <mesh position={[0, 7.6, 0.7]} castShadow>
        <boxGeometry args={[16.2, 0.9, 2.4]} />
        <meshStandardMaterial color="#3c261b" roughness={0.5} />
      </mesh>
      <mesh position={[0, 8.2, 0.8]}>
        <boxGeometry args={[16.6, 0.18, 2.6]} />
        <meshStandardMaterial color="#d4af6a" metalness={0.75} roughness={0.28} />
      </mesh>
      {/* Doorway arch lintel */}
      <mesh position={[0, 5.8, 0.5]}>
        <boxGeometry args={[3.4, 2.9, 1.4]} />
        <meshStandardMaterial color="#3c261b" roughness={0.45} />
      </mesh>

      {/* Neoclassical Golden-Trimmed Columns */}
      {columns.map((x) => (
        <group key={x} position={[x, 0.52, 2.2]}>
          <mesh position={[0, 3.3, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.28, 0.34, 6.6, 20]} />
            <meshStandardMaterial color="#efe6d8" roughness={0.4} />
          </mesh>
          <mesh position={[0, 6.65, 0]}>
            <boxGeometry args={[0.85, 0.24, 0.85]} />
            <meshStandardMaterial color="#d4af6a" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <boxGeometry args={[0.88, 0.24, 0.88]} />
            <meshStandardMaterial color="#3c261b" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Warm Glowing Interior Corridor behind the doors */}
      <mesh position={[0, 2.2, -4]}>
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial color="#ffd79d" emissive="#ffb85c" emissiveIntensity={1.4} />
      </mesh>

      {/* Animated Double Walnut & Brass Entrance Doors */}
      <group ref={leftDoorRef} position={[-1.3, 0.52, 0.8]}>
        <mesh position={[0.65, 1.95, 0]} castShadow>
          <boxGeometry args={[1.28, 3.9, 0.14]} />
          <meshStandardMaterial color="#352117" roughness={0.45} />
        </mesh>
        <mesh position={[0.65, 1.95, 0.08]}>
          <boxGeometry args={[0.92, 3.2, 0.03]} />
          <meshStandardMaterial color="#d4af6a" metalness={0.8} roughness={0.28} wireframe />
        </mesh>
        <mesh position={[1.1, 1.85, 0.11]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#f2cf88" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      <group ref={rightDoorRef} position={[1.3, 0.52, 0.8]}>
        <mesh position={[-0.65, 1.95, 0]} castShadow>
          <boxGeometry args={[1.28, 3.9, 0.14]} />
          <meshStandardMaterial color="#352117" roughness={0.45} />
        </mesh>
        <mesh position={[-0.65, 1.95, 0.08]}>
          <boxGeometry args={[0.92, 3.2, 0.03]} />
          <meshStandardMaterial color="#d4af6a" metalness={0.8} roughness={0.28} wireframe />
        </mesh>
        <mesh position={[-1.1, 1.85, 0.11]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#f2cf88" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Atmospheric Golden Dust Particles */}
      <Float speed={1.2} floatIntensity={0.4}>
        <Sparkles count={120} scale={[16, 7, 14]} position={[0, 3.2, 6]} size={2.2} speed={0.3} color="#ffd995" />
      </Float>
    </>
  );
}

export const WelcomeScreen: React.FC = () => {
  const setStage = useGameStore((s) => s.setStage);
  const albatrossUnlocked = useGameStore((s) => s.albatrossUnlocked);
  const [entering, setEntering] = useState(false);

  const handleEnter = () => {
    if (entering) return;
    setEntering(true);
    audioService.unlockAndStartMusic();
    audioService.playDoorOpen();
    window.setTimeout(() => {
      setStage('CHARACTER_INTRO');
    }, 1250);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#120d0a]">
      <Canvas dpr={[1, 1.25]} gl={{ antialias: true, powerPreference: 'high-performance' }} camera={{ position: [0, 3.0, 14.8], fov: 44 }}>
        <MuseumExteriorScene doorsOpen={entering} />
      </Canvas>

      {/* Cinematic Vignette */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-1000 ${
          entering ? 'bg-[#120d0a]/90 opacity-100' : 'bg-gradient-to-t from-[#120d0a]/85 via-transparent to-[#120d0a]/65 opacity-100'
        }`}
      />

      {/* Elegant Museum Title & Entry CTA */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-between px-6 py-12 text-center transition-all duration-700 ${
          entering ? 'scale-105 opacity-0' : 'opacity-100'
        }`}
      >
        <div className="mt-4 flex flex-col items-center gap-3">
          <span className="rounded-full border border-[#d4af6a]/40 bg-[#1c140f]/75 px-4 py-1 text-[11px] font-medium uppercase tracking-[0.35em] text-[#d4af6a] backdrop-blur-md">
            Private Virtual Memory Museum · Munna &amp; Azhagi
          </span>
          <h1 className="mt-2 font-serif text-5xl font-semibold tracking-[0.12em] text-[#f7efe3] drop-shadow-[0_6px_24px_rgba(0,0,0,0.85)] sm:text-7xl">
            OUR LITTLE UNIVERSE
          </h1>
          <p className="max-w-xl font-serif text-lg italic tracking-wide text-[#e5d4bc] sm:text-2xl">
            “Every picture holds a memory. Every memory holds us.”
          </p>
          {albatrossUnlocked && (
            <span className="mt-1 rounded-full border border-[#f2cb85]/60 bg-[#2d1c14]/85 px-4 py-1 text-[11px] font-semibold tracking-[0.24em] text-[#f7da97] shadow-[0_0_20px_rgba(242,203,133,0.3)] backdrop-blur-md">
              ∞ ETERNAL ALBATROSS UNLOCKED · MUNNA &amp; AZHAGI ∞
            </span>
          )}
        </div>

        <div className="mb-8 flex flex-col items-center gap-4">
          <button
            onClick={handleEnter}
            className="group relative overflow-hidden rounded-full border border-[#d4af6a]/70 bg-gradient-to-r from-[#2c1e16]/90 via-[#3d291d]/95 to-[#2c1e16]/90 px-10 py-4 text-sm font-semibold uppercase tracking-[0.28em] text-[#f8efe1] shadow-[0_10px_40px_rgba(212,175,106,0.28)] backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-[#f0cf8c] hover:shadow-[0_14px_48px_rgba(212,175,106,0.48)]"
          >
            <span className="relative z-10">ENTER OUR MUSEUM</span>
          </button>
          <p className="text-xs tracking-wider text-[#bba992]/80">
            Desktop (WASD + Mouse) &amp; Mobile Touch Supported
          </p>
        </div>
      </div>
    </div>
  );
};

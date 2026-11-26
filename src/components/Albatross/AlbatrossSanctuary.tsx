import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { Heart, Sparkles as SparklesIcon, Feather, X } from 'lucide-react';
import { CharacterModel } from '../../characters/CharacterModel';
import { useGameStore } from '../../store/gameStore';
import { audioService } from '../../services/audioService';

interface AlbatrossBirdProps {
  accentColor: string;
  phaseOffset?: number;
  wingSpanScale?: number;
  positionRef: React.MutableRefObject<THREE.Vector3>;
  bankRef: React.MutableRefObject<number>;
  scaleRef: React.MutableRefObject<number>;
}

/**
 * Stylized 3D Albatross with articulated 2-joint wings (inner white wing + dark wingtip),
 * sculpted body, golden hooked albatross bill, and ribbon accent.
 */
const AlbatrossBird: React.FC<AlbatrossBirdProps> = ({
  accentColor,
  phaseOffset = 0,
  wingSpanScale = 1,
  positionRef,
  bankRef,
  scaleRef,
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const leftInnerRef = useRef<THREE.Group>(null);
  const leftTipRef = useRef<THREE.Group>(null);
  const rightInnerRef = useRef<THREE.Group>(null);
  const rightTipRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + phaseOffset;
    if (!rootRef.current) return;

    rootRef.current.position.copy(positionRef.current);
    const s = scaleRef.current * wingSpanScale;
    rootRef.current.scale.setScalar(s);

    // Gentle flap alternating with soaring glide phases
    const glideBlend = 0.5 + 0.5 * Math.sin(t * 0.55);
    const flapAngle = Math.sin(t * 4.4) * (0.28 + 0.24 * glideBlend);
    const tipLag = Math.sin(t * 4.4 - 0.55) * (0.22 + 0.18 * glideBlend);

    if (leftInnerRef.current) leftInnerRef.current.rotation.z = flapAngle;
    if (leftTipRef.current) leftTipRef.current.rotation.z = tipLag;
    if (rightInnerRef.current) rightInnerRef.current.rotation.z = -flapAngle;
    if (rightTipRef.current) rightTipRef.current.rotation.z = -tipLag;
    if (tailRef.current) tailRef.current.rotation.x = 0.08 + Math.sin(t * 2.2) * 0.05;

    rootRef.current.rotation.z = bankRef.current;
    rootRef.current.rotation.x = -0.06 + Math.sin(t * 1.4) * 0.04;
  });

  return (
    <group ref={rootRef}>
      {/* Aerodynamic White Torso */}
      <mesh scale={[0.32, 0.28, 0.95]}>
        <sphereGeometry args={[0.5, 16, 12]} />
        <meshStandardMaterial color="#fbf8f2" roughness={0.55} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.09, -0.46]} scale={[0.21, 0.20, 0.26]}>
        <sphereGeometry args={[0.5, 14, 10]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>
      {/* Warm Golden Albatross Beak */}
      <mesh position={[0, 0.06, -0.68]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.055, 0.24, 10]} />
        <meshStandardMaterial color="#f0b65a" roughness={0.35} />
      </mesh>
      {/* Subtle Dark Eye Beads */}
      <mesh position={[-0.085, 0.12, -0.50]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshBasicMaterial color="#18120e" />
      </mesh>
      <mesh position={[0.085, 0.12, -0.50]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshBasicMaterial color="#18120e" />
      </mesh>
      {/* Signature Couple Ribbon Collar Accent */}
      <mesh position={[0, 0.05, -0.32]} rotation={[Math.PI / 2 - 0.2, 0, 0]}>
        <torusGeometry args={[0.12, 0.02, 8, 18]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.45} roughness={0.35} />
      </mesh>
      {/* Fanned Tail */}
      <mesh ref={tailRef} position={[0, 0.02, 0.56]} rotation={[0.08, 0, 0]}>
        <boxGeometry args={[0.34, 0.025, 0.36]} />
        <meshStandardMaterial color="#2a2d34" roughness={0.6} />
      </mesh>

      {/* Left Wing (Inner + Swept Outer Tip) */}
      <group ref={leftInnerRef} position={[-0.12, 0.05, -0.05]}>
        <mesh position={[-0.58, 0, 0.04]} rotation={[0.04, 0.10, 0]}>
          <boxGeometry args={[1.15, 0.032, 0.36]} />
          <meshStandardMaterial color="#f7f4ec" roughness={0.52} />
        </mesh>
        <group ref={leftTipRef} position={[-1.14, 0, 0.10]}>
          <mesh position={[-0.50, 0, 0.12]} rotation={[0.04, 0.28, 0]}>
            <boxGeometry args={[1.05, 0.024, 0.24]} />
            <meshStandardMaterial color="#252a34" roughness={0.58} />
          </mesh>
        </group>
      </group>

      {/* Right Wing (Inner + Swept Outer Tip) */}
      <group ref={rightInnerRef} position={[0.12, 0.05, -0.05]}>
        <mesh position={[0.58, 0, 0.04]} rotation={[0.04, -0.10, 0]}>
          <boxGeometry args={[1.15, 0.032, 0.36]} />
          <meshStandardMaterial color="#f7f4ec" roughness={0.52} />
        </mesh>
        <group ref={rightTipRef} position={[1.14, 0, 0.10]}>
          <mesh position={[0.50, 0, 0.12]} rotation={[0.04, -0.28, 0]}>
            <boxGeometry args={[1.05, 0.024, 0.24]} />
            <meshStandardMaterial color="#252a34" roughness={0.58} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

/**
 * Simple stylized palm silhouette for the golden sunrise coastline.
 */
const CoastalPalm: React.FC<{ position: [number, number, number]; tilt?: number; scale?: number }> = ({
  position,
  tilt = 0.18,
  scale = 1,
}) => (
  <group position={position} scale={scale} rotation={[0, 0, tilt]}>
    <mesh position={[0, 1.8, 0]}>
      <cylinderGeometry args={[0.09, 0.16, 3.6, 8]} />
      <meshStandardMaterial color="#2a1a12" roughness={0.9} />
    </mesh>
    {[0, 1, 2, 3, 4].map((i) => (
      <mesh
        key={i}
        position={[0, 3.55, 0]}
        rotation={[0.35, (i * Math.PI * 2) / 5, 0.15]}
      >
        <boxGeometry args={[0.28, 0.04, 1.9]} />
        <meshStandardMaterial color="#1f281b" roughness={0.85} />
      </mesh>
    ))}
  </group>
);

interface SunriseWorldProps {
  isFlight: boolean;
  fadeOverlayRef: React.MutableRefObject<HTMLDivElement | null>;
  onFlightComplete: () => void;
}

const SunriseSanctuaryWorld: React.FC<SunriseWorldProps> = ({
  isFlight,
  fadeOverlayRef,
  onFlightComplete,
}) => {
  const syncClockRef = useRef<number>(0);
  const flightElapsedRef = useRef<number>(0);
  const completedRef = useRef<boolean>(false);

  const coupleGroupRef = useRef<THREE.Group>(null);
  const skyMatRef = useRef<THREE.ShaderMaterial>(null);
  const sunGroupRef = useRef<THREE.Group>(null);
  const coastGroupRef = useRef<THREE.Group>(null);
  const oceanRef = useRef<THREE.Mesh>(null);
  const sunPathRef = useRef<THREE.Mesh>(null);
  const pierGroupRef = useRef<THREE.Group>(null);

  const munnaPosRef = useRef<THREE.Vector3>(new THREE.Vector3(-0.9, 2.2, 0));
  const azhagiPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0.9, 2.2, 0));
  const munnaBankRef = useRef<number>(0);
  const azhagiBankRef = useRef<number>(0);
  const birdScaleRef = useRef<number>(0);

  const camTarget = useRef(new THREE.Vector3());
  const camLook = useRef(new THREE.Vector3());

  const skyShader = useMemo(
    () => ({
      uniforms: {
        uSunrise: { value: 0.15 },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform float uSunrise;
        varying vec3 vWorldPos;
        void main() {
          float h = clamp(normalize(vWorldPos).y * 1.4, -0.1, 1.0);
          vec3 nightTop = vec3(0.08, 0.08, 0.20);
          vec3 nightHor = vec3(0.26, 0.15, 0.24);
          vec3 dawnTop  = vec3(0.18, 0.26, 0.48);
          vec3 dawnMid  = vec3(0.92, 0.46, 0.44);
          vec3 dawnHor  = vec3(1.00, 0.80, 0.45);

          vec3 topCol = mix(nightTop, dawnTop, uSunrise);
          vec3 midCol = mix(nightHor, dawnMid, uSunrise);
          vec3 horCol = mix(nightHor, dawnHor, uSunrise);

          vec3 col = mix(horCol, midCol, smoothstep(0.0, 0.28, h));
          col = mix(col, topCol, smoothstep(0.24, 0.88, h));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    }),
    []
  );

  // Sculpted ocean wave geometry updated lightly at low vertex count
  const oceanGeo = useMemo(() => new THREE.PlaneGeometry(180, 220, 28, 28), []);

  useFrame(({ camera, clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    syncClockRef.current += dt;
    const gTime = clock.getElapsedTime();

    // Gentle animated sunrise ocean waves
    if (oceanGeo) {
      const posAttr = oceanGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vy = posAttr.getY(i);
        const wave =
          Math.sin(vx * 0.18 + gTime * 1.6) * 0.16 +
          Math.cos(vy * 0.14 - gTime * 2.1) * 0.14;
        posAttr.setZ(i, wave);
      }
      posAttr.needsUpdate = true;
    }

    if (!isFlight) {
      flightElapsedRef.current = 0;
      completedRef.current = false;
      birdScaleRef.current = 0;
      if (fadeOverlayRef.current) {
        fadeOverlayRef.current.style.opacity = '0';
      }

      if (skyMatRef.current) skyMatRef.current.uniforms.uSunrise.value = 0.22;
      if (sunGroupRef.current) sunGroupRef.current.position.set(0, -1.5, -105);
      if (coupleGroupRef.current) {
        coupleGroupRef.current.position.set(0, 0, 0);
        coupleGroupRef.current.scale.setScalar(1);
        coupleGroupRef.current.rotation.y = Math.sin(gTime * 0.5) * 0.12;
      }

      camTarget.current.set(Math.sin(gTime * 0.25) * 0.35, 1.55, 4.1);
      camLook.current.set(0, 1.15, -2.0);
      camera.position.lerp(camTarget.current, Math.min(1, dt * 4));
      camera.lookAt(camLook.current);
      return;
    }

    // FLIGHT SEQUENCE
    flightElapsedRef.current += dt;
    const t = flightElapsedRef.current;

    // Sunrise warmth blooms 0.22 -> 1.0 over first 3.5s
    const sunriseT = THREE.MathUtils.clamp((t - 0.1) / 3.4, 0, 1);
    if (skyMatRef.current) {
      skyMatRef.current.uniforms.uSunrise.value = THREE.MathUtils.lerp(0.22, 1.0, sunriseT);
    }
    if (sunGroupRef.current) {
      const sunY = THREE.MathUtils.lerp(-1.5, 9.8, THREE.MathUtils.smoothstep(t, 0.2, 6.0));
      sunGroupRef.current.position.set(0, sunY, -105);
    }
    if (sunPathRef.current) {
      (sunPathRef.current.material as THREE.MeshBasicMaterial).opacity = 0.25 + 0.50 * sunriseT;
    }

    // Phase 1 (0 -> 2.4s): Couple lifts into stardust and transforms into 2 Albatrosses
    const liftT = THREE.MathUtils.clamp(t / 2.2, 0, 1);
    const coupleShrink = 1 - THREE.MathUtils.smoothstep(t, 1.6, 2.35);
    const birdGrow = THREE.MathUtils.smoothstep(t, 1.65, 2.55);
    birdScaleRef.current = birdGrow;

    if (coupleGroupRef.current) {
      coupleGroupRef.current.visible = coupleShrink > 0.01;
      coupleGroupRef.current.position.set(0, liftT * 2.4, -liftT * 2.5);
      coupleGroupRef.current.rotation.y = liftT * Math.PI * 2;
      coupleGroupRef.current.scale.setScalar(Math.max(0.001, coupleShrink));
    }

    // Pier gently recedes as we take flight
    if (pierGroupRef.current) {
      pierGroupRef.current.position.z = t * 5.2;
      pierGroupRef.current.position.y = -THREE.MathUtils.clamp((t - 2.0) * 1.4, 0, 12);
    }

    // Phase 2 (2.2 -> 13.5s): Wing-to-wing soaring over sunrise beach & ocean
    const flyT = Math.max(0, t - 1.8);
    const swayX = Math.sin(flyT * 0.75) * 1.45;
    const altY = 3.2 + Math.sin(flyT * 0.9) * 0.55 + Math.min(2.2, flyT * 0.2);
    const wingClose = 0.78 + 0.22 * Math.cos(flyT * 0.8);

    munnaPosRef.current.set(swayX - wingClose, altY, -3.5);
    azhagiPosRef.current.set(swayX + wingClose, altY - 0.06, -3.35);
    const sharedBank = -Math.cos(flyT * 0.75) * 0.22;
    munnaBankRef.current = sharedBank + 0.05;
    azhagiBankRef.current = sharedBank - 0.05;

    // Scroll golden beach coastline smoothly underneath
    if (coastGroupRef.current) {
      coastGroupRef.current.position.z = ((t * 7.5) % 44) - 10;
    }

    // Cinematic chase camera swooping smoothly behind & slightly right of the flying couple
    if (t < 2.4) {
      camTarget.current.set(0, 1.6 + liftT * 1.5, 4.0);
      camLook.current.set(0, 1.4 + liftT * 1.5, -2.5);
    } else {
      const orbitAngle = THREE.MathUtils.smoothstep(t, 2.4, 11.5);
      camTarget.current.set(
        swayX * 0.55 + Math.sin(orbitAngle * 1.4) * 2.1,
        altY + 0.95,
        1.8 - orbitAngle * 0.6
      );
      camLook.current.set(swayX, altY + 0.1, -14.0);
    }
    camera.position.lerp(camTarget.current, Math.min(1, dt * 3.2));
    camera.lookAt(camLook.current);

    // Phase 3 (11.2 -> 13.3s): Smooth sunrise fade-out back to Welcome stage
    if (t >= 11.2) {
      const fade = THREE.MathUtils.clamp((t - 11.2) / 1.9, 0, 1);
      if (fadeOverlayRef.current) {
        fadeOverlayRef.current.style.opacity = String(fade);
      }
      if (t >= 13.3 && !completedRef.current) {
        completedRef.current = true;
        onFlightComplete();
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.85} color="#ffebd6" />
      <hemisphereLight args={['#ffd6a5', '#32222c', 0.9]} />
      <directionalLight position={[0, 12, -30]} intensity={1.35} color="#ffd089" />

      {/* Gradient Sunrise Sky Dome */}
      <mesh scale={140}>
        <sphereGeometry args={[1, 24, 16]} />
        <shaderMaterial
          ref={skyMatRef}
          side={THREE.BackSide}
          uniforms={skyShader.uniforms}
          vertexShader={skyShader.vertexShader}
          fragmentShader={skyShader.fragmentShader}
          depthWrite={false}
        />
      </mesh>

      {/* Rising Golden Sun + Warm Halo */}
      <group ref={sunGroupRef} position={[0, -1.5, -105]}>
        <mesh>
          <sphereGeometry args={[8.5, 24, 18]} />
          <meshBasicMaterial color="#fff3c4" />
        </mesh>
        <mesh>
          <circleGeometry args={[16, 32]} />
          <meshBasicMaterial color="#ffbe6b" transparent opacity={0.32} />
        </mesh>
        <mesh position={[0, 0, -0.2]}>
          <circleGeometry args={[28, 32]} />
          <meshBasicMaterial color="#ff8e62" transparent opacity={0.14} />
        </mesh>
      </group>

      {/* Ocean Plane */}
      <mesh
        ref={oceanRef}
        geometry={oceanGeo}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.35, -45]}
      >
        <meshStandardMaterial color="#1f4c6e" roughness={0.28} metalness={0.45} />
      </mesh>

      {/* Shimmering Sunrise Reflection Path Across Water */}
      <mesh ref={sunPathRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.14, -52]}>
        <planeGeometry args={[11, 95]} />
        <meshBasicMaterial color="#ffd288" transparent opacity={0.35} />
      </mesh>

      {/* Golden Sandy Beach Coastline & Swaying Palm Silhouettes */}
      <group ref={coastGroupRef} position={[-12, -0.22, -10]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -30]}>
          <planeGeometry args={[22, 170]} />
          <meshStandardMaterial color="#e5c185" roughness={0.85} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10.8, 0.03, -30]}>
          <planeGeometry args={[1.4, 170]} />
          <meshBasicMaterial color="#fff4e0" transparent opacity={0.55} />
        </mesh>
        {[-65, -44, -22, 0, 22, 44].map((pz, idx) => (
          <CoastalPalm
            key={pz}
            position={[-3.5 - (idx % 2) * 2.2, 0, pz]}
            tilt={0.14 + (idx % 3) * 0.06}
            scale={0.85 + (idx % 2) * 0.25}
          />
        ))}
      </group>

      {/* Sanctuary Crystal Balcony Pier (visible in proposal room, recedes on takeoff) */}
      <group ref={pierGroupRef} position={[0, 0, 0]}>
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[4.2, 0.3, 6.5]} />
          <meshStandardMaterial color="#2b1c16" roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[3.9, 0.04, 6.2]} />
          <meshStandardMaterial color="#cfa458" metalness={0.55} roughness={0.35} />
        </mesh>
      </group>

      {/* Couple Standing Hand-in-Hand (transforms into Albatrosses) */}
      <group ref={coupleGroupRef}>
        <CharacterModel
          characterId="MUNNA"
          animation="HoldHandsIdle"
          position={[-0.265, 0, 0]}
          syncClockRef={syncClockRef}
        />
        <CharacterModel
          characterId="AZHAGI"
          animation="HoldHandsIdle"
          position={[0.265, 0, 0]}
          syncClockRef={syncClockRef}
        />
        <Sparkles count={28} scale={[2.0, 2.2, 1.4]} position={[0, 1.1, 0]} size={2.4} speed={0.45} color="#ffd89c" />
      </group>

      {/* Two Transformed 3D Albatross Birds Soaring Wing-to-Wing */}
      {isFlight && (
        <>
          <AlbatrossBird
            accentColor="#4a90d9"
            phaseOffset={0}
            wingSpanScale={1.06}
            positionRef={munnaPosRef}
            bankRef={munnaBankRef}
            scaleRef={birdScaleRef}
          />
          <AlbatrossBird
            accentColor="#f06e9c"
            phaseOffset={0.42}
            wingSpanScale={0.96}
            positionRef={azhagiPosRef}
            bankRef={azhagiBankRef}
            scaleRef={birdScaleRef}
          />
          <Sparkles
            count={46}
            scale={[10, 4, 18]}
            position={[0, 3.5, -6]}
            size={3.0}
            speed={0.65}
            color="#ffe09e"
          />
        </>
      )}
    </>
  );
};

const PLAYFUL_NO_MESSAGES = [
  'You can only select YES! 💕 Even the sunrise winds already know we are meant to fly together.',
  'Nice try! You can only select YES! ✨ Every memory in Our Little Universe leads straight to us.',
  'Oops — the "No" button is shrinking for a reason! You can only select YES! ∞',
  'Resistance is futile! There is only YES when it comes to Munna & Azhagi! 🕊️❤️',
];

export const AlbatrossSanctuary: React.FC = () => {
  const stage = useGameStore((s) => s.stage);
  const startAlbatrossFlight = useGameStore((s) => s.startAlbatrossFlight);
  const returnToInitialStage = useGameStore((s) => s.returnToInitialStage);
  const setStage = useGameStore((s) => s.setStage);

  const [noCount, setNoCount] = useState(0);
  const [noPopupOpen, setNoPopupOpen] = useState(false);
  const fadeOverlayRef = useRef<HTMLDivElement | null>(null);

  const isFlight = stage === 'ALBATROSS_FLIGHT';

  useEffect(() => {
    if (stage === 'ALBATROSS_ROOM') {
      setNoCount(0);
      setNoPopupOpen(false);
      if (fadeOverlayRef.current) fadeOverlayRef.current.style.opacity = '0';
    }
  }, [stage]);

  const handleClickNo = () => {
    audioService.playPlayfulDecline();
    setNoCount((c) => c + 1);
    setNoPopupOpen(true);
  };

  const yesFontSize = Math.min(26, 14 + noCount * 2.5);
  const yesPadY = Math.min(20, 12 + noCount * 2);
  const yesPadX = Math.min(46, 26 + noCount * 4.5);
  const noFontSize = Math.max(8, 12 - noCount * 1.1);
  const noPadY = Math.max(4, 10 - noCount * 1.3);
  const noPadX = Math.max(10, 20 - noCount * 2.2);
  const popupMsg =
    PLAYFUL_NO_MESSAGES[Math.min(noCount - 1, PLAYFUL_NO_MESSAGES.length - 1)] ||
    PLAYFUL_NO_MESSAGES[0];

  return (
    <div className="relative h-screen w-screen overflow-hidden overscroll-none bg-[#140f0c] select-none">
      <Canvas
        dpr={[1, 1.25]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 1.55, 4.1], fov: 46 }}
      >
        <SunriseSanctuaryWorld
          isFlight={isFlight}
          fadeOverlayRef={fadeOverlayRef}
          onFlightComplete={returnToInitialStage}
        />
      </Canvas>

      {/* Top Subtle Back / Skip Action */}
      <div className="fixed right-4 top-4 z-20 flex items-center gap-2">
        {!isFlight ? (
          <button
            onClick={() => setStage('MUSEUM')}
            className="rounded-full border border-white/20 bg-[#140f0c]/75 px-4 py-1.5 text-xs text-[#dfd1bd] backdrop-blur-md hover:border-[#d4af6a]"
          >
            Back to Museum
          </button>
        ) : (
          <button
            onClick={returnToInitialStage}
            className="rounded-full border border-[#d4af6a]/45 bg-[#140f0c]/70 px-4 py-1.5 text-xs text-[#f5e4c3] backdrop-blur-md hover:border-[#d4af6a]"
          >
            Return to Entrance
          </button>
        )}
      </div>

      {/* Proposal Question UI Overlay */}
      {!isFlight && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-20 flex flex-col items-center px-4 text-center sm:bottom-10">
          <div className="pointer-events-auto w-full max-w-lg rounded-3xl border border-[#d4af6a]/50 bg-[#160f0c]/88 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.85)] backdrop-blur-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#d4af6a]/40 bg-[#2a1c14] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#f2cb85]">
              <Feather className="h-3 w-3" />
              Infinite Love · Albatross Trial
            </div>

            <h2 className="mt-3 font-serif text-3xl font-semibold tracking-wide text-[#fff3e0] sm:text-4xl">
              Will you be my Albatross?
            </h2>
            <p className="mt-2 text-xs text-[#d6c2a8] sm:text-sm">
              {noCount === 0
                ? 'Two hearts standing at the edge of dawn — choose your forever answer.'
                : 'Look closely at the choices below… our destiny only knows one word ✨'}
            </p>

            {/* Interactive Yes (grows) & No (shrinks) Controls */}
            <div className="mt-6 flex min-h-[72px] flex-wrap items-center justify-center gap-4">
              <button
                onClick={startAlbatrossFlight}
                style={{
                  fontSize: `${yesFontSize}px`,
                  padding: `${yesPadY}px ${yesPadX}px`,
                }}
                className="inline-flex items-center gap-2 rounded-full border border-[#f7da97] bg-gradient-to-r from-[#d4af6a] via-[#f0cb83] to-[#d4af6a] font-bold uppercase tracking-[0.18em] text-[#1a110b] shadow-[0_0_28px_rgba(240,203,131,0.55)] transition-all duration-300 hover:brightness-110"
              >
                <Heart className="h-4 w-4 fill-[#8c1d3d] text-[#8c1d3d]" />
                YES ∞
              </button>

              <button
                onClick={handleClickNo}
                style={{
                  fontSize: `${noFontSize}px`,
                  padding: `${noPadY}px ${noPadX}px`,
                  opacity: Math.max(0.42, 1 - noCount * 0.12),
                }}
                className="rounded-full border border-white/25 bg-white/10 font-medium uppercase tracking-wider text-[#e2d4c0] transition-all duration-300 hover:bg-white/20"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Playful "You can only select YES!" Popup Modal */}
      {noPopupOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-3xl border border-[#f2cb85]/60 bg-gradient-to-b from-[#2a1a14] to-[#170f0c] p-6 text-center shadow-2xl">
            <button
              onClick={() => setNoPopupOpen(false)}
              aria-label="Close popup"
              className="absolute right-3 top-3 rounded-full border border-white/15 bg-white/5 p-1.5 text-[#dfd1bd] hover:bg-white/15"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#f2cb85]/50 bg-[#3a2319] text-[#f2cb85]">
              <SparklesIcon className="h-6 w-6" />
            </div>
            <h3 className="mt-3 font-serif text-2xl font-semibold text-[#ffe8c4]">
              You can only select YES!
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#e5d2ba]">{popupMsg}</p>
            <button
              onClick={() => setNoPopupOpen(false)}
              className="mt-5 w-full rounded-full border border-[#d4af6a] bg-[#d4af6a] py-2.5 text-xs font-bold uppercase tracking-[0.22em] text-[#1a110b]"
            >
              Close &amp; Choose Again
            </button>
          </div>
        </div>
      )}

      {/* Cinematic Sunrise Flight Poetic Captions */}
      {isFlight && (
        <div className="pointer-events-none fixed inset-x-0 bottom-12 z-20 flex flex-col items-center px-6 text-center">
          <span className="rounded-full border border-[#f7da97]/50 bg-[#1a110b]/55 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#ffe1a8] backdrop-blur-md">
            Munna &amp; Azhagi · Infinite Love
          </span>
          <h2 className="mt-3 font-serif text-3xl font-semibold tracking-wide text-[#fff7ea] drop-shadow-[0_4px_20px_rgba(0,0,0,0.85)] sm:text-5xl">
            Two Albatrosses Over Our Perfect Sunrise
          </h2>
          <p className="mt-2 max-w-md font-serif text-base italic text-[#ffe8c8] drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)] sm:text-lg">
            “No matter how vast the ocean, our wings always fly side by side.”
          </p>
        </div>
      )}

      {/* Smooth Dreamlike Fade-out back to Initial Stage */}
      <div
        ref={fadeOverlayRef}
        className="pointer-events-none fixed inset-0 z-50 bg-[#140f0c]"
        style={{ opacity: 0 }}
      />
    </div>
  );
};

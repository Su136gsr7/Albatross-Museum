import React from 'react';
import { Environment, Lightformer } from '@react-three/drei';

interface MuseumEnvironmentProps {
  intensity?: number;
}

/**
 * Self-contained procedural HDRI environment using Lightformers.
 * Avoids external CDN fetches so 3D PBR reflections work 100% offline in PWA/Capacitor.
 */
export const MuseumEnvironment: React.FC<MuseumEnvironmentProps> = ({ intensity = 0.45 }) => {
  return (
    <Environment resolution={256} frames={1} environmentIntensity={intensity}>
      <color attach="background" args={['#1a120d']} />
      <Lightformer
        form="rect"
        intensity={2.2}
        color="#ffe8c2"
        position={[0, 6, 2]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[10, 10, 1]}
      />
      <Lightformer
        form="circle"
        intensity={1.6}
        color="#ffd499"
        position={[5, 3, 4]}
        rotation={[0, -Math.PI / 4, 0]}
        scale={4}
      />
      <Lightformer
        form="circle"
        intensity={1.1}
        color="#fff0dc"
        position={[-5, 2.5, 3]}
        rotation={[0, Math.PI / 4, 0]}
        scale={4}
      />
      <Lightformer
        form="rect"
        intensity={0.7}
        color="#cfa064"
        position={[0, 1, -6]}
        rotation={[0, 0, 0]}
        scale={[12, 4, 1]}
      />
    </Environment>
  );
};

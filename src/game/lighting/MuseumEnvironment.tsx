import React from 'react';

interface MuseumEnvironmentProps {
  intensity?: number;
}

/**
 * Lightweight analytical bounce lighting replacement for PMREM <Environment>.
 * Avoids HalfFloat cube-map green tint bugs on Android mobile GPUs and boosts WebGL FPS.
 */
export const MuseumEnvironment: React.FC<MuseumEnvironmentProps> = ({ intensity = 0.5 }) => {
  return (
    <>
      <hemisphereLight
        args={['#fff0d8', '#4b3628', Math.max(0.45, intensity * 1.15)]}
      />
      <directionalLight
        position={[-10, 14, -14]}
        intensity={Math.max(0.35, intensity * 0.85)}
        color="#ffe3be"
      />
    </>
  );
};

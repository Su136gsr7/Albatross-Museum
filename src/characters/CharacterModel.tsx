import React, { useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { AnimationState, CharacterId } from '../types/Character';
import { CHARACTERS } from '../data/characters/characters';

interface CharacterModelProps {
  characterId: CharacterId;
  animation?: AnimationState;
  scale?: number;
  position?: [number, number, number];
  rotationY?: number;
  syncClockRef?: React.MutableRefObject<number>;
}

export const CharacterModel: React.FC<CharacterModelProps> = ({
  characterId,
  animation = 'Idle',
  scale = 1,
  position = [0, 0, 0],
  rotationY = 0,
  syncClockRef,
}) => {
  const profile = CHARACTERS[characterId];
  const gltf = useGLTF(profile.modelUrl);
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  const activeActionRef = useRef<THREE.AnimationAction | null>(null);

  const clonedScene = useMemo(() => {
    const clone = SkeletonUtils.clone(gltf.scene);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of mats) {
          if (m && (m as THREE.MeshStandardMaterial).alphaTest > 0) {
            m.side = THREE.DoubleSide;
          }
        }
      }
    });
    return clone;
  }, [gltf.scene]);

  useEffect(() => {
    const mixer = new THREE.AnimationMixer(clonedScene);
    mixerRef.current = mixer;
    const map: Record<string, THREE.AnimationAction> = {};

    for (const clip of gltf.animations) {
      const action = mixer.clipAction(clip);
      map[clip.name] = action;
    }
    actionsRef.current = map;

    const initial = map[animation] ?? map['HoldHandsIdle'] ?? map['Idle'] ?? Object.values(map)[0];
    if (initial) {
      initial.reset().play();
      if (syncClockRef) {
        const dur = initial.getClip().duration || 1;
        initial.time = syncClockRef.current % dur;
      }
      activeActionRef.current = initial;
    }

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(clonedScene);
      mixerRef.current = null;
      actionsRef.current = {};
      activeActionRef.current = null;
    };
  }, [clonedScene, gltf.animations]);

  useEffect(() => {
    const map = actionsRef.current;
    const target = map[animation] ?? map['HoldHandsIdle'] ?? map['Idle'];
    const current = activeActionRef.current;
    if (!target || target === current) return;

    target.reset();
    target.setLoop(THREE.LoopRepeat, Infinity);
    if (syncClockRef) {
      const dur = target.getClip().duration || 1;
      target.time = syncClockRef.current % dur;
    }
    target.fadeIn(0.20).play();
    if (current) {
      current.fadeOut(0.20);
    }
    activeActionRef.current = target;
  }, [animation, syncClockRef]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    mixerRef.current?.update(dt);
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  );
};

useGLTF.preload('/models/munna.glb?v=4');
useGLTF.preload('/models/azhagi.glb?v=4');

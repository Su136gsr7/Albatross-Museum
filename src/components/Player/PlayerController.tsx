import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CharacterModel } from '../../characters/CharacterModel';
import { AnimationState } from '../../types/Character';
import { useGameStore } from '../../store/gameStore';
import { detectRoomId, resolvePlayerCollision } from '../../game/collision/museumCollision';
import { buildPlacedFrames } from '../../game/interactions/photoLayout';
import { audioService } from '../../services/audioService';

interface PlayerControllerProps {
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
  secretDoorOpen: boolean;
}

function lerpAngle(current: number, target: number, t: number): number {
  let diff = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * t;
}

export const PlayerController: React.FC<PlayerControllerProps> = ({
  playerPosRef,
  secretDoorOpen,
}) => {
  const { camera, gl } = useThree();
  const activePlayer = useGameStore((s) => s.activePlayer);
  const stage = useGameStore((s) => s.stage);
  const isPhotoManagerOpen = useGameStore((s) => s.isPhotoManagerOpen);
  const galleries = useGameStore((s) => s.galleries);
  const photos = useGameStore((s) => s.photos);
  const foreverUs = useGameStore((s) => s.foreverUs);
  const teleportTarget = useGameStore((s) => s.teleportTarget);
  const clearTeleport = useGameStore((s) => s.clearTeleport);
  const setCurrentGalleryId = useGameStore((s) => s.setCurrentGalleryId);
  const setNearbyPhotoId = useGameStore((s) => s.setNearbyPhotoId);
  const openMemoryViewer = useGameStore((s) => s.openMemoryViewer);
  const setPointerLocked = useGameStore((s) => s.setPointerLocked);
  const consumeMobileLookDelta = useGameStore((s) => s.consumeMobileLookDelta);

  const [animState, setAnimState] = useState<AnimationState>('HoldHandsIdle');
  const playerGroupRef = useRef<THREE.Group>(null);
  const syncClockRef = useRef<number>(0);
  const keysRef = useRef<Record<string, boolean>>({});
  const yawRef = useRef<number>(0); // 0 = facing -Z (north into museum)
  const pitchRef = useRef<number>(0.18);
  const charRotYRef = useRef<number>(Math.PI); // GLB forward is +Z or -Z? Let's verify: in Blender -Y front -> glTF export (+Y up, +Z forward)!
  const draggingRef = useRef<boolean>(false);
  const lastMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const camPosSmooth = useRef<THREE.Vector3>(new THREE.Vector3(0, 2.2, 17));
  const camLookSmooth = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.4, 12));

  const placedFrames = useMemo(
    () => buildPlacedFrames(galleries, photos, foreverUs.centerpiecePhotoId),
    [galleries, photos, foreverUs.centerpiecePhotoId]
  );

  const isPaused = stage !== 'MUSEUM' || isPhotoManagerOpen;

  useEffect(() => {
    if (isPaused) {
      keysRef.current = {};
      draggingRef.current = false;
    }
  }, [isPaused]);

  // Keyboard & Pointer Lock Listeners
  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      const tag = (target as HTMLElement | null)?.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      const code = e.code;
      keysRef.current[code] = true;
      if (code === 'KeyE' && !useGameStore.getState().isPhotoManagerOpen && useGameStore.getState().stage === 'MUSEUM') {
        const nearby = useGameStore.getState().nearbyPhotoId;
        if (nearby) {
          openMemoryViewer(nearby);
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    const onWindowBlur = () => {
      keysRef.current = {};
      draggingRef.current = false;
    };
    const onMouseMove = (e: MouseEvent) => {
      const state = useGameStore.getState();
      if (state.stage !== 'MUSEUM' || state.isPhotoManagerOpen) return;
      if (document.pointerLockElement === gl.domElement) {
        yawRef.current -= e.movementX * 0.0024;
        pitchRef.current = THREE.MathUtils.clamp(pitchRef.current + e.movementY * 0.0020, -0.25, 0.72);
      } else if (draggingRef.current) {
        const dx = e.clientX - lastMouseRef.current.x;
        const dy = e.clientY - lastMouseRef.current.y;
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
        yawRef.current -= dx * 0.004;
        pitchRef.current = THREE.MathUtils.clamp(pitchRef.current + dy * 0.003, -0.25, 0.72);
      }
    };
    const onMouseDown = (e: MouseEvent) => {
      if (e.target !== gl.domElement) return;
      if (useGameStore.getState().stage !== 'MUSEUM' || useGameStore.getState().isPhotoManagerOpen) return;
      draggingRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => {
      draggingRef.current = false;
    };
    const onPointerLockChange = () => {
      setPointerLocked(document.pointerLockElement === gl.domElement);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('blur', onWindowBlur);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('blur', onWindowBlur);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
    };
  }, [gl.domElement, openMemoryViewer, setPointerLocked]);

  // Teleport handler (from Gallery Quick-Jump Menu)
  useEffect(() => {
    if (teleportTarget) {
      playerPosRef.current.set(teleportTarget[0], 0, teleportTarget[2]);
      clearTeleport();
    }
  }, [teleportTarget, clearTeleport, playerPosRef]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    syncClockRef.current += dt;

    // Apply any mobile touch look delta
    const lookDelta = consumeMobileLookDelta();
    if (lookDelta.dx !== 0 || lookDelta.dy !== 0) {
      yawRef.current -= lookDelta.dx * 0.0045;
      pitchRef.current = THREE.MathUtils.clamp(pitchRef.current + lookDelta.dy * 0.0038, -0.25, 0.72);
    }

    const pos = playerPosRef.current;

    if (!isPaused) {
      const k = keysRef.current;
      let inputFwd = 0;
      let inputRight = 0;
      if (k['KeyW'] || k['ArrowUp']) inputFwd += 1;
      if (k['KeyS'] || k['ArrowDown']) inputFwd -= 1;
      if (k['KeyD'] || k['ArrowRight']) inputRight += 1;
      if (k['KeyA'] || k['ArrowLeft']) inputRight -= 1;

      const mobileMove = useGameStore.getState().mobileInput;
      inputFwd += mobileMove.moveY;
      inputRight += mobileMove.moveX;

      const mag = Math.hypot(inputFwd, inputRight);
      if (mag > 0.08) {
        const nf = inputFwd / Math.max(1, mag);
        const nr = inputRight / Math.max(1, mag);
        // Forward vector in world space when yaw = 0 is (0, 0, -1)
        const sinY = Math.sin(yawRef.current);
        const cosY = Math.cos(yawRef.current);
        const moveX = -sinY * nf + cosY * nr;
        const moveZ = -cosY * nf - sinY * nr;

        const speed = 4.2;
        const [nx, nz] = resolvePlayerCollision(
          pos.x + moveX * speed * dt,
          pos.z + moveZ * speed * dt,
          0.54,
          secretDoorOpen
        );
        pos.x = nx;
        pos.z = nz;

        // Smoothly turn couple toward movement direction
        const targetRot = Math.atan2(moveX, moveZ);
        charRotYRef.current = lerpAngle(charRotYRef.current, targetRot, Math.min(1, dt * 10));

        if (animState !== 'HoldHandsWalk') setAnimState('HoldHandsWalk');
        audioService.playFootstep();
      } else {
        if (animState !== 'HoldHandsIdle') setAnimState('HoldHandsIdle');
      }
    } else if (animState !== 'HoldHandsIdle') {
      setAnimState('HoldHandsIdle');
    }

    // Update current room detection
    const roomId = detectRoomId(pos.x, pos.z);
    setCurrentGalleryId(roomId);

    // Proximity detection to framed photographs & Forever Us centerpiece
    let bestId: string | null = null;
    let bestDist = 3.1;
    for (const f of placedFrames) {
      const dx = pos.x - f.position[0];
      const dz = pos.z - f.position[2];
      const d = Math.hypot(dx, dz);
      if (d < bestDist) {
        bestDist = d;
        bestId = f.photo.id;
      }
    }
    // Check Secret Room centerpiece at (0, 0, -64)
    const dCenter = Math.hypot(pos.x - 0, pos.z - -64);
    if (dCenter < 3.4 && dCenter < bestDist) {
      bestId = foreverUs.centerpiecePhotoId;
    }
    if (useGameStore.getState().nearbyPhotoId !== bestId) {
      setNearbyPhotoId(bestId);
    }

    // Third-person romantic couple camera
    const sinY = Math.sin(yawRef.current);
    const cosY = Math.cos(yawRef.current);
    const camDist = 3.35;
    const camHeight = 1.66 + Math.sin(pitchRef.current) * 1.4;
    const shoulderOffset = 0.22;

    const desiredCamX = pos.x + sinY * camDist + cosY * shoulderOffset;
    const desiredCamZ = pos.z + cosY * camDist - sinY * shoulderOffset;

    // Prevent camera from clipping through outer walls
    const [safeCamX, safeCamZ] = resolvePlayerCollision(desiredCamX, desiredCamZ, 0.28, secretDoorOpen);
    const desiredCamPos = new THREE.Vector3(safeCamX, Math.max(0.85, camHeight), safeCamZ);

    const lookAheadX = pos.x - sinY * 2.2 + cosY * (shoulderOffset * 0.35);
    const lookAheadZ = pos.z - cosY * 2.2 - sinY * (shoulderOffset * 0.35);
    const desiredLook = new THREE.Vector3(lookAheadX, 1.38 - Math.sin(pitchRef.current) * 1.1, lookAheadZ);

    camPosSmooth.current.lerp(desiredCamPos, Math.min(1, dt * 11));
    camLookSmooth.current.lerp(desiredLook, Math.min(1, dt * 13));
    camera.position.copy(camPosSmooth.current);
    camera.lookAt(camLookSmooth.current);

    if (playerGroupRef.current) {
      playerGroupRef.current.position.set(pos.x, 0, pos.z);
      playerGroupRef.current.rotation.y = charRotYRef.current;
    }
  });

  return (
    <group ref={playerGroupRef} position={[0, 0, 13.5]} rotation={[0, Math.PI, 0]}>
      <CharacterModel characterId="MUNNA" animation={animState} position={[-0.265, 0, 0]} syncClockRef={syncClockRef} />
      <CharacterModel characterId="AZHAGI" animation={animState} position={[0.265, 0, 0]} syncClockRef={syncClockRef} />
      <pointLight position={[0, 0.9, 0.15]} intensity={0.45} distance={1.8} color="#ffd4b8" />
    </group>
  );
};

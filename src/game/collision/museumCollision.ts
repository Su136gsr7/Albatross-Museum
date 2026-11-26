export interface WallSegment {
  id: string;
  /** Center [x, y, z] */
  position: [number, number, number];
  /** Full dimensions [width, height, depth] */
  size: [number, number, number];
  /** Optional wall style override */
  variant?: 'cream' | 'walnut' | 'secret' | 'gold-trim';
  /** Room tag for tinting */
  galleryId?: string;
}

export interface RoomZone {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

const H = 4.8; // Museum ceiling height
const T = 0.45; // Wall thickness

/**
 * Generates all architectural walls for:
 * - Grand Entrance Atrium (X in [-6, 6], Z in [6, 18])
 * - Central Spine Corridor (X in [-2.8, 2.8], Z in [-55, 6])
 * - 6 Wing Galleries (Left at X=-13, Right at X=+13; Z centers -2, -22, -42; 15m x 15m each)
 * - 6 Connecting Doorway Passages (between |X|=2.8 and |X|=5.5, doorway opening 3.4m wide)
 * - Secret Forever Us Room (X in [-9, 9], Z in [-73, -55], portal at Z=-55)
 */
export function buildMuseumWalls(): WallSegment[] {
  const walls: WallSegment[] = [];

  // 1. Entrance Atrium (X: -6..6, Z: 6..18)
  // South Entrance Wall (solid behind spawn, ornate exterior doors)
  walls.push({ id: 'atrium-south', position: [0, H / 2, 18], size: [12 + T, H, T], variant: 'cream' });
  // Atrium West & East
  walls.push({ id: 'atrium-west', position: [-6, H / 2, 12], size: [T, H, 12], variant: 'cream' });
  walls.push({ id: 'atrium-east', position: [6, H / 2, 12], size: [T, H, 12], variant: 'cream' });
  // Atrium North (split for central spine opening X in [-2.8, 2.8])
  walls.push({ id: 'atrium-north-l', position: [-4.4, H / 2, 6], size: [3.2 + T, H, T], variant: 'cream' });
  walls.push({ id: 'atrium-north-r', position: [4.4, H / 2, 6], size: [3.2 + T, H, T], variant: 'cream' });
  // Atrium North arch lintel above opening
  walls.push({ id: 'atrium-north-lintel', position: [0, 4.15, 6], size: [5.6, 1.3, T], variant: 'walnut' });

  // 2. Central Spine Corridor walls (|X| = 2.8, Z from -55 to 6)
  // Door openings occur at Z = -2, -22, -42 (each opening is 3.4m wide -> Z_c ± 1.7)
  const spineIntervals: Array<[number, number]> = [
    [-0.3, 6.0],
    [-20.3, -3.7],
    [-40.3, -23.7],
    [-55.0, -43.7],
  ];
  for (const [z0, z1] of spineIntervals) {
    const len = z1 - z0;
    const zc = (z0 + z1) / 2;
    walls.push({ id: `spine-w-${zc}`, position: [-2.8, H / 2, zc], size: [T, H, len], variant: 'cream' });
    walls.push({ id: `spine-e-${zc}`, position: [2.8, H / 2, zc], size: [T, H, len], variant: 'cream' });
  }

  // Doorway lintels & short connecting passage walls (|X| from 2.8 to 5.5) at Z = -2, -22, -42
  const wingZCenters = [-2, -22, -42];
  for (const zc of wingZCenters) {
    for (const side of [-1, 1] as const) {
      const xMid = side * 4.15;
      // Passage north & south side walls (each 2.7m long in X)
      walls.push({ id: `pass-n-${side}-${zc}`, position: [xMid, H / 2, zc - 1.7], size: [2.7, H, T], variant: 'walnut' });
      walls.push({ id: `pass-s-${side}-${zc}`, position: [xMid, H / 2, zc + 1.7], size: [2.7, H, T], variant: 'walnut' });
      // Doorway lintel at |X|=2.8 and |X|=5.5
      walls.push({ id: `lintel-in-${side}-${zc}`, position: [side * 2.8, 4.1, zc], size: [T, 1.4, 3.4], variant: 'walnut' });
      walls.push({ id: `lintel-out-${side}-${zc}`, position: [side * 5.5, 4.1, zc], size: [T, 1.4, 3.4], variant: 'walnut' });
    }
  }

  // 3. Six Wing Galleries (3 Left at X=-13, 3 Right at X=+13; Z centers -2, -22, -42)
  // Interior bounds: |X| in [5.5, 20.5], Z in [zc-7.5, zc+7.5]
  const wingConfigs = [
    { id: 'gallery-1', side: -1, zc: -2 },
    { id: 'gallery-2', side: 1, zc: -2 },
    { id: 'gallery-3', side: -1, zc: -22 },
    { id: 'gallery-4', side: 1, zc: -22 },
    { id: 'gallery-5', side: -1, zc: -42 },
    { id: 'gallery-6', side: 1, zc: -42 },
  ];

  for (const w of wingConfigs) {
    const cx = w.side * 13;
    const innerX = w.side * 5.5;
    const outerX = w.side * 20.5;
    // Outer vertical wall (15m wide in Z)
    walls.push({ id: `${w.id}-outer`, position: [outerX, H / 2, w.zc], size: [T, H, 15 + T], variant: 'cream', galleryId: w.id });
    // North & South walls (15m wide in X)
    walls.push({ id: `${w.id}-north`, position: [cx, H / 2, w.zc - 7.5], size: [15 + T, H, T], variant: 'cream', galleryId: w.id });
    walls.push({ id: `${w.id}-south`, position: [cx, H / 2, w.zc + 7.5], size: [15 + T, H, T], variant: 'cream', galleryId: w.id });
    // Inner wall split around 3.4m doorway [zc-1.7 .. zc+1.7] (each half = 5.8m)
    walls.push({ id: `${w.id}-inner-n`, position: [innerX, H / 2, w.zc - 4.6], size: [T, H, 5.8], variant: 'cream', galleryId: w.id });
    walls.push({ id: `${w.id}-inner-s`, position: [innerX, H / 2, w.zc + 4.6], size: [T, H, 5.8], variant: 'cream', galleryId: w.id });
  }

  // 4. Secret Forever Us Room (X in [-9, 9], Z in [-73, -55])
  // Portal threshold at Z = -55 (opening X in [-1.8, 1.8])
  walls.push({ id: 'secret-entry-w', position: [-5.9, H / 2, -55], size: [6.2 + T, H, T], variant: 'secret', galleryId: 'forever-us-secret' });
  walls.push({ id: 'secret-entry-e', position: [5.9, H / 2, -55], size: [6.2 + T, H, T], variant: 'secret', galleryId: 'forever-us-secret' });
  walls.push({ id: 'secret-entry-lintel', position: [0, 4.1, -55], size: [3.6, 1.4, T], variant: 'gold-trim', galleryId: 'forever-us-secret' });
  walls.push({ id: 'secret-west', position: [-9, H / 2, -64], size: [T, H, 18 + T], variant: 'secret', galleryId: 'forever-us-secret' });
  walls.push({ id: 'secret-east', position: [9, H / 2, -64], size: [T, H, 18 + T], variant: 'secret', galleryId: 'forever-us-secret' });
  walls.push({ id: 'secret-north', position: [0, H / 2, -73], size: [18 + T, H, T], variant: 'secret', galleryId: 'forever-us-secret' });

  return walls;
}

export const MUSEUM_WALLS = buildMuseumWalls();

export const ROOM_ZONES: RoomZone[] = [
  { id: 'atrium', minX: -6, maxX: 6, minZ: 6, maxZ: 18 },
  { id: 'gallery-1', minX: -20.5, maxX: -5.5, minZ: -9.5, maxZ: 5.5 },
  { id: 'gallery-2', minX: 5.5, maxX: 20.5, minZ: -9.5, maxZ: 5.5 },
  { id: 'gallery-3', minX: -20.5, maxX: -5.5, minZ: -29.5, maxZ: -14.5 },
  { id: 'gallery-4', minX: 5.5, maxX: 20.5, minZ: -29.5, maxZ: -14.5 },
  { id: 'gallery-5', minX: -20.5, maxX: -5.5, minZ: -49.5, maxZ: -34.5 },
  { id: 'gallery-6', minX: 5.5, maxX: 20.5, minZ: -49.5, maxZ: -34.5 },
  { id: 'forever-us-secret', minX: -9, maxX: 9, minZ: -73, maxZ: -55 },
];

export function detectRoomId(x: number, z: number): string {
  for (const r of ROOM_ZONES) {
    if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ) {
      return r.id;
    }
  }
  return 'corridor';
}

export interface AabbCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

const STATIC_COLLIDERS: AabbCollider[] = MUSEUM_WALLS.filter((w) => w.position[1] < 3.0).map((w) => ({
  minX: w.position[0] - w.size[0] / 2,
  maxX: w.position[0] + w.size[0] / 2,
  minZ: w.position[2] - w.size[2] / 2,
  maxZ: w.position[2] + w.size[2] / 2,
}));

// Add Forever Us centerpiece pedestal collider at (0, -64)
STATIC_COLLIDERS.push({ minX: -1.1, maxX: 1.1, minZ: -64.7, maxZ: -63.3 });

/**
 * Resolves smooth circle-vs-AABB sliding collision against all museum walls, pedestals, and closed secret door.
 */
export function resolvePlayerCollision(
  x: number,
  z: number,
  radius = 0.42,
  secretDoorOpen = true
): [number, number] {
  let px = x;
  let pz = z;

  const colliders = secretDoorOpen
    ? STATIC_COLLIDERS
    : [...STATIC_COLLIDERS, { minX: -1.8, maxX: 1.8, minZ: -55.3, maxZ: -54.7 }];

  // Two solver passes prevent corner jitter
  for (let pass = 0; pass < 2; pass++) {
    for (const box of colliders) {
      const closestX = Math.max(box.minX, Math.min(px, box.maxX));
      const closestZ = Math.max(box.minZ, Math.min(pz, box.maxZ));
      const dx = px - closestX;
      const dz = pz - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius) {
        if (distSq > 1e-6) {
          const dist = Math.sqrt(distSq);
          const push = radius - dist;
          px += (dx / dist) * push;
          pz += (dz / dist) * push;
        } else {
          // Inside AABB fallback: push out nearest edge
          const penL = Math.abs(px - box.minX);
          const penR = Math.abs(box.maxX - px);
          const penT = Math.abs(pz - box.minZ);
          const penB = Math.abs(box.maxZ - pz);
          const m = Math.min(penL, penR, penT, penB);
          if (m === penL) px = box.minX - radius;
          else if (m === penR) px = box.maxX + radius;
          else if (m === penT) pz = box.minZ - radius;
          else pz = box.maxZ + radius;
        }
      }
    }
  }

  return [px, pz];
}

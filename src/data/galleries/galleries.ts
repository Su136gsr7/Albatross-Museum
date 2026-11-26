import { GalleryConfig } from '../../types/Gallery';

/**
 * Spatial Museum Layout (World Units = Meters):
 *
 * Grand Entrance Atrium at (0, 0, 12) -> player spawns at (0, 0, 13.5) facing -Z.
 * Central Spine Corridor runs along X = 0 from Z = 8 to Z = -56.
 *
 * Left Wing (X = -13):
 *   Gallery 1: OUR BEGINNING       @ (-13, 0,  -2)
 *   Gallery 3: BEAUTIFUL MOMENTS   @ (-13, 0, -22)
 *   Gallery 5: MY FAVOURITE PICTURES @ (-13, 0, -42)
 *
 * Right Wing (X = +13):
 *   Gallery 2: FIRST MEMORIES      @ (+13, 0,  -2)
 *   Gallery 4: OUR ADVENTURES      @ (+13, 0, -22)
 *   Gallery 6: FOREVER US          @ (+13, 0, -42)
 *
 * Secret Final Sanctum (at far North end of Spine, beyond recessed golden portal):
 *   THE FOREVER US ROOM            @ (  0, 0, -64)
 */
export const DEFAULT_GALLERIES: GalleryConfig[] = [
  {
    id: 'gallery-1',
    index: 1,
    name: 'OUR BEGINNING',
    subtitle: 'Gallery I',
    accentColor: '#d4af6a',
    wallColor: '#efe7da',
    wainscotColor: '#3b281e',
    floorTint: '#e7ddd0',
    ambientHex: '#fff3e0',
    spotHex: '#ffdca8',
    center: [-13, 0, -2],
    halfSize: [7.5, 7.5],
  },
  {
    id: 'gallery-2',
    index: 2,
    name: 'FIRST MEMORIES',
    subtitle: 'Gallery II',
    accentColor: '#c99e63',
    wallColor: '#ebe2d4',
    wainscotColor: '#2e2018',
    floorTint: '#dfd4c5',
    ambientHex: '#ffe9cf',
    spotHex: '#ffd59a',
    center: [13, 0, -2],
    halfSize: [7.5, 7.5],
  },
  {
    id: 'gallery-3',
    index: 3,
    name: 'BEAUTIFUL MOMENTS',
    subtitle: 'Gallery III',
    accentColor: '#deb778',
    wallColor: '#f3ece0',
    wainscotColor: '#472f22',
    floorTint: '#ebe2d6',
    ambientHex: '#fff6e6',
    spotHex: '#ffe1b5',
    center: [-13, 0, -22],
    halfSize: [7.5, 7.5],
  },
  {
    id: 'gallery-4',
    index: 4,
    name: 'OUR ADVENTURES',
    subtitle: 'Gallery IV',
    accentColor: '#c59958',
    wallColor: '#e9dfd1',
    wainscotColor: '#33241b',
    floorTint: '#ddd1c0',
    ambientHex: '#ffeeda',
    spotHex: '#ffd499',
    center: [13, 0, -22],
    halfSize: [7.5, 7.5],
  },
  {
    id: 'gallery-5',
    index: 5,
    name: 'MY FAVOURITE PICTURES',
    subtitle: 'Gallery V',
    accentColor: '#e2bc7d',
    wallColor: '#f0e6d8',
    wainscotColor: '#3d271d',
    floorTint: '#e4d8c9',
    ambientHex: '#fff1db',
    spotHex: '#ffda9e',
    center: [-13, 0, -42],
    halfSize: [7.5, 7.5],
  },
  {
    id: 'gallery-6',
    index: 6,
    name: 'FOREVER US',
    subtitle: 'Gallery VI',
    accentColor: '#e5be79',
    wallColor: '#ede1d0',
    wainscotColor: '#2a1b14',
    floorTint: '#ded0be',
    ambientHex: '#ffebd2',
    spotHex: '#ffd38e',
    center: [13, 0, -42],
    halfSize: [7.5, 7.5],
  },
  {
    id: 'forever-us-secret',
    index: 7,
    name: 'THE FOREVER US ROOM',
    subtitle: 'Secret Sanctum',
    accentColor: '#f2cb85',
    wallColor: '#241812',
    wainscotColor: '#170f0b',
    floorTint: '#2b1e17',
    ambientHex: '#ffdca8',
    spotHex: '#ffcf86',
    center: [0, 0, -64],
    halfSize: [9.0, 9.0],
    isSecret: true,
  },
];

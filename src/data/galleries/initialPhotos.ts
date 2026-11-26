import { PhotoRecord } from '../../types/Photo';
import { ForeverUsConfig } from '../../types/Memory';

function safeAsset(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_') + '.jpg';
}

function makePhoto(
  id: string,
  fileName: string,
  galleryId: string,
  order: number,
  width: number,
  height: number,
  date = '',
  opts: { isFeaturePoster?: boolean; isForeverCenterpiece?: boolean } = {}
): PhotoRecord {
  const safe = safeAsset(fileName);
  const orientation = width > height ? 'landscape' : height > width ? 'portrait' : 'square';
  return {
    id,
    fileName,
    galleryId,
    order,
    title: fileName.replace(/\.[^.]+$/, ''),
    description: '',
    date,
    location: '',
    width,
    height,
    orientation,
    frameUrl: `/album/frames/${safe}`,
    fullUrl: `/album/full/${safe}`,
    source: 'mini-album',
    ...opts,
  };
}

/**
 * Initial 30 actual photographs from Mini Album, ordered factually by EXIF DateTimeOriginal
 * where available, with zero invented stories, dates, or locations.
 */
export const INITIAL_PHOTOS: PhotoRecord[] = [
  // Gallery 1: OUR BEGINNING (early portraits & first outings)
  makePhoto('p-0', '0.jpg', 'gallery-1', 0, 900, 1200, ''),
  makePhoto('p-1', '1.jpg', 'gallery-1', 1, 6528, 3672, '2025-10-20'),
  makePhoto('p-2', '2.jpg', 'gallery-1', 2, 4896, 6528, '2025-11-29'),
  makePhoto('p-3', '3.jpg', 'gallery-1', 3, 4896, 6528, '2025-12-27'),

  // Gallery 2: FIRST MEMORIES
  makePhoto('p-4', '4.jpg', 'gallery-2', 0, 6528, 4896, '2026-01-11'),
  makePhoto('p-5', '5.jpg', 'gallery-2', 1, 6528, 4896, '2026-02-19'),
  makePhoto('p-6', '6.jpg', 'gallery-2', 2, 3000, 4000, '2026-03-14'),
  makePhoto('p-7', '7.jpg', 'gallery-2', 3, 6528, 4896, '2026-04-04'),
  makePhoto('p-10', '10.jpg', 'gallery-2', 4, 1080, 808, ''),

  // Gallery 3: BEAUTIFUL MOMENTS
  makePhoto('p-9', '9.jpg', 'gallery-3', 0, 6528, 4896, '2026-04-25'),
  makePhoto('p-00', '00.png', 'gallery-3', 1, 1086, 1448, ''),
  makePhoto('p-8', '8.jpg', 'gallery-3', 2, 2448, 3264, ''),
  makePhoto('p-14', '14.jpg', 'gallery-3', 3, 1280, 960, ''),
  makePhoto('p-15', '15.jpg', 'gallery-3', 4, 3264, 2448, ''),

  // Gallery 4: OUR ADVENTURES
  makePhoto('p-11', '11.jpg', 'gallery-4', 0, 6528, 4896, '2026-05-09'),
  makePhoto('p-12', '12.jpg', 'gallery-4', 1, 6528, 4896, '2026-06-20'),
  makePhoto('p-13', '13.png', 'gallery-4', 2, 1122, 1402, '', { isFeaturePoster: true }),
  makePhoto('p-16', '16.jpg', 'gallery-4', 3, 3264, 2448, ''),
  makePhoto('p-17', '17.jpg', 'gallery-4', 4, 6528, 4896, '2026-08-09'),

  // Gallery 5: MY FAVOURITE PICTURES
  makePhoto('p-000000j', '000000.jpg', 'gallery-5', 0, 6528, 4896, '2026-08-09'),
  makePhoto('p-18', '18.png', 'gallery-5', 1, 1448, 1086, ''),
  makePhoto('p-000', '000.png', 'gallery-5', 2, 892, 872, ''),
  makePhoto('p-19', '19.jpg', 'gallery-5', 3, 6528, 4896, '2026-09-04'),
  makePhoto('p-00000', '00000.jpg', 'gallery-5', 4, 3000, 4000, '2026-09-12'),

  // Gallery 6: FOREVER US
  makePhoto('p-20', '20.jpg', 'gallery-6', 0, 6528, 4896, '2026-09-14'),
  makePhoto('p-20-2', '20 (2).jpg', 'gallery-6', 1, 6528, 4896, '2026-09-14'),
  makePhoto('p-20-3', '20 (3).jpg', 'gallery-6', 2, 6528, 4896, '2026-09-14'),
  makePhoto('p-000000p', '000000.png', 'gallery-6', 3, 1670, 942, ''),
  makePhoto('p-21', '21.jpg', 'gallery-6', 4, 6528, 4896, '2026-09-20'),

  // Secret Room Centerpiece: THE FOREVER US ROOM
  makePhoto('p-0000', '0000.png', 'forever-us-secret', 0, 922, 1152, '', {
    isFeaturePoster: true,
    isForeverCenterpiece: true,
  }),
];

export const DEFAULT_FOREVER_US: ForeverUsConfig = {
  heading: 'THE FOREVER US ROOM',
  message:
    'Every corridor in this museum leads back to one truth — whether in quiet moments or grand adventures, our little universe is wherever the two of us stand together.',
  centerpiecePhotoId: 'p-0000',
};

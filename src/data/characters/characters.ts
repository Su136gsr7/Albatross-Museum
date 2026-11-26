import { CharacterProfile } from '../../types/Character';

export const CHARACTERS: Record<'MUNNA' | 'AZHAGI', CharacterProfile> = {
  MUNNA: {
    id: 'MUNNA',
    displayName: 'MUNNA',
    realName: 'Sudharsan',
    modelUrl: '/models/munna.glb?v=4',
    heightMeters: 1.76,
    tagline: 'Walking through every moment we built together.',
    welcomeLine: 'Welcome, Munna',
    accentColor: '#d4af6a',
    avatarPosterUrl: '/album/frames/19.jpg.jpg',
  },
  AZHAGI: {
    id: 'AZHAGI',
    displayName: 'AZHAGI',
    realName: 'Jayashree',
    modelUrl: '/models/azhagi.glb?v=4',
    heightMeters: 1.61,
    tagline: 'Every step inside brings back the warmth of us.',
    welcomeLine: 'Welcome, Azhagi',
    accentColor: '#e0a97b',
    avatarPosterUrl: '/album/frames/00000.jpg.jpg',
  },
};

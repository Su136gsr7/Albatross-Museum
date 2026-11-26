export type CharacterId = 'MUNNA' | 'AZHAGI';

export type AnimationState =
  | 'Idle'
  | 'Walk'
  | 'Wave'
  | 'Sit'
  | 'HoldHandsIdle'
  | 'HoldHandsWalk';

export interface CharacterProfile {
  id: CharacterId;
  displayName: string;
  realName: string;
  modelUrl: string;
  heightMeters: number;
  tagline: string;
  welcomeLine: string;
  accentColor: string;
  avatarPosterUrl: string;
}

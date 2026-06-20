export type CornerLabel = 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft';

export interface CornerPoint {
  x: number;
  y: number;
  label: CornerLabel;
}

export type RepeatMode = 'repeat' | 'cover' | 'contain';

export interface ARSettings {
  opacity: number;
  scale: number;
  rotation: number; // in radians
  repeatMode: RepeatMode;
}

export type CameraStatus =
  | 'idle'
  | 'requesting'
  | 'ready'
  | 'permission_denied'
  | 'not_supported'
  | 'error';

export interface BedsheetARState {
  cameraStatus: CameraStatus;
  textureUrl?: string;
  corners: CornerPoint[];
  settings: ARSettings;
  isOverlayReady: boolean;
}

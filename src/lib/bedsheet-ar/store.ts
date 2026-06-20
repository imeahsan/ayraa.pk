import { create } from 'zustand';
import { CameraStatus, CornerPoint, CornerLabel, ARSettings, RepeatMode } from './types';

interface ARStoreState {
  cameraStatus: CameraStatus;
  textureUrl: string | null;
  corners: CornerPoint[];
  settings: ARSettings;
  isOverlayReady: boolean;
  
  // Actions
  setCameraStatus: (status: CameraStatus) => void;
  setTextureUrl: (url: string | null) => void;
  setCorners: (corners: CornerPoint[]) => void;
  addCorner: (point: { x: number; y: number }) => void;
  updateCorner: (label: CornerLabel, x: number, y: number) => void;
  resetCorners: () => void;
  undoLastCorner: () => void;
  updateSettings: (settings: Partial<ARSettings>) => void;
  resetSettings: (defaults?: Partial<ARSettings>) => void;
}

const DEFAULT_SETTINGS: ARSettings = {
  opacity: 0.85,
  scale: 1.0,
  rotation: 0,
  repeatMode: 'repeat',
};

export const useARStore = create<ARStoreState>((set) => ({
  cameraStatus: 'idle',
  textureUrl: null,
  corners: [],
  settings: DEFAULT_SETTINGS,
  isOverlayReady: false,

  setCameraStatus: (status) => set({ cameraStatus: status }),
  
  setTextureUrl: (url) => set({ textureUrl: url }),
  
  setCorners: (corners) => set({ corners, isOverlayReady: corners.length === 4 }),
  
  addCorner: (point) =>
    set((state) => {
      if (state.corners.length >= 4) return state;

      const labels: CornerLabel[] = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'];
      const label = labels[state.corners.length];
      const newCorner: CornerPoint = { ...point, label };
      const newCorners = [...state.corners, newCorner];

      return {
        corners: newCorners,
        isOverlayReady: newCorners.length === 4,
      };
    }),

  updateCorner: (label, x, y) =>
    set((state) => {
      const newCorners = state.corners.map((c) =>
        c.label === label ? { ...c, x, y } : c
      );
      return { corners: newCorners };
    }),

  resetCorners: () => set({ corners: [], isOverlayReady: false }),

  undoLastCorner: () =>
    set((state) => {
      if (state.corners.length === 0) return state;
      const newCorners = state.corners.slice(0, -1);
      return {
        corners: newCorners,
        isOverlayReady: false,
      };
    }),

  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  resetSettings: (defaults) =>
    set({
      settings: { ...DEFAULT_SETTINGS, ...defaults },
    }),
}));

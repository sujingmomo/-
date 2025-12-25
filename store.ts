import { create } from 'zustand';
import { AppState, TreeState } from './types';

export const useStore = create<AppState>((set) => ({
  treeState: TreeState.FORMED,
  rotationY: 0,
  cameraZoom: 1, // Normalized 0-1 (mapped to actual camera distance later)
  focusedPhotoId: null,
  uploadedImages: [],
  
  setTreeState: (state) => set({ treeState: state }),
  setRotationY: (rad) => set({ rotationY: rad }),
  setCameraZoom: (zoom) => set({ cameraZoom: Math.max(0, Math.min(1, zoom)) }),
  setFocusedPhotoId: (id) => set({ focusedPhotoId: id }),
  addUploadedImage: (url) => set((state) => ({ uploadedImages: [...state.uploadedImages, url] })),
}));
import { Vector3 } from 'three';

export enum TreeState {
  CHAOS = 'CHAOS',
  FORMED = 'FORMED',
}

export type OrnamentType = 'SPHERE' | 'BOX' | 'GEM' | 'STAR' | 'PHOTO';

export interface OrnamentData {
  id: string;
  type: OrnamentType;
  position: [number, number, number]; // Final tree position
  chaosPosition: [number, number, number]; // Exploded position
  color: string;
  scale: number;
  imageUrl?: string;
}

export interface AppState {
  treeState: TreeState;
  rotationY: number;
  cameraZoom: number;
  focusedPhotoId: string | null;
  uploadedImages: string[];
  setTreeState: (state: TreeState) => void;
  setRotationY: (rad: number) => void;
  setCameraZoom: (zoom: number) => void;
  setFocusedPhotoId: (id: string | null) => void;
  addUploadedImage: (url: string) => void;
}

export const CONSTANTS = {
  NEEDLE_COUNT: 40000,
  TRUNK_COUNT: 6000,
  DUST_COUNT: 2000,
  COLORS: {
    GOLD: '#FFD700',
    SILVER: '#C0C0C0',
    RED: '#8a0303',
    EMERALD: '#046307',
    TRUNK: '#4A3728',
  }
};
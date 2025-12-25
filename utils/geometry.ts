import * as THREE from 'three';
import { CONSTANTS } from '../types';

// Helper for random range
const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

// Generate Chaos Sphere positions
export const generateChaosPosition = (radius: number = 10): [number, number, number] => {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos((Math.random() * 2) - 1);
  const r = Math.cbrt(Math.random()) * radius;
  
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  ];
};

// Generate Sawtooth Pine Tree Logic
export const generateTreePosition = (index: number, total: number): [number, number, number] => {
  // Height from 0 to 1
  const h = index / total; 
  // Base radius tapers to top
  const baseRadius = 3.5 * (1 - h);
  
  // Sawtooth/Tier logic: 
  // We want layers. 
  const tiers = 15;
  const tierProgress = (h * tiers) % 1; // 0 to 1 within a tier
  const tierExpansion = tierProgress * 1.5; // Branches stick out
  
  const r = (Math.random() * baseRadius) + (tierExpansion * 0.5 * (1-h));
  const theta = Math.random() * Math.PI * 2;
  
  const x = r * Math.cos(theta);
  const y = (h * 12) - 4; // Tree height roughly -4 to 8
  const z = r * Math.sin(theta);
  
  return [x, y, z];
};

// Generate Spiral Trunk/Roots
export const generateTrunkPosition = (index: number, total: number): [number, number, number] => {
  const t = index / total;
  
  // y ranges from -6 (roots) to 8 (top)
  const y = (t * 14) - 6;
  
  let r = 0;
  let theta = Math.random() * Math.PI * 2;
  
  if (y < 0) {
    // Spiral roots
    const rootProgress = Math.abs(y) / 6;
    r = 0.2 + (rootProgress * 4); // Wide at bottom
    theta = rootProgress * 10 + Math.random(); // Spiral twist
  } else {
    // Solid Trunk
    r = Math.random() * (0.8 * (1 - (y/8))); // Taper up
  }
  
  const x = r * Math.cos(theta);
  const z = r * Math.sin(theta);
  
  return [x, y, z];
};

export const generateOrnaments = (count: number, photos: string[]) => {
  const ornaments = [];
  const types = ['SPHERE', 'BOX', 'GEM', 'STAR'];
  const colors = [CONSTANTS.COLORS.RED, CONSTANTS.COLORS.GOLD, CONSTANTS.COLORS.SILVER];
  
  for (let i = 0; i < count; i++) {
    const isPhoto = photos.length > 0 && i < photos.length;
    const type = isPhoto ? 'PHOTO' : types[Math.floor(Math.random() * types.length)];
    
    // Position logic: Avoid very top and very bottom for photos
    let h = Math.random();
    if (type === 'PHOTO') {
      h = 0.25 + (Math.random() * 0.5); // 0.25 to 0.75
    }
    
    const y = (h * 11) - 3;
    const baseR = 3.5 * (1 - h);
    // Place on outer edge
    const r = baseR + (Math.random() * 0.5);
    const theta = Math.random() * Math.PI * 2;
    
    ornaments.push({
      id: `ornament-${i}`,
      type,
      position: [r * Math.cos(theta), y, r * Math.sin(theta)],
      chaosPosition: generateChaosPosition(15),
      color: colors[Math.floor(Math.random() * colors.length)],
      scale: type === 'PHOTO' ? 1.2 : randomRange(0.3, 0.6),
      imageUrl: isPhoto ? photos[i] : undefined,
    });
  }
  return ornaments;
};
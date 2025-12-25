import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Instance, Instances, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { easing } from 'maath';
import { useStore } from '../store';
import { CONSTANTS, OrnamentData, TreeState } from '../types';
import { generateChaosPosition, generateOrnaments, generateTreePosition, generateTrunkPosition } from '../utils/geometry';

// Reusable geometries and materials to improve performance
const sphereGeo = new THREE.SphereGeometry(1, 16, 16);
const needleMaterial = new THREE.MeshStandardMaterial({
  color: CONSTANTS.COLORS.EMERALD,
  roughness: 0.3,
  metalness: 0.6,
});
const trunkMaterial = new THREE.MeshStandardMaterial({
  color: CONSTANTS.COLORS.TRUNK,
  roughness: 0.9,
});

const PhotoFrame: React.FC<{ url: string; position: THREE.Vector3 }> = ({ url, position }) => {
  const texture = useLoader(THREE.TextureLoader, url);
  return (
    <mesh position={position} rotation={[0,0,0]} renderOrder={9999}>
      <planeGeometry args={[3, 4]} />
      <meshBasicMaterial 
        map={texture} 
        side={THREE.DoubleSide} 
        transparent 
        depthTest={false}
      />
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[3.2, 4.2, 0.1]} />
        <meshStandardMaterial color={CONSTANTS.COLORS.GOLD} metalness={1} roughness={0.2} />
      </mesh>
    </mesh>
  );
};

const NeedleParticles = () => {
  const treeState = useStore(s => s.treeState);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const count = CONSTANTS.NEEDLE_COUNT;
  
  const [data] = useState(() => {
    const chaos = new Float32Array(count * 3);
    const formed = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const c = generateChaosPosition(15);
      const f = generateTreePosition(i, count);
      chaos.set(c, i * 3);
      formed.set(f, i * 3);
    }
    return { chaos, formed };
  });

  const tempObj = new THREE.Object3D();
  const tempVec = new THREE.Vector3();

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Animate transition
    const t = treeState === TreeState.FORMED ? 1 : 0;
    
    // We update instances manually for lerping positions
    for (let i = 0; i < count; i++) {
      const cx = data.chaos[i * 3];
      const cy = data.chaos[i * 3 + 1];
      const cz = data.chaos[i * 3 + 2];
      
      const fx = data.formed[i * 3];
      const fy = data.formed[i * 3 + 1];
      const fz = data.formed[i * 3 + 2];
      
      // Manual Lerp using damp would be too expensive per frame for 40k in JS without shaders
      // Using a simplified lerp based on a global animation value would be better, 
      // but here we can check global time or simply mix.
      // For performance, we assume 't' is the target and we ease a global 'progress' ref?
      // Let's rely on React-Spring or Maath for a value, but applying 40k updates in JS is heavy.
      // Optimization: Calculate 'mix' factor once per frame.
    }
  });

  // ShaderMaterial approach would be better for 40k particles lerping. 
  // However, sticking to R3F ecosystem standards with Drei Instances is requested.
  // We will use a custom shader material for the points/instances to handle the position mix on GPU.
  
  return (
    <PointsSystem data={data} mode={treeState} color={CONSTANTS.COLORS.EMERALD} size={0.15} />
  );
};

// Optimized GPU Lerp Component using Points
const PointsSystem = ({ data, mode, color, size }: any) => {
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    const mixVal = useRef(0);

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uMix: { value: 0 },
        uColor: { value: new THREE.Color(color) },
        uSize: { value: size * window.devicePixelRatio }
    }), [color, size]);

    useFrame((state, delta) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
            const target = mode === TreeState.FORMED ? 1 : 0;
            easing.damp(mixVal, 'current', target, 1.5, delta);
            materialRef.current.uniforms.uMix.value = mixVal.current;
        }
    });

    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(data.chaos, 3));
        geo.setAttribute('aTarget', new THREE.BufferAttribute(data.formed, 3));
        // Add randomness for sparkle
        const randoms = new Float32Array(data.chaos.length / 3).map(() => Math.random());
        geo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));
        return geo;
    }, [data]);

    const shaderArgs = useMemo(() => ({
        uniforms,
        vertexShader: `
            uniform float uTime;
            uniform float uMix;
            uniform float uSize;
            attribute vec3 aTarget;
            attribute float aRandom;
            varying float vAlpha;
            
            void main() {
                vec3 pos = mix(position, aTarget, uMix);
                
                // Add some subtle noise movement
                pos.x += sin(uTime * 2.0 + aRandom * 10.0) * 0.05 * (1.0 - uMix);
                pos.y += cos(uTime * 1.5 + aRandom * 10.0) * 0.05 * (1.0 - uMix);
                
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                
                // Size attenuation
                gl_PointSize = uSize * (30.0 / -mvPosition.z);
                
                vAlpha = 0.6 + 0.4 * sin(uTime * 3.0 + aRandom * 20.0);
            }
        `,
        fragmentShader: `
            uniform vec3 uColor;
            varying float vAlpha;
            
            void main() {
                if (length(gl_PointCoord - vec2(0.5)) > 0.5) discard;
                gl_FragColor = vec4(uColor, vAlpha);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    }), [uniforms]);

    return (
        <points geometry={geometry}>
            <shaderMaterial ref={materialRef} {...shaderArgs} />
        </points>
    );
}

const TrunkSystem = () => {
  const treeState = useStore(s => s.treeState);
  const count = CONSTANTS.TRUNK_COUNT;
  
  const [data] = useState(() => {
    const chaos = new Float32Array(count * 3);
    const formed = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const c = generateChaosPosition(8);
      const f = generateTrunkPosition(i, count);
      chaos.set(c, i * 3);
      formed.set(f, i * 3);
    }
    return { chaos, formed };
  });

  return <PointsSystem data={data} mode={treeState} color={CONSTANTS.COLORS.TRUNK} size={0.2} />;
};

const OrnamentsLayer = () => {
    const { treeState, uploadedImages, focusedPhotoId } = useStore();
    const [ornaments, setOrnaments] = useState<any[]>([]);
    
    // Re-generate ornaments when images change
    useEffect(() => {
       const oms = generateOrnaments(100 + uploadedImages.length, uploadedImages);
       setOrnaments(oms);
    }, [uploadedImages]);

    const groupRef = useRef<THREE.Group>(null);
    const mixVal = useRef(0);

    useFrame((state, delta) => {
        const target = treeState === TreeState.FORMED ? 1 : 0;
        easing.damp(mixVal, 'current', target, 1.2, delta);
        
        if (groupRef.current) {
            groupRef.current.children.forEach((child: any, i) => {
               if (ornaments[i]) {
                   const start = new THREE.Vector3(...ornaments[i].chaosPosition);
                   const end = new THREE.Vector3(...ornaments[i].position);
                   child.position.lerpVectors(start, end, mixVal.current);
                   
                   // Rotate ornaments slightly
                   child.rotation.y += delta * 0.5;
               }
            });
        }
    });

    const focusedOrnament = useMemo(() => 
        ornaments.find(o => o.id === focusedPhotoId), 
    [focusedPhotoId, ornaments]);

    return (
        <>
            <group ref={groupRef}>
                {ornaments.map((o) => {
                    if (o.id === focusedPhotoId) return null; // Hide if focused

                    return (
                        <mesh key={o.id} scale={o.scale}>
                            {o.type === 'BOX' && <boxGeometry args={[1,1,1]} />}
                            {o.type === 'SPHERE' && <sphereGeometry args={[0.6, 32, 32]} />}
                            {o.type === 'GEM' && <octahedronGeometry args={[0.6]} />}
                            {o.type === 'STAR' && <icosahedronGeometry args={[0.7]} />}
                            {o.type === 'PHOTO' && <boxGeometry args={[1.5, 2, 0.1]} />}
                            
                            <meshPhysicalMaterial 
                                color={o.type === 'PHOTO' ? 'white' : o.color}
                                metalness={0.9}
                                roughness={0.1}
                                envMapIntensity={2}
                                map={o.imageUrl ? new THREE.TextureLoader().load(o.imageUrl) : null}
                            />
                        </mesh>
                    )
                })}
            </group>
            
            {focusedOrnament && focusedOrnament.imageUrl && (
                 <PhotoFrame 
                    url={focusedOrnament.imageUrl} 
                    position={new THREE.Vector3(0, 0, 5)} // Close to camera
                 />
            )}
        </>
    );
};

export const LuxuryTree: React.FC = () => {
  const rotationY = useStore(s => s.rotationY);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
      if (groupRef.current) {
          // Smooth rotation based on hand input
          groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, rotationY * Math.PI * 2, 0.1);
      }
  });

  return (
    <group ref={groupRef}>
      <NeedleParticles />
      <TrunkSystem />
      <OrnamentsLayer />
    </group>
  );
};
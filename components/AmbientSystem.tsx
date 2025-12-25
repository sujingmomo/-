import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONSTANTS, TreeState } from '../types';
import { useStore } from '../store';

export const AmbientSystem: React.FC = () => {
  const treeState = useStore(s => s.treeState);
  
  return (
    <group>
      <GoldDust />
      <GoldenSpirals visible={treeState === TreeState.FORMED} />
      <Snow />
    </group>
  );
};

const GoldDust = () => {
    const count = CONSTANTS.DUST_COUNT;
    const mesh = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const particles = useMemo(() => {
        const temp = [];
        for(let i=0; i<count; i++) {
            const t = Math.random() * 100;
            const factor = 20 + Math.random() * 100;
            const speed = 0.01 + Math.random() / 200;
            const x = (Math.random() - 0.5) * 50;
            const y = (Math.random() - 0.5) * 50;
            const z = (Math.random() - 0.5) * 50;
            temp.push({ t, factor, speed, x, y, z, mx: 0, my: 0 });
        }
        return temp;
    }, [count]);

    useFrame((state) => {
        if (!mesh.current) return;
        particles.forEach((particle, i) => {
            let { t, factor, speed, x, y, z } = particle;
            t = particle.t += speed / 2;
            const a = Math.cos(t) + Math.sin(t * 1) / 10;
            const b = Math.sin(t) + Math.cos(t * 2) / 10;
            const s = Math.cos(t);
            
            dummy.position.set(
                x + Math.cos(t / 10) * factor + (Math.sin(t * 1) * factor) / 10,
                y + Math.sin(t / 10) * factor + (Math.cos(t * 2) * factor) / 10,
                z + Math.cos(t / 10) * factor + (Math.sin(t * 3) * factor) / 10
            );
            dummy.scale.setScalar(s * 0.1 + 0.05);
            dummy.rotation.set(s * 5, s * 5, s * 5);
            dummy.updateMatrix();
            mesh.current!.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
            <dodecahedronGeometry args={[0.2, 0]} />
            <meshPhysicalMaterial color={CONSTANTS.COLORS.GOLD} transparent opacity={0.6} metalness={1} roughness={0} />
        </instancedMesh>
    );
};

const GoldenSpirals = ({ visible }: { visible: boolean }) => {
    const pointsRef = useRef<THREE.Points>(null);
    
    const geometry = useMemo(() => {
        const points = [];
        const spirals = 2;
        const loops = 8;
        const pointsPerLoop = 200;
        
        for(let s=0; s<spirals; s++) {
            for(let i=0; i < loops * pointsPerLoop; i++) {
                const progress = i / (loops * pointsPerLoop);
                const angle = progress * Math.PI * 2 * loops + (s * Math.PI);
                const y = (progress * 14) - 5;
                const r = 4.5 * (1 - progress) + 0.5; // Taper with tree
                
                points.push(
                    r * Math.cos(angle),
                    y,
                    r * Math.sin(angle)
                );
            }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        return geo;
    }, []);

    useFrame((state) => {
        if (pointsRef.current) {
             pointsRef.current.rotation.y = -state.clock.elapsedTime * 0.2;
             // Scale opacity based on visibility
             const mat = pointsRef.current.material as THREE.PointsMaterial;
             mat.opacity = THREE.MathUtils.lerp(mat.opacity, visible ? 0.6 : 0, 0.05);
        }
    });

    return (
        <points ref={pointsRef} geometry={geometry}>
            <pointsMaterial 
                color={CONSTANTS.COLORS.GOLD} 
                size={0.15} 
                transparent 
                opacity={0} 
                blending={THREE.AdditiveBlending} 
                depthWrite={false}
            />
        </points>
    );
};

const Snow = () => {
    const count = 1000;
    const mesh = useRef<THREE.Points>(null);
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for(let i=0; i<count*3; i++) pos[i] = (Math.random() - 0.5) * 40;
        return pos;
    }, []);

    useFrame((state, delta) => {
        if(!mesh.current) return;
        // Simple CPU animation for snow falling
        const positions = mesh.current.geometry.attributes.position.array as Float32Array;
        for(let i=1; i<positions.length; i+=3) {
            positions[i] -= delta * 2;
            if (positions[i] < -10) positions[i] = 20;
        }
        mesh.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={mesh}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial size={0.1} color="white" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
        </points>
    );
};
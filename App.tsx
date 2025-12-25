import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { LuxuryTree } from './components/LuxuryTree';
import { AmbientSystem } from './components/AmbientSystem';
import { HandController } from './components/HandController';
import { Overlay } from './components/Overlay';
import { useStore } from './store';

const SceneContent = () => {
  const cameraZoom = useStore(s => s.cameraZoom);
  
  // Map normalized zoom (0-1) to actual Z position
  // 0 -> far (25), 1 -> close (8)
  const zPos = 25 - (cameraZoom * 17);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, zPos]} fov={50} />
      <OrbitControls 
        enablePan={false} 
        enableZoom={false} // Zoom handled by hand/camera pos
        minPolarAngle={Math.PI / 3} 
        maxPolarAngle={Math.PI / 1.5}
        autoRotate={false}
      />
      
      {/* Lighting for Luxury */}
      <ambientLight intensity={0.2} color="#001100" />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffd700" />
      <pointLight position={[-10, 5, -10]} intensity={1} color="#ff0000" />
      <spotLight position={[0, 20, 0]} intensity={2} angle={0.3} penumbra={1} color="#ffffff" castShadow />

      <group position={[0, -4, 0]}>
         <LuxuryTree />
         <AmbientSystem />
      </group>

      <Environment preset="city" background={false} />
      
      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.8} mipmapBlur intensity={1.5} radius={0.6} />
        <Vignette offset={0.3} darkness={0.6} />
        <Noise opacity={0.05} blendFunction={BlendFunction.OVERLAY} />
      </EffectComposer>
    </>
  );
};

function App() {
  return (
    <>
      <div className="relative w-full h-screen bg-deep-green overflow-hidden">
        <Overlay />
        <HandController />
        <Canvas 
          shadows
          dpr={[1, 2]} 
          gl={{ antialias: false, toneMappingExposure: 1.2 }}
        >
          <color attach="background" args={['#000502']} />
          <fog attach="fog" args={['#000502', 10, 50]} />
          
          <Suspense fallback={null}>
            <SceneContent />
          </Suspense>
        </Canvas>
      </div>
    </>
  );
}

export default App;
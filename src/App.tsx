import React, { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Loader, OrbitControls, Environment } from '@react-three/drei';
import { useGameStore } from './store';
import UIOverlay from './components/UIOverlay';
import ProgressBar from './components/ProgressBar';
import Scene from './components/Scene';

function ResponsiveCamera() {
  const { camera, size } = useThree();
  const stage = useGameStore((state) => state.stage);
  
  useEffect(() => {
    if (stage === 3 || stage === 4) return; // Don't override Stage 3 or 4 camera
    
    const aspect = size.width / size.height;
    if (aspect < 1) {
      // Mobile portrait mode: wider FOV and pull camera back
      (camera as any).fov = 65;
      camera.position.set(0, 7, 12);
    } else {
      // Desktop landscape mode
      (camera as any).fov = 45;
      camera.position.set(0, 5, 8);
    }
    camera.updateProjectionMatrix();
  }, [size, camera, stage]);
  
  return null;
}

export default function App() {
  const controlsEnabled = useGameStore((state) => state.controlsEnabled);
  const viewLocked = useGameStore((state) => state.viewLocked);
  const stage = useGameStore((state) => state.stage);

  return (
    <div className="w-full h-screen bg-[#FFF8E1] text-[#4E342E] overflow-hidden relative font-sans">
      <UIOverlay />
      <ProgressBar />
      
      <Canvas
        shadows
        dpr={[1, 1.5]} // Cap DPR to 1.5 for massive performance boost on mobile
        camera={{ position: [0, 5, 8], fov: 45 }}
        gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: "high-performance" }}
        className="w-full h-full"
      >
        <ResponsiveCamera />
        <color attach="background" args={['#FFF8E1']} />
        <fog attach="fog" args={['#D7CCC8', 10, 30]} />
        
        <ambientLight intensity={0.6} color="#FFFDE7" />
        <directionalLight
          castShadow
          position={[10, 15, 10]}
          intensity={2.5}
          color="#FFF8E1"
          shadow-mapSize-width={1024} // Reduced from 2048 for performance
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-5, 5, -5]} intensity={0.8} color="#FFB61E" />

        <Suspense fallback={null}>
          <Environment preset="city" />
          <Scene />
        </Suspense>

        <OrbitControls
          makeDefault
          enabled={controlsEnabled && !viewLocked && stage !== 3}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2 - 0.1}
          minDistance={2}
          maxDistance={15}
          enablePan={false}
        />
      </Canvas>
      <Loader />
    </div>
  );
}

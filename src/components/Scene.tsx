import React, { useRef } from 'react';
import { useGameStore } from '../store';
import { useFrame } from '@react-three/fiber';
import { Box, Plane, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Stages
import Stage1 from './stages/Stage1';
import Stage2 from './stages/Stage2';
import Stage3 from './stages/Stage3';
import Stage4 from './stages/Stage4';
import Stage5 from './stages/Stage5';
import Stage6 from './stages/Stage6';

export default function Scene() {
  const stage = useGameStore((state) => state.stage);

  return (
    <group>
      {/* Consistent Background Table */}
      <Box args={[14, 0.5, 10]} position={[0, -0.25, 0]} receiveShadow>
        <meshStandardMaterial color="#D4A574" roughness={0.9} />
      </Box>

      {/* Render current stage */}
      {stage === 1 && <Stage1 />}
      {stage === 2 && <Stage2 />}
      {stage === 3 && <Stage3 />}
      {stage === 4 && <Stage4 />}
      {stage === 5 && <Stage5 />}
      {stage === 6 && <Stage6 />}
    </group>
  );
}

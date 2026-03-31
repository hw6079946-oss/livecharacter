import React from 'react';
import { Box } from '@react-three/drei';
import * as THREE from 'three';

interface TrayProps {
  layoutMode: 'vertical' | 'horizontal';
  children?: React.ReactNode;
  inkLevel?: number;
}

export default function Tray({ layoutMode, children, inkLevel = 0 }: TrayProps) {
  const isVertical = layoutMode === 'vertical';
  const width = isVertical ? 1.2 : 5.0;
  const depth = isVertical ? 5.0 : 1.2;
  const blockHeight = 0.9;
  const wallThickness = 0.1;
  const baseThickness = 0.1;
  const totalHeight = blockHeight + baseThickness;

  const wallColor = new THREE.Color('#5d4037').lerp(new THREE.Color('#212121'), inkLevel / 100);

  return (
    <group>
      {/* Base */}
      <Box args={[width, baseThickness, depth]} position={[0, baseThickness / 2, 0]} receiveShadow>
        <meshStandardMaterial color="#3e2723" />
      </Box>

      {/* Walls */}
      {/* Left Wall */}
      <Box 
        args={[wallThickness, totalHeight, depth]} 
        position={[-width / 2 + wallThickness / 2, totalHeight / 2, 0]} 
        castShadow 
        receiveShadow
      >
        <meshStandardMaterial color={wallColor} />
      </Box>
      {/* Right Wall */}
      <Box 
        args={[wallThickness, totalHeight, depth]} 
        position={[width / 2 - wallThickness / 2, totalHeight / 2, 0]} 
        castShadow 
        receiveShadow
      >
        <meshStandardMaterial color={wallColor} />
      </Box>
      {/* Top Wall */}
      <Box 
        args={[width, totalHeight, wallThickness]} 
        position={[0, totalHeight / 2, -depth / 2 + wallThickness / 2]} 
        castShadow 
        receiveShadow
      >
        <meshStandardMaterial color={wallColor} />
      </Box>
      {/* Bottom Wall */}
      <Box 
        args={[width, totalHeight, wallThickness]} 
        position={[0, totalHeight / 2, depth / 2 - wallThickness / 2]} 
        castShadow 
        receiveShadow
      >
        <meshStandardMaterial color={wallColor} />
      </Box>

      {children}
    </group>
  );
}

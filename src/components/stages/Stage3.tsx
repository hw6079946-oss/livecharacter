import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Box, Cylinder, Plane } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import Label from '../Label';
import Tray from '../Tray';
import { useGameStore } from '../../store';
import { createYangkeTextures, createGridTexture } from '../../utils/texture';
import * as THREE from 'three';

function RollerTool({ position, active, layoutMode, inkingProgress }: { position: THREE.Vector3, active: boolean, layoutMode: 'vertical' | 'horizontal', inkingProgress: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const rollerColor = new THREE.Color('#757575').lerp(new THREE.Color('#212121'), inkingProgress);
  const cylinderRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (groupRef.current) {
      const targetPos = position.clone();
      targetPos.y = active ? 1.0 : 1.5; // Lower when active
      groupRef.current.position.lerp(targetPos, 0.2);
      
      // Rotate roller when moving
      if (active && cylinderRef.current) {
        cylinderRef.current.rotation.x += 0.2; // Spin the cylinder
      }
    }
  });

  return (
    <group ref={groupRef}>
      <group rotation={layoutMode === 'vertical' ? [0, 0, 0] : [0, Math.PI / 2, 0]}>
        <Cylinder ref={cylinderRef as any} args={[0.25, 0.25, 1.2, 32]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <meshStandardMaterial color={rollerColor} roughness={0.5} />
        </Cylinder>
        {/* Handle */}
        <Box args={[0.1, 0.8, 0.1]} position={[0, 0.5, 0]} castShadow>
          <meshStandardMaterial color="#8d6e63" />
        </Box>
        <Box args={[1.3, 0.1, 0.1]} position={[0, 0.1, 0]} castShadow>
          <meshStandardMaterial color="#8d6e63" />
        </Box>
        <Box args={[0.1, 0.3, 0.1]} position={[-0.6, 0, 0]} castShadow>
          <meshStandardMaterial color="#8d6e63" />
        </Box>
        <Box args={[0.1, 0.3, 0.1]} position={[0.6, 0, 0]} castShadow>
          <meshStandardMaterial color="#8d6e63" />
        </Box>
      </group>
    </group>
  );
}

function TrayChar({ char, index, inkLevel, layoutMode }: { char: string, index: number, inkLevel: number, layoutMode: 'vertical' | 'horizontal' }) {
  // Ink color for the raised character (gets pure black)
  const inkColor = new THREE.Color('#5d4037').lerp(new THREE.Color('#0a0a0a'), inkLevel / 100).getHexString();
  // Ink bg color for the flat surface (gets slightly darker but not pure black)
  const inkBgColor = new THREE.Color('#8d6e63').lerp(new THREE.Color('#4e342e'), inkLevel / 100).getHexString();
  
  // Roughness color for the text: starts matte (white/gray), becomes shiny (dark gray/black)
  const textRoughnessColor = new THREE.Color('#dddddd').lerp(new THREE.Color('#111111'), inkLevel / 100).getHexString();

  const { map, bumpMap, roughnessMap } = useMemo(() => createYangkeTextures(char, true, `#${inkColor}`, `#${inkBgColor}`, `#${textRoughnessColor}`), [char, inkColor, inkBgColor, textRoughnessColor]);
  
  const pos = layoutMode === 'vertical' 
    ? [0, 0.55, index * 0.92 - 1.84] 
    : [index * 0.92 - 1.84, 0.55, 0];
  
  return (
    <Box 
      args={[0.9, 0.9, 0.9, 32, 32, 32]} 
      position={pos as any}
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <meshStandardMaterial 
          key={i}
          attach={`material-${i}`}
          color="#a1887f" 
          map={i === 2 ? map : undefined} 
          bumpMap={i === 2 ? bumpMap : undefined}
          bumpScale={0.4}
          displacementMap={i === 2 ? bumpMap : undefined}
          displacementScale={0.05}
          roughnessMap={i === 2 ? roughnessMap : undefined}
          roughness={i === 2 ? 1.0 : 0.9}
          metalness={i === 2 ? (inkLevel / 100) * 0.6 : 0.1}
        />
      ))}
    </Box>
  );
}

export default function Stage3() {
  const { tray, inkLevel, setInkLevel, rollerInked, setRollerInked, setHint, setStage, layoutMode, setControlsEnabled } = useGameStore();
  const [inkingProgress, setInkingProgress] = useState(rollerInked ? 1 : 0);
  const rollerRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [pointerPos, setPointerPos] = useState(new THREE.Vector3(0, 0.6, -2.5));
  const [charInkLevels, setCharInkLevels] = useState<number[]>(Array(5).fill(inkLevel));
  
  // Set initial camera for Stage 3
  useEffect(() => {
    const isMobile = window.innerWidth < window.innerHeight;
    const targetPos = isMobile ? new THREE.Vector3(0, 12, 10) : new THREE.Vector3(0, 10, 8);
    const targetLookAt = new THREE.Vector3(0, 0, 0);
    
    let frameId: number;
    const animate = () => {
      camera.position.lerp(targetPos, 0.05);
      camera.lookAt(targetLookAt);
      if (camera.position.distanceTo(targetPos) > 0.01) {
        frameId = requestAnimationFrame(animate);
      }
    };
    animate();
    
    setControlsEnabled(true);
    return () => cancelAnimationFrame(frameId);
  }, [camera, setControlsEnabled]);

  const trayGridTexture = useMemo(() => createGridTexture(1.0, 4.7, layoutMode === 'vertical' ? 1 : 5, layoutMode === 'vertical' ? 5 : 1, '#3e2723', false), [layoutMode]);

  const handleInkPadClick = () => {
    if (inkingProgress > 0 && inkingProgress < 1) return;
    setRollerInked(true);
    setHint('墨辊已蘸墨，请在活字表面来回拖拽涂抹。');
  };

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (!rollerInked || inkingProgress < 1) {
      setHint('请先点击上方墨台，用墨辊蘸取墨汁！');
      return;
    }
    setIsPointerDown(true);
    setPointerPos(e.point);
    setControlsEnabled(false);
  };

  const handlePointerUp = (e: any) => {
    e.stopPropagation();
    setIsPointerDown(false);
    setControlsEnabled(true);
  };

  const handlePointerMove = (e: any) => {
    e.stopPropagation();
    if (!rollerInked || inkingProgress < 1) return;
    setPointerPos(e.point);
  };

  useFrame((state, delta) => {
    if (rollerInked && inkingProgress < 1) {
      setInkingProgress(prev => Math.min(1, prev + delta * 1.5));
    }
    
    if (rollerRef.current) {
      // Dipping animation if inking
      if (rollerInked && inkingProgress < 1) {
        rollerRef.current.position.y = 0.5 - Math.sin(inkingProgress * Math.PI) * 0.2;
      } else {
        // Return to pad
        rollerRef.current.position.lerp(new THREE.Vector3(0, 0.6, 0), 0.1);
        rollerRef.current.rotation.x = 0;
      }
    }

    // Dragging ink logic
    if (isPointerDown && pointerPos && rollerInked && inkingProgress >= 1) {
      let changed = false;
      const newLevels = charInkLevels.map((level, i) => {
        if (!tray[i]) return level; // Skip empty slots
        
        // Character position in world space
        const charPos = layoutMode === 'vertical' 
          ? new THREE.Vector3(0, 0.55, i * 0.92 - 1.84)
          : new THREE.Vector3(i * 0.92 - 1.84, 0.55, 0);
        
        charPos.add(new THREE.Vector3(0, 0, 2)); // Tray is at [0, 0, 2]

        const dist = pointerPos.distanceTo(charPos);
        if (dist < 1.5) { // Roller influence radius
          changed = true;
          // Increase ink level based on distance and delta
          const increase = (1.5 - dist) * 150 * delta; 
          return Math.min(120, level + increase); // Cap at 120
        }
        return level;
      });

      if (changed) {
        setCharInkLevels(newLevels);
        // Update global ink level
        const filledCharsCount = tray.filter(c => c).length;
        const avgInk = filledCharsCount > 0 ? newLevels.reduce((a, b) => a + b, 0) / filledCharsCount : 0;
        
        setInkLevel(Math.min(100, avgInk)); 
        
        if (avgInk >= 100 && inkLevel < 100) {
          setHint('墨量适中！进入拓印环节。');
          setTimeout(() => {
            setStage(4);
            setHint('请铺上宣纸，并用棕刷适度按压。');
          }, 2000);
        } else if (avgInk > 110) {
          setHint('墨量过量，字迹会晕染！请重置本关。');
        } else if (avgInk < 100) {
          setHint(`正在刷墨... ${Math.floor(avgInk)}%`);
        }
      }
    }
  });

  const rollerColor = new THREE.Color('#757575').lerp(new THREE.Color('#212121'), inkingProgress);

  return (
    <group position={[0, 0, 0]}>
      {/* Ink Pad (墨台) - Top position */}
      <group position={[0, 0, -2.5]}>
        <Box args={[4, 0.4, 2.5]} position={[0, 0.1, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#4e342e" />
        </Box>
        <Label position={[0, 1.2, 0]} fontSize={0.35} color="#4E342E" text="墨台 (点击蘸墨)" />
        <Box 
          args={[2, 0.1, 1.5]} 
          position={[0, 0.35, 0]} 
          onClick={(e) => { e.stopPropagation(); handleInkPadClick(); }}
          onPointerOver={() => document.body.style.cursor = 'pointer'}
          onPointerOut={() => document.body.style.cursor = 'auto'}
        >
          <meshStandardMaterial color="#111111" roughness={0.1} />
        </Box>
        
        {(!rollerInked || inkingProgress < 1) && (
          <group 
            ref={rollerRef as any}
            position={[0, 0.6, 0]} 
            rotation={layoutMode === 'vertical' ? [0, 0, 0] : [0, Math.PI / 2, 0]}
            onClick={(e) => { e.stopPropagation(); handleInkPadClick(); }}
            onPointerOver={() => document.body.style.cursor = 'pointer'}
            onPointerOut={() => document.body.style.cursor = 'auto'}
          >
            <Cylinder 
              args={[0.25, 0.25, 1.2, 32]} 
              rotation={[0, 0, Math.PI / 2]}
            >
              <meshStandardMaterial color={rollerColor} roughness={0.5} />
            </Cylinder>
            {/* Handle */}
            <Box args={[0.1, 0.8, 0.1]} position={[0, 0.5, 0]} castShadow>
              <meshStandardMaterial color="#8d6e63" />
            </Box>
            <Box args={[1.3, 0.1, 0.1]} position={[0, 0.1, 0]} castShadow>
              <meshStandardMaterial color="#8d6e63" />
            </Box>
            <Box args={[0.1, 0.3, 0.1]} position={[-0.6, 0, 0]} castShadow>
              <meshStandardMaterial color="#8d6e63" />
            </Box>
            <Box args={[0.1, 0.3, 0.1]} position={[0.6, 0, 0]} castShadow>
              <meshStandardMaterial color="#8d6e63" />
            </Box>
          </group>
        )}
      </group>

      {/* Tray (字盘) - Bottom position */}
      <group position={[0, 0, 2]}>
        <Label position={[0, 1.2, 0]} fontSize={0.35} color="#4E342E" text="字盘 (来回拖拽刷墨)" />
        
        {/* Invisible plane to catch pointer events for dragging */}
        <Plane 
          args={layoutMode === 'vertical' ? [2.5, 6.5] : [6.5, 2.5]} 
          position={[0, 1.0, 0]} 
          rotation={[-Math.PI / 2, 0, 0]}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerMove={handlePointerMove}
          onPointerOut={handlePointerUp}
        >
          <meshBasicMaterial visible={false} />
        </Plane>

        <Tray layoutMode={layoutMode} inkLevel={inkLevel}>
          {/* Grid Lines on Tray */}
          <Plane 
            args={layoutMode === 'vertical' ? [1.0, 4.7] : [4.7, 1.0]} 
            position={[0, 0.11, 0]} 
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <meshStandardMaterial 
              map={trayGridTexture} 
              transparent 
              opacity={0.6} 
            />
          </Plane>
          
          {tray.map((char, i) => char ? (
            <TrayChar key={i} char={char} index={i} inkLevel={charInkLevels[i]} layoutMode={layoutMode} />
          ) : null)}
        </Tray>
      </group>

      {/* Roller Tool following cursor */}
      {rollerInked && inkingProgress >= 1 && (
        <RollerTool 
          position={pointerPos} 
          active={isPointerDown} 
          layoutMode={layoutMode} 
          inkingProgress={inkingProgress} 
        />
      )}
    </group>
  );
}

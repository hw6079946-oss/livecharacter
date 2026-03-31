import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Box, Plane, Cone } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import Label from '../Label';
import Tray from '../Tray';
import { useGameStore } from '../../store';
import { createYangkeTextures, createGridTexture } from '../../utils/texture';
import * as THREE from 'three';

const INVENTORY = ['春', '眠', '不', '觉', '晓'];

function BouncingArrow({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 5) * 0.2;
    }
  });
  return (
    <group ref={ref} position={position}>
      <Cone args={[0.2, 0.5, 32]} rotation={[Math.PI, 0, 0]} position={[0, 0.25, 0]}>
        <meshStandardMaterial color="red" />
      </Cone>
    </group>
  );
}

function InventoryChar({ char, index, selectedChar, onClick }: { char: string, index: number, selectedChar: string | null, onClick: () => void }) {
  const { map, bumpMap } = useMemo(() => createYangkeTextures(char, true, '#5d4037', '#8d6e63'), [char]);
  const isSelected = selectedChar === char;
  
  return (
    <group position={[index * 1.1 - 2.2, 0.4, 0]}>
      {/* Slot background */}
      <Box args={[0.9, 0.1, 0.9]} position={[0, -0.3, 0]}>
        <meshStandardMaterial color="#2d1a12" />
      </Box>
      
      <Box 
        args={[0.8, 0.8, 0.8, 32, 32, 32]} 
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'auto'}
        scale={isSelected ? 1.1 : 1}
      >
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <meshStandardMaterial 
            key={i}
            attach={`material-${i}`}
            color={isSelected ? "#FFB61E" : "#a1887f"} 
            map={i === 2 ? map : undefined} 
            bumpMap={i === 2 ? bumpMap : undefined}
            bumpScale={0.4}
            displacementMap={i === 2 ? bumpMap : undefined}
            displacementScale={0.05}
          />
        ))}
      </Box>
    </group>
  );
}

function TrayChar({ char, index, layoutMode, isHighlighted, onClick }: { char: string, index: number, layoutMode: 'vertical' | 'horizontal', isHighlighted: boolean, onClick: () => void }) {
  const { map, bumpMap } = useMemo(() => char ? createYangkeTextures(char, true, '#5d4037', '#8d6e63') : { map: null, bumpMap: null }, [char]);
  const pos = layoutMode === 'vertical' 
    ? [0, 0.55, index * 0.92 - 1.84] 
    : [index * 0.92 - 1.84, 0.55, 0];
  
  const meshRef = useRef<THREE.Mesh>(null);
  const prevChar = useRef(char);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!prevChar.current && char) {
      if (meshRef.current) {
        meshRef.current.rotation.x = Math.PI;
      }
      setIsAnimating(true);
    }
    prevChar.current = char;
  }, [char]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      if (isAnimating) {
        meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0, 6 * delta);
        
        const progress = 1 - (meshRef.current.rotation.x / Math.PI);
        const jumpHeight = 1.0;
        const newY = 0.55 + 4 * progress * (1 - progress) * jumpHeight;
        meshRef.current.position.set(pos[0], newY, pos[2]);

        if (Math.abs(meshRef.current.rotation.x) < 0.01) {
          meshRef.current.rotation.x = 0;
          meshRef.current.position.set(pos[0], 0.55, pos[2]);
          setIsAnimating(false);
        }
      } else {
        meshRef.current.rotation.x = 0;
        meshRef.current.position.set(pos[0], 0.55, pos[2]);
      }

      if (isHighlighted && !char) {
        const t = state.clock.getElapsedTime();
        const scale = 1 + Math.sin(t * 6) * 0.05;
        meshRef.current.scale.set(scale, scale, scale);
      } else {
        meshRef.current.scale.set(1, 1, 1);
      }
    }
  });

  return (
    <Box 
      ref={meshRef}
      args={[0.9, 0.9, 0.9, 32, 32, 32]} 
      position={pos as any}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'auto'}
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <meshStandardMaterial 
          key={`${i}-${char ? 'filled' : 'empty'}`}
          attach={`material-${i}`}
          color={char ? "#a1887f" : (isHighlighted ? "#FFB61E" : "#8d6e63")} 
          transparent={!char} 
          opacity={char ? 1 : (isHighlighted ? 0.8 : 0.5)}
          map={i === 2 && char ? map : undefined} 
          bumpMap={i === 2 && char ? bumpMap : undefined}
          bumpScale={0.4}
          displacementMap={i === 2 && char ? bumpMap : undefined}
          displacementScale={0.05}
        />
      ))}
    </Box>
  );
}

export default function Stage2() {
  const { targetText, tray, addToTray, removeFromTray, wedgesPlaced, setWedgesPlaced, setHint, setStage, layoutMode, setLayoutMode, setControlsEnabled } = useGameStore();
  const [selectedChar, setSelectedChar] = useState<string | null>(null);
  const { camera } = useThree();

  // Set initial camera for Stage 2
  useEffect(() => {
    // Smoothly transition camera to a top-down perspective
    const isMobile = window.innerWidth < window.innerHeight;
    const targetPos = isMobile ? new THREE.Vector3(0, 11, 9) : new THREE.Vector3(0, 9, 7);
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
    setHint('欢迎来到字盘排版。请从上方的字柜中选择字模，并点击下方的字盘空位进行摆放。');
    
    return () => cancelAnimationFrame(frameId);
  }, [camera, setControlsEnabled, setHint]);

  const trayGridTexture = useMemo(() => createGridTexture(1.0, 4.7, layoutMode === 'vertical' ? 1 : 5, layoutMode === 'vertical' ? 5 : 1, '#3e2723', false), [layoutMode]);

  const nextExpectedIndex = useMemo(() => {
    for (let i = 0; i < targetText.length; i++) {
      if (tray[i] !== targetText[i]) {
        return i;
      }
    }
    return -1;
  }, [tray, targetText]);

  const toggleLayout = () => {
    if (wedgesPlaced) {
      setHint('木楔已固定，无法更改排版方式！');
      return;
    }
    const newMode = layoutMode === 'vertical' ? 'horizontal' : 'vertical';
    setLayoutMode(newMode);
    setHint(`已切换为${newMode === 'vertical' ? '竖向' : '横向'}排版。`);
  };

  const handleInventoryClick = (char: string) => {
    if (wedgesPlaced) return;
    setSelectedChar(char);
    setHint(`已选择「${char}」，请点击字盘空位放置。`);
  };

  const handleTrayClick = (index: number) => {
    if (wedgesPlaced) return;
    if (selectedChar) {
      addToTray(selectedChar, index);
      setSelectedChar(null);
      setHint('活字已放置。');
    } else if (tray[index]) {
      removeFromTray(index);
      setHint('活字已移除。');
    }
  };

  const isTrayFull = tray.every(c => c !== '');

  const handleWedgeClick = () => {
    if (!isTrayFull) {
      setHint('请先摆放完所有活字！');
      return;
    }
    setWedgesPlaced(true);
    setHint('木楔已固定！进入刷墨环节。');
    setTimeout(() => {
      setStage(3);
      setHint('请用墨辊蘸墨，并在活字表面均匀涂抹。');
    }, 2000);
  };

  return (
    <group position={[0, 0, 0]}>
      {/* Inventory (字柜) - Positioned at the "top" of the screen */}
      <group position={[0, 0, -2.5]}>
        {/* Cabinet Frame - More detailed */}
        <Box args={[7.2, 0.6, 1.6]} position={[0, 0.1, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#3e2723" />
        </Box>
        <Box args={[7, 0.4, 1.4]} position={[0, 0.2, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#4e342e" />
        </Box>
        
        {/* Decorative top part */}
        <Box args={[7.4, 0.1, 1.8]} position={[0, 0.45, 0]}>
          <meshStandardMaterial color="#2d1a12" />
        </Box>

        <Label position={[0, 1.0, 0]} fontSize={0.35} color="#4E342E" text="字柜 (点击选择字模)" />
        
        {INVENTORY.map((char, i) => (
          <InventoryChar key={i} char={char} index={i} selectedChar={selectedChar} onClick={() => handleInventoryClick(char)} />
        ))}
        {selectedChar === null && nextExpectedIndex !== -1 && INVENTORY.indexOf(targetText[nextExpectedIndex]) !== -1 && (
          <BouncingArrow position={[INVENTORY.indexOf(targetText[nextExpectedIndex]) * 1.1 - 2.2, 1.5, 0]} />
        )}
      </group>

      {/* Tray (字盘) - Positioned at the "bottom" of the screen */}
      <group position={[0, 0, 2]}>
        <Label position={[0, 1.2, 0]} fontSize={0.35} color="#4E342E" text="字盘 (点击放置)" />
        <Tray layoutMode={layoutMode}>
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
          
          {tray.map((char, i) => (
            <TrayChar key={i} char={char} index={i} layoutMode={layoutMode} isHighlighted={i === nextExpectedIndex} onClick={() => handleTrayClick(i)} />
          ))}
          {selectedChar !== null && nextExpectedIndex !== -1 && (
            <BouncingArrow position={layoutMode === 'vertical' ? [0, 1.55, nextExpectedIndex * 0.92 - 1.84] : [nextExpectedIndex * 0.92 - 1.84, 1.55, 0]} />
          )}

          {/* Wedges (木楔) - Acts as "Confirm" */}
          <Box 
            args={layoutMode === 'vertical' ? [1.0, 0.8, 0.2] : [0.2, 0.8, 1.0]} 
            position={layoutMode === 'vertical' ? [0, 0.5, -2.3] : [-2.3, 0.5, 0]} 
            onClick={(e) => { e.stopPropagation(); handleWedgeClick(); }}
            onPointerOver={() => document.body.style.cursor = 'pointer'}
            onPointerOut={() => document.body.style.cursor = 'auto'}
          >
            <meshStandardMaterial 
              color={wedgesPlaced ? "#8d6e63" : (isTrayFull ? "#789262" : "#FFB61E")} 
              emissive={isTrayFull && !wedgesPlaced ? "#789262" : "#000000"}
              emissiveIntensity={isTrayFull && !wedgesPlaced ? 0.5 : 0}
            />
          </Box>
          <Box 
            args={layoutMode === 'vertical' ? [1.0, 0.8, 0.2] : [0.2, 0.8, 1.0]} 
            position={layoutMode === 'vertical' ? [0, 0.5, 2.3] : [2.3, 0.5, 0]} 
            onClick={(e) => { e.stopPropagation(); handleWedgeClick(); }}
            onPointerOver={() => document.body.style.cursor = 'pointer'}
            onPointerOut={() => document.body.style.cursor = 'auto'}
          >
            <meshStandardMaterial 
              color={wedgesPlaced ? "#8d6e63" : (isTrayFull ? "#789262" : "#FFB61E")} 
              emissive={isTrayFull && !wedgesPlaced ? "#789262" : "#000000"}
              emissiveIntensity={isTrayFull && !wedgesPlaced ? 0.5 : 0}
            />
          </Box>
          
          {isTrayFull && !wedgesPlaced && (
            <Label position={[0, 1.5, 0]} fontSize={0.25} color="#789262" text="点击木楔固定活字" />
          )}
        </Tray>
      </group>

      {/* Layout Toggle Button - Positioned to the right */}
      <group position={[4.5, 0, 0]}>
        <Box 
          args={[1.8, 0.5, 1.2]} 
          position={[0, 0.1, 0]}
          castShadow
        >
          <meshStandardMaterial color="#3e2723" />
        </Box>
        <Box 
          args={[1.5, 0.4, 1]} 
          position={[0, 0.2, 0]}
          onClick={(e) => { e.stopPropagation(); toggleLayout(); }}
          onPointerOver={() => document.body.style.cursor = 'pointer'}
          onPointerOut={() => document.body.style.cursor = 'auto'}
        >
          <meshStandardMaterial color={wedgesPlaced ? "#757575" : "#789262"} />
        </Box>
        <Label position={[0, 0.8, 0]} fontSize={0.22} color="#4E342E" text="排版方向" />
        <Label position={[0, 0.2, 0.51]} fontSize={0.18} color="#ffffff" text={layoutMode === 'vertical' ? '竖向' : '横向'} />
      </group>
    </group>
  );
}

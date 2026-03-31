import React, { useState, useMemo, useEffect } from 'react';
import { Box, Plane } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import Label from '../Label';
import Tray from '../Tray';
import { useGameStore } from '../../store';
import { createYangkeTextures, createGridTexture } from '../../utils/texture';
import * as THREE from 'three';

const INVENTORY = ['春', '眠', '不', '觉', '晓'];

function InventoryChar({ char, index, isStored, onClick }: { char: string, index: number, isStored: boolean, onClick: () => void }) {
  const { map, bumpMap } = useMemo(() => createYangkeTextures(char, true, '#5d4037', '#8d6e63'), [char]);
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
      >
        {isStored ? (
          [0, 1, 2, 3, 4, 5].map((i) => (
            <meshStandardMaterial 
              key={i}
              attach={`material-${i}`}
              color="#a1887f" 
              map={i === 2 ? map : undefined} 
              bumpMap={i === 2 ? bumpMap : undefined}
              bumpScale={0.4}
              displacementMap={i === 2 ? bumpMap : undefined}
              displacementScale={0.05}
            />
          ))
        ) : (
          <meshStandardMaterial color="#8d6e63" transparent opacity={0.5} />
        )}
      </Box>
    </group>
  );
}

function TrayChar({ char, index, typesCleaned, isSelected, layoutMode, onClick }: { char: string, index: number, typesCleaned: boolean, isSelected: boolean, layoutMode: 'vertical' | 'horizontal', onClick: () => void }) {
  const inkColor = typesCleaned ? '#5d4037' : '#0a0a0a';
  const inkBgColor = typesCleaned ? '#8d6e63' : '#4e342e';
  const textRoughnessColor = typesCleaned ? '#dddddd' : '#111111';
  const { map, bumpMap, roughnessMap } = useMemo(() => createYangkeTextures(char, true, inkColor, inkBgColor, textRoughnessColor), [char, typesCleaned, inkColor, inkBgColor, textRoughnessColor]);
  
  const pos = layoutMode === 'vertical' 
    ? [0, 0.55, index * 0.92 - 1.84] 
    : [index * 0.92 - 1.84, 0.55, 0];
  return (
    <Box 
      args={[0.9, 0.9, 0.9, 32, 32, 32]} 
      position={pos as any}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'auto'}
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
          roughnessMap={i === 2 && !typesCleaned ? roughnessMap : undefined}
          roughness={i === 2 && !typesCleaned ? 1.0 : 0.9}
          metalness={i === 2 && !typesCleaned ? 0.6 : 0.1}
        />
      ))}
    </Box>
  );
}

export default function Stage5() {
  const { tray, removeFromTray, wedgesRemoved, setWedgesRemoved, typesCleaned, setTypesCleaned, setTypesStored, setHint, setStage, layoutMode, setControlsEnabled } = useGameStore();
  const [selectedCharIndex, setSelectedCharIndex] = useState<number | null>(null);
  const { camera } = useThree();

  // Set initial camera for Stage 5
  useEffect(() => {
    const isMobile = window.innerWidth < window.innerHeight;
    const targetPos = isMobile ? new THREE.Vector3(0, 10, 8) : new THREE.Vector3(0, 8, 6);
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

  const handleWedgeClick = () => {
    setWedgesRemoved(true);
    setHint('木楔已拔出！请用抹布清理活字表面的墨迹。');
  };

  const handleClothClick = () => {
    if (!wedgesRemoved) {
      setHint('请先拔出木楔！');
      return;
    }
    setTypesCleaned(true);
    setHint('活字已清理干净！请将活字放回字柜。');
  };

  const handleTrayClick = (index: number) => {
    if (!typesCleaned) {
      setHint('请先清理活字！');
      return;
    }
    if (tray[index]) {
      setSelectedCharIndex(index);
      setHint(`已拾取「${tray[index]}」，请点击字柜对应位置放回。`);
    }
  };

  const handleInventoryClick = (char: string) => {
    if (selectedCharIndex !== null) {
      if (tray[selectedCharIndex] === char) {
        removeFromTray(selectedCharIndex);
        setSelectedCharIndex(null);
        setHint(`「${char}」已归位。`);
        checkCompletion();
      } else {
        setHint('放错位置了！请放回对应的格子。');
      }
    }
  };

  const checkCompletion = () => {
    // We need to check the state AFTER the update, but since state updates are async in React,
    // we use the store's current state directly.
    const currentTray = useGameStore.getState().tray;
    const remaining = currentTray.filter(c => c !== '');
    if (remaining.length === 0) {
      setTypesStored(true);
      setHint('全部归位完成！进入保存成品环节。');
      setTimeout(() => {
        setStage(6);
        setHint('请查看您的印刷作品并保存。');
      }, 2000);
    }
  };

  return (
    <group position={[0, 0, 0]}>
      {/* Inventory (字柜) - Top position */}
      <group position={[0, 0, -2.5]}>
        {/* Cabinet Frame */}
        <Box args={[7.2, 0.6, 1.6]} position={[0, 0.1, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#8d6e63" />
        </Box>
        <Box args={[7, 0.4, 1.4]} position={[0, 0.2, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#a1887f" />
        </Box>
        
        {/* Decorative top part to prevent z-fighting */}
        <Box args={[7.4, 0.1, 1.8]} position={[0, 0.45, 0]}>
          <meshStandardMaterial color="#5d4037" />
        </Box>

        <Label position={[0, 1.0, 0]} fontSize={0.35} color="#4E342E" text="字柜 (归位区)" />
        {INVENTORY.map((char, i) => {
          const isStored = !tray.includes(char);
          return (
            <InventoryChar key={i} char={char} index={i} isStored={isStored} onClick={() => handleInventoryClick(char)} />
          );
        })}
      </group>

      {/* Cloth (抹布) - Right position */}
      <group position={[4.5, 0, 0]}>
        <Label position={[0, 1.0, 0]} fontSize={0.3} color="#4E342E" text="抹布" />
        <Box 
          args={[1, 0.1, 1]} 
          position={[0, 0.05, 0]} 
          onClick={(e) => { e.stopPropagation(); handleClothClick(); }}
          onPointerOver={() => document.body.style.cursor = 'pointer'}
          onPointerOut={() => document.body.style.cursor = 'auto'}
        >
          <meshStandardMaterial color="#e0e0e0" />
        </Box>
      </group>

      {/* Tray (字盘) - Bottom position */}
      <group position={[0, 0, 2]}>
        <Label position={[0, 1.2, 0]} fontSize={0.35} color="#4E342E" text="字盘 (拆解区)" />
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
          
          {tray.map((char, i) => {
            if (!char) return null;
            return (
              <TrayChar key={i} char={char} index={i} typesCleaned={typesCleaned} isSelected={selectedCharIndex === i} layoutMode={layoutMode} onClick={() => handleTrayClick(i)} />
            );
          })}

          {/* Wedges (木楔) */}
          {!wedgesRemoved && (
            <>
              <Box 
                args={layoutMode === 'vertical' ? [1.0, 0.8, 0.2] : [0.2, 0.8, 1.0]} 
                position={layoutMode === 'vertical' ? [0, 0.5, -2.3] : [-2.3, 0.5, 0]} 
                onClick={(e) => { e.stopPropagation(); handleWedgeClick(); }}
                onPointerOver={() => document.body.style.cursor = 'pointer'}
                onPointerOut={() => document.body.style.cursor = 'auto'}
              >
                <meshStandardMaterial color="#FFB61E" emissive="#FFB61E" emissiveIntensity={0.3} />
              </Box>
              <Box 
                args={layoutMode === 'vertical' ? [1.0, 0.8, 0.2] : [0.2, 0.8, 1.0]} 
                position={layoutMode === 'vertical' ? [0, 0.5, 2.3] : [2.3, 0.5, 0]} 
                onClick={(e) => { e.stopPropagation(); handleWedgeClick(); }}
                onPointerOver={() => document.body.style.cursor = 'pointer'}
                onPointerOut={() => document.body.style.cursor = 'auto'}
              >
                <meshStandardMaterial color="#FFB61E" emissive="#FFB61E" emissiveIntensity={0.3} />
              </Box>
              <Label position={[0, 1.5, 0]} fontSize={0.25} color="#FFB61E" text="点击木楔拔出" />
            </>
          )}
        </Tray>
      </group>
    </group>
  );
}

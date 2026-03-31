import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Box, Edges, Float, Text, Sparkles, Plane, RoundedBox } from '@react-three/drei';
import Label from '../Label';
import * as THREE from 'three';
import { useGameStore } from '../../store';

// Simple Tool component that follows the cursor
function Tool({ type, position, active }: { type: 'brush' | 'chisel' | 'sandpaper', position: THREE.Vector3, active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      const targetPos = position.clone();
      // Prevent penetrating the block (front face is at z=4.9)
      if (targetPos.z < 4.9) targetPos.z = 4.9;
      targetPos.z += 0.01; // Small offset to keep tip exactly on/above surface
      
      // Smoothly follow the target position
      groupRef.current.position.lerp(targetPos, 0.2);
      
      // Add a little tilt when active
      const baseTiltX = Math.PI / 5; // Tilt towards camera so the tool body stays out of the block
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, active ? -0.2 : 0, 0.1);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, active ? baseTiltX + 0.1 : baseTiltX, 0.1);
    }
  });

  return (
    <group ref={groupRef}>
      {type === 'brush' && (
        <group rotation={[0, 0, 0]}>
          <group position={[0, 0.55, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.05, 0.05, 0.8, 8]} />
              <meshStandardMaterial color="#5d4037" />
            </mesh>
            <mesh position={[0, -0.45, 0]} castShadow>
              <cylinderGeometry args={[0.06, 0.02, 0.2, 8]} />
              <meshStandardMaterial color="#d7ccc8" />
            </mesh>
          </group>
        </group>
      )}
      {type === 'chisel' && (
        <group rotation={[0, 0, Math.PI / 6]}>
          <group position={[0, 0.5, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.1, 0.8, 0.05]} />
              <meshStandardMaterial color="#4e342e" />
            </mesh>
            <mesh position={[0, -0.45, 0]} castShadow>
              <boxGeometry args={[0.12, 0.1, 0.02]} />
              <meshStandardMaterial color="#90a4ae" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        </group>
      )}
      {type === 'sandpaper' && (
        <group rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow position={[0, -0.01, 0]}>
            <boxGeometry args={[0.3, 0.02, 0.4]} />
            <meshStandardMaterial color="#a1887f" roughness={1} />
          </mesh>
        </group>
      )}
    </group>
  );
}

export default function Stage1() {
  const { 
    setHint, setStage, 
    blockSelected, setBlockSelected,
    outlineProgress, setOutlineProgress,
    carveProgress, setCarveProgress,
    polishProgress, setPolishProgress,
    setControlsEnabled,
    viewLocked
  } = useGameStore();
  
  const { camera } = useThree();
  const blockRef = useRef<THREE.Mesh>(null);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [pointerPos, setPointerPos] = useState(new THREE.Vector3(0, 0, 0));
  const [showParticles, setShowParticles] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<'normal' | 'mirrored' | null>(null);
  const [hoveredStyle, setHoveredStyle] = useState<'normal' | 'mirrored' | null>(null);
  const [carvedCells, setCarvedCells] = useState<boolean[]>(Array(9).fill(false));

  const targetChar = '春';

  const [isTransitioning, setIsTransitioning] = useState(false);

  // Sync controls enabled state with block selection
  useEffect(() => {
    if (blockSelected) {
      setControlsEnabled(false);
    } else {
      setControlsEnabled(true);
    }
    
    // Cleanup: ensure controls are re-enabled if we leave the stage
    return () => setControlsEnabled(true);
  }, [blockSelected, setControlsEnabled]);

  // Initial setup
  useEffect(() => {
    setHint('欢迎！请点击桌上的木块，开始制作你的第一个活字。');
  }, [setHint]);

  // Generate textures based on progress
  const { canvas, ctx, bCanvas, bCtx, texture, bumpMap } = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256; // Reduced from 512 for mobile performance
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    const bCanvas = document.createElement('canvas');
    bCanvas.width = 256;
    bCanvas.height = 256;
    const bCtx = bCanvas.getContext('2d');
    
    const texture = new THREE.CanvasTexture(canvas);
    const bumpMap = new THREE.CanvasTexture(bCanvas);
    
    return { canvas, ctx, bCanvas, bCtx, texture, bumpMap };
  }, []);

  useEffect(() => {
    if (ctx && bCtx) {
      ctx.save();
      bCtx.save();
      
      // Base wood texture
      ctx.fillStyle = '#8d6e63';
      ctx.fillRect(0, 0, 256, 256);
      
      // Add wood grain (simplified for performance)
      ctx.strokeStyle = '#795548';
      ctx.lineWidth = 1;
      for(let i=0; i<256; i+=15) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.bezierCurveTo(85, i + Math.random()*10, 170, i - Math.random()*10, 256, i);
        ctx.stroke();
      }

      bCtx.fillStyle = '#000000';
      bCtx.fillRect(0, 0, 256, 256);
      
      const font = 'bold 160px "Noto Serif SC", "KaiTi", "STKaiti", serif'; // Scaled down font size
      ctx.font = font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      bCtx.font = font;
      bCtx.textAlign = 'center';
      bCtx.textBaseline = 'middle';
      
      // Flip for reverse printing if mirrored is selected
      if (selectedStyle === 'mirrored') {
        ctx.translate(256, 0);
        ctx.scale(-1, 1);
        bCtx.translate(256, 0);
        bCtx.scale(-1, 1);
      }
      
      if (outlineProgress === 100) {
        ctx.strokeStyle = `rgba(62, 39, 35, 1)`;
        ctx.lineWidth = 4;
        ctx.strokeText(targetChar, 128, 128);

        bCtx.strokeStyle = `rgba(100, 100, 100, 1)`;
        bCtx.lineWidth = 2;
        bCtx.strokeText(targetChar, 128, 128);
      }

      if (outlineProgress === 100 && carveProgress < 100) {
        // Highlight the area to be carved (the background)
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = 'rgba(255, 100, 0, 0.7)'; // More intense orange
        ctx.fillRect(0, 0, 256, 256);
        
        // Cut out the character from the highlight
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillText(targetChar, 128, 128);
        ctx.restore();

        // Add a thicker, more visible border around the character to further guide
        ctx.strokeStyle = '#FF4500'; // Brighter orange-red
        ctx.setLineDash([10, 5]); // More distinct dash pattern
        ctx.lineWidth = 6; // Thicker border
        ctx.strokeText(targetChar, 128, 128);
        ctx.setLineDash([]);
      }
      
      if (carveProgress > 0) {
        ctx.fillStyle = `rgba(78, 52, 46, ${carveProgress / 100})`;
        ctx.fillText(targetChar, 128, 128);

        bCtx.fillStyle = `rgba(255, 255, 255, ${carveProgress / 100})`;
        bCtx.fillText(targetChar, 128, 128);
      }
      
      ctx.restore();
      bCtx.restore();
    }
    
    texture.needsUpdate = true;
    bumpMap.needsUpdate = true;
  }, [targetChar, outlineProgress, carveProgress, selectedStyle, ctx, bCtx, texture, bumpMap]);

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    setIsPointerDown(true);
    setPointerPos(e.point);
    
    if (!blockSelected) {
      setBlockSelected(true);
      setHint('请用毛笔选择你要雕刻的字模样式（正常或镜像）。');
    }
  };

  const handlePointerUp = () => {
    setIsPointerDown(false);
    setShowParticles(false);
  };

  const handlePointerMove = (e: any) => {
    setPointerPos(e.point);
    if (!isPointerDown || !blockSelected) return;
    
    if (outlineProgress < 100) return; // Do nothing on the block if style not selected
    
    setShowParticles(true);
    
    // Trigger haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    
    // Grid-based carving logic
    if (carveProgress < 100) {
      // Map 3D point to grid (3x3)
      // Block is 1.8x1.8, centered at 0,0
      const gridX = Math.floor((e.point.x + 0.9) / 0.6);
      const gridY = Math.floor((e.point.y - 0.3) / 0.6); // Based on block position
      const cellIndex = gridX + gridY * 3;
      
      if (cellIndex >= 0 && cellIndex < 9 && !carvedCells[cellIndex]) {
        const newCarvedCells = [...carvedCells];
        newCarvedCells[cellIndex] = true;
        setCarvedCells(newCarvedCells);
        
        const newProg = Math.min(100, carveProgress + 100 / 9);
        setCarveProgress(newProg);
        if (newProg >= 100) setHint('雕刻大功告成！最后用砂纸打磨，让字迹圆润。');
      }
    } else if (polishProgress < 100) {
      const newProg = Math.min(100, polishProgress + 0.5); // Much slower
      setPolishProgress(newProg);
      if (newProg === 100) {
        setHint('太棒了！这枚活字温润如玉，正在为您准备字盘...');
      }
    }
  };

  const handleSelectStyle = (e: any, style: 'normal' | 'mirrored') => {
    e.stopPropagation();
    setSelectedStyle(style);
    setOutlineProgress(100);
    setHint('选择完成！现在换用刻刀，剔除橙色高亮区域（字迹外的木料）。');
  };

  const currentTool = outlineProgress < 100 ? 'brush' : carveProgress < 100 ? 'chisel' : 'sandpaper';

  useFrame((state) => {
    if (blockRef.current) {
      if (!blockSelected) {
        blockRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1 + 1;
      } else if (polishProgress < 100) {
        // Smoothly move block to workspace position
        blockRef.current.position.lerp(new THREE.Vector3(0, 1.2, 4), 0.1);
        blockRef.current.rotation.set(0, 0, 0);
        
        // Move camera to a better angle (zoomed out slightly, more on mobile)
        const isMobile = window.innerWidth < window.innerHeight;
        const targetCamPos = isMobile ? new THREE.Vector3(0, 5, 16) : new THREE.Vector3(0, 3.5, 12);
        
        if (!viewLocked && currentTool !== 'chisel') {
          camera.position.lerp(targetCamPos, 0.05);
          camera.lookAt(0, 1.2, 4);
        }
      } else {
        // Transition to Stage 2: Stay still and switch stage
        if (!isTransitioning) {
          setIsTransitioning(true);
          // Give the player 3 full seconds to appreciate the finished block
          setTimeout(() => setStage(2), 3000); 
        }
      }
    }
  });

  const currentRoughness = 0.8 - (polishProgress / 100) * 0.6;
  const baseColor = new THREE.Color('#8d6e63').lerp(new THREE.Color('#bcaaa4'), polishProgress / 100);

  return (
    <group>
      {/* Label */}
      <Label position={[0, 3, 0]} fontSize={0.4} color="#4E342E" text="第一步：制字成型" />

      {blockSelected && (
        <Tool type={currentTool} position={pointerPos} active={isPointerDown} />
      )}

      {showParticles && (
        <Sparkles 
          position={pointerPos} 
          count={currentTool === 'chisel' ? 15 : 8} // Reduced particle count for performance
          scale={currentTool === 'chisel' ? 0.8 : 0.5} 
          size={currentTool === 'chisel' ? 3 : 2} 
          speed={0.8} 
          color={currentTool === 'brush' ? '#3e2723' : currentTool === 'chisel' ? '#bcaaa4' : '#d7ccc8'} 
        />
      )}
      
      {/* Celebratory sparkles when done */}
      {polishProgress === 100 && (
        <Sparkles
          position={[0, 1, 0]}
          count={100}
          scale={3}
          size={4}
          speed={0.5}
          color="#fff9c4"
        />
      )}

      {blockSelected && outlineProgress === 0 && (
        <group>
          {/* Left Option: Normal */}
          <group 
            position={[-1.4, 1.2, 4.9]} 
            scale={hoveredStyle === 'normal' ? 1.15 : 1}
            onClick={(e) => handleSelectStyle(e, 'normal')}
            onPointerMove={(e) => { e.stopPropagation(); setPointerPos(e.point); }}
            onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; setHoveredStyle('normal'); }}
            onPointerOut={(e) => { e.stopPropagation(); document.body.style.cursor = 'auto'; setHoveredStyle(null); }}
          >
            {/* Thick glowing border */}
            {hoveredStyle === 'normal' && (
              <RoundedBox args={[1.35, 1.35, 0.05]} radius={0.1} position={[0, 0, -0.05]}>
                <meshBasicMaterial color="#FFB61E" />
              </RoundedBox>
            )}
            {/* Main Card */}
            <RoundedBox args={[1.2, 1.2, 0.1]} radius={0.1}>
              <meshStandardMaterial color={hoveredStyle === 'normal' ? "#FFF8E1" : "#f5f5f5"} />
            </RoundedBox>
            <Text position={[0, 0, 0.06]} fontSize={0.8} color={hoveredStyle === 'normal' ? "#E54D42" : "#4E342E"}>春</Text>
            <Text position={[0, -0.85, 0]} fontSize={0.25} color={hoveredStyle === 'normal' ? "#FFB61E" : "#D4A574"} outlineWidth={hoveredStyle === 'normal' ? 0.01 : 0} outlineColor="#FFB61E">正常样式</Text>
          </group>
          
          {/* Right Option: Mirrored */}
          <group 
            position={[1.4, 1.2, 4.9]} 
            scale={hoveredStyle === 'mirrored' ? 1.15 : 1}
            onClick={(e) => handleSelectStyle(e, 'mirrored')}
            onPointerMove={(e) => { e.stopPropagation(); setPointerPos(e.point); }}
            onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; setHoveredStyle('mirrored'); }}
            onPointerOut={(e) => { e.stopPropagation(); document.body.style.cursor = 'auto'; setHoveredStyle(null); }}
          >
            {/* Thick glowing border */}
            {hoveredStyle === 'mirrored' && (
              <RoundedBox args={[1.35, 1.35, 0.05]} radius={0.1} position={[0, 0, -0.05]}>
                <meshBasicMaterial color="#FFB61E" />
              </RoundedBox>
            )}
            {/* Main Card */}
            <RoundedBox args={[1.2, 1.2, 0.1]} radius={0.1}>
              <meshStandardMaterial color={hoveredStyle === 'mirrored' ? "#FFF8E1" : "#f5f5f5"} />
            </RoundedBox>
            <Text position={[0, 0, 0.06]} fontSize={0.8} color={hoveredStyle === 'mirrored' ? "#E54D42" : "#4E342E"} scale={[-1, 1, 1]}>春</Text>
            <Text position={[0, -0.85, 0]} fontSize={0.25} color={hoveredStyle === 'mirrored' ? "#FFB61E" : "#D4A574"} outlineWidth={hoveredStyle === 'mirrored' ? 0.01 : 0} outlineColor="#FFB61E">镜像样式</Text>
          </group>
        </group>
      )}

      <Box 
        ref={blockRef}
        args={[1.8, 1.8, 1.8, 64, 64, 64]} 
        castShadow 
        receiveShadow
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerOut={(e) => {
          handlePointerUp();
          document.body.style.cursor = 'auto';
        }}
        onPointerMove={handlePointerMove}
        onPointerOver={() => document.body.style.cursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' style='font-size:32px'%3E%3Ctext y='32'%3E👆%3C/text%3E%3C/svg%3E") 16 0, auto`}
      >
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <meshStandardMaterial 
            key={i}
            attach={`material-${i}`}
            color={baseColor} 
            roughness={currentRoughness} 
            map={i === 4 ? texture : undefined}
            bumpMap={i === 4 ? bumpMap : undefined}
            bumpScale={0.5}
            displacementMap={i === 4 ? bumpMap : undefined}
            displacementScale={0.12}
          />
        ))}
        
        {/* Ghost guide character */}
        {blockSelected && outlineProgress === 100 && polishProgress < 100 && (
          <group>
            <Text
              position={[0, 0, 0.91]}
              rotation={[0, 0, 0]}
              fontSize={1.1}
              color="#FFB61E"
              fillOpacity={0.5} // Increased visibility
              strokeWidth={0.01}
              strokeColor="#FFB61E"
              strokeOpacity={0.8} // Increased visibility
              scale={selectedStyle === 'mirrored' ? [-1, 1, 1] : [1, 1, 1]}
            >
              {targetChar}
            </Text>
            {currentTool === 'chisel' && (
              <Text
                position={[0, 0.7, 0.92]} // Moved up slightly
                fontSize={0.25} // Bigger
                color="#FF4500" // Brighter
                fillOpacity={1}
              >
                请剔除橙色部分
              </Text>
            )}
          </group>
        )}

        {/* Success message when done */}
        {polishProgress === 100 && (
          <Text
            position={[0, 1.5, 0]}
            fontSize={0.3}
            color="#789262"
            fillOpacity={1}
          >
            制作完成
          </Text>
        )}

        {blockSelected && (
          <Edges scale={1.01} threshold={15} color={isPointerDown ? "#FFB61E" : "#D4A574"} />
        )}
        
        {!blockSelected && (
          <Edges scale={1.05} threshold={15} color="#FFB61E" />
        )}
      </Box>

      {/* Workspace floor indicator */}
      {blockSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 4]} receiveShadow>
          <circleGeometry args={[2, 32]} />
          <meshStandardMaterial color="#2d1a12" transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

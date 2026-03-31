import React, { useMemo, useEffect } from 'react';
import { Plane, Box } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import Label from '../Label';
import { useGameStore } from '../../store';
import { createGridTexture, createInkedFrameTexture } from '../../utils/texture';
import * as THREE from 'three';

export default function Stage6() {
  const { printedTray, setHint, layoutMode, setControlsEnabled, paperColor } = useGameStore();
  const { camera } = useThree();
  
  const paperColorHex = paperColor === 'red' ? '#D42323' : '#f5f5f5';

  // Set initial camera for Stage 6
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

  const paperGridTexture = useMemo(() => createGridTexture(1.0, 4.7, layoutMode === 'vertical' ? 1 : 5, layoutMode === 'vertical' ? 5 : 1, '#D42323', false, true, false), [layoutMode]);
  const printedFrameTexture = useMemo(() => createInkedFrameTexture('#212121', 1), []);

  const handleSave = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = 300; // High resolution scale factor
    const isVert = layoutMode === 'vertical';
    
    // Paper dimensions based on 3D plane args [1.5, 5.2]
    const paperW = (isVert ? 1.5 : 5.2) * scale;
    const paperH = (isVert ? 5.2 : 1.5) * scale;
    
    canvas.width = paperW;
    canvas.height = paperH;

    // 1. Background (Paper)
    ctx.fillStyle = paperColorHex;
    ctx.fillRect(0, 0, paperW, paperH);

    const cx = paperW / 2;
    const cy = paperH / 2;

    // 2. Grid (Red)
    const gridW = (isVert ? 1.0 : 4.7) * scale;
    const gridH = (isVert ? 4.7 : 1.0) * scale;
    const gridX = cx - gridW / 2;
    const gridY = cy - gridH / 2;

    ctx.strokeStyle = 'rgba(212, 35, 35, 0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (isVert) {
      const cellH = gridH / 5;
      for (let i = 1; i < 5; i++) {
        ctx.moveTo(gridX, gridY + i * cellH);
        ctx.lineTo(gridX + gridW, gridY + i * cellH);
      }
    } else {
      const cellW = gridW / 5;
      for (let i = 1; i < 5; i++) {
        ctx.moveTo(gridX + i * cellW, gridY);
        ctx.lineTo(gridX + i * cellW, gridY + gridH);
      }
    }
    ctx.stroke();

    // 3. Frame (Black)
    const frameW = (isVert ? 1.2 : 5.0) * scale;
    const frameH = (isVert ? 5.0 : 1.2) * scale;
    const frameX = cx - frameW / 2;
    const frameY = cy - frameH / 2;

    ctx.strokeStyle = '#212121';
    ctx.lineWidth = 8;
    ctx.strokeRect(frameX, frameY, frameW, frameH);
    ctx.lineWidth = 2;
    ctx.strokeRect(frameX + 8, frameY + 8, frameW - 16, frameH - 16);

    // 4. Characters
    ctx.fillStyle = '#212121';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${0.6 * scale}px "KaiTi", "STKaiti", "SimSun", serif`;

    printedTray.forEach((char, i) => {
      if (!char) return;
      let x, y;
      if (isVert) {
        x = cx;
        // In 3D: y is up, 2D y is down. 
        // 3D pos: 1.84 - i * 0.92
        y = cy - (1.84 - i * 0.92) * scale;
      } else {
        // 3D pos: i * 0.92 - 1.84
        x = cx + (i * 0.92 - 1.84) * scale;
        y = cy;
      }
      
      // Slight "ink bleed" effect
      ctx.globalAlpha = 0.8;
      ctx.fillText(char, x - 2, y - 2);
      ctx.globalAlpha = 1.0;
      ctx.fillText(char, x, y);
    });

    // 5. Seal (匠人印)
    ctx.fillStyle = '#D42323';
    ctx.font = `bold ${0.25 * scale}px "KaiTi", "STKaiti", "SimSun", serif`;
    let sealX, sealY;
    if (isVert) {
      sealX = cx + (-0.5) * scale;
      sealY = cy - (-2.2) * scale;
    } else {
      sealX = cx + (2.2) * scale;
      sealY = cy - (-0.5) * scale;
    }
    
    // Draw seal border
    ctx.strokeStyle = '#D42323';
    ctx.lineWidth = 4;
    const sealW = 0.8 * scale;
    const sealH = 0.35 * scale;
    ctx.strokeRect(sealX - sealW/2, sealY - sealH/2, sealW, sealH);
    
    ctx.fillText("匠人印", sealX, sealY);

    // Download
    const link = document.createElement('a');
    link.download = '活字印刷作品.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    setHint('作品已保存！匠人等级：初级学徒');
  };

  return (
    <group position={[0, 0, 0]}>
      {/* Final Printed Paper */}
      <group position={[0, 0.05, 0]}>
        <Plane 
          args={layoutMode === 'vertical' ? [1.5, 5.2] : [5.2, 1.5]} 
          position={[0, 0, 0]} 
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <meshStandardMaterial color={paperColorHex} side={THREE.DoubleSide} />
        </Plane>

        {/* Grid Lines on Final Paper */}
        <Plane 
          args={layoutMode === 'vertical' ? [1.0, 4.7] : [4.7, 1.0]} 
          position={[0, 0.01, 0]} 
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial 
            map={paperGridTexture} 
            transparent 
            opacity={0.2} 
          />
        </Plane>
        
        {/* Printed Text */}
        <group position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          {/* Printed Frame */}
          <Plane 
            args={layoutMode === 'vertical' ? [1.2, 5.0] : [5.0, 1.2]} 
            position={[0, 0, 0]}
          >
            <meshStandardMaterial 
              map={printedFrameTexture} 
              transparent 
              opacity={1} 
              depthWrite={false}
            />
          </Plane>

          {printedTray.map((char, i) => {
            if (!char) return null;
            const pos = layoutMode === 'vertical' 
              ? [0, 1.84 - i * 0.92, 0] 
              : [i * 0.92 - 1.84, 0, 0];
            return (
              <Label key={i} position={pos as any} fontSize={0.6} color="#212121" text={char} />
            );
          })}
          <Label 
            position={layoutMode === 'vertical' ? [-0.5, -2.2, 0] : [2.2, -0.5, 0]} 
            fontSize={0.25} 
            color="#D42323" 
            text="匠人印" 
          />
        </group>
      </group>

      {/* Save Button - Positioned to the right */}
      <group position={[4.5, 0, 0]}>
        <Box 
          args={[2.2, 0.5, 1.2]} 
          position={[0, 0.1, 0]}
          castShadow
        >
          <meshStandardMaterial color="#8d6e63" />
        </Box>
        <Box 
          args={[2, 0.4, 1]} 
          position={[0, 0.2, 0]}
          onClick={(e) => { e.stopPropagation(); handleSave(); }}
          onPointerOver={() => document.body.style.cursor = 'pointer'}
          onPointerOut={() => document.body.style.cursor = 'auto'}
        >
          <meshStandardMaterial color="#789262" />
        </Box>
        <Label position={[0, 0.8, 0]} fontSize={0.25} color="#4E342E" text="保存作品" />
        <Label position={[0, 0.2, 0.51]} fontSize={0.18} color="#ffffff" text="点击下载图片" />
      </group>
    </group>
  );
}

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Box, Plane } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import Label from '../Label';
import Tray from '../Tray';
import { useGameStore } from '../../store';
import { createYangkeTextures, createGridTexture, createInkedFrameTexture } from '../../utils/texture';
import * as THREE from 'three';

function PrintedChar({ char, index, printQuality, layoutMode }: { char: string, index: number, printQuality: number, layoutMode: 'vertical' | 'horizontal' }) {
  const { map } = useMemo(() => createYangkeTextures(char, false, '#212121', '#f5f5f5'), [char]);
  const pos = layoutMode === 'vertical' 
    ? [0, 0, index * 0.92 - 1.84] 
    : [index * 0.92 - 1.84, 0, 0];
  return (
    <Plane 
      args={[0.9, 0.9]} 
      position={pos as any} 
      rotation={layoutMode === 'vertical' ? [-Math.PI / 2, 0, 0] : [-Math.PI / 2, 0, -Math.PI / 2]}
    >
      <meshStandardMaterial 
        map={map} 
        transparent 
        opacity={printQuality / 100} 
        depthWrite={false}
      />
    </Plane>
  );
}

function TrayChar({ char, index, layoutMode }: { char: string, index: number, layoutMode: 'vertical' | 'horizontal' }) {
  const { map, bumpMap, roughnessMap } = useMemo(() => createYangkeTextures(char, true, '#0a0a0a', '#4e342e', '#111111'), [char]);
  const pos = layoutMode === 'vertical' 
    ? [0, 0.55, index * 0.92 - 1.84] 
    : [index * 0.92 - 1.84, 0.55, 0];
  return (
    <Box args={[0.9, 0.9, 0.9, 32, 32, 32]} position={pos as any}>
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
          metalness={i === 2 ? 0.6 : 0.1}
        />
      ))}
    </Box>
  );
}

export default function Stage4() {
  const { tray, paperPlaced, setPaperPlaced, paperColor, setPaperColor, printQuality, setPrintQuality, paperRemoved, setPaperRemoved, setHint, setStage, setControlsEnabled, layoutMode, setPrintedTray, inkLevel } = useGameStore();
  const { camera } = useThree();
  
  const trayGridTexture = useMemo(() => createGridTexture(1.0, 4.7, layoutMode === 'vertical' ? 1 : 5, layoutMode === 'vertical' ? 5 : 1, '#3e2723', false, true, false), [layoutMode]);
  const paperGridTexture = useMemo(() => createGridTexture(1.0, 4.7, layoutMode === 'vertical' ? 1 : 5, layoutMode === 'vertical' ? 5 : 1, '#D42323', false, true, false), [layoutMode]);
  const printedFrameTexture = useMemo(() => createInkedFrameTexture('#212121', 1), []);

  const [brushSelected, setBrushSelected] = useState(false);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [brushPos, setBrushPos] = useState<THREE.Vector3 | null>(null);
  const brushRef = useRef<THREE.Mesh>(null);

  // Set initial camera for Stage 4
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
    return () => {
      cancelAnimationFrame(frameId);
      setControlsEnabled(true);
    };
  }, [camera, setControlsEnabled]);

  const handlePaperClick = () => {
    if (!paperPlaced) {
      setPaperPlaced(true);
      setHint('宣纸已铺好，请点击拾取棕刷。');
    }
  };

  const handleBrushClick = () => {
    if (!paperPlaced) {
      setHint('请先铺上宣纸！');
      return;
    }
    if (!brushSelected) {
      setBrushSelected(true);
      setControlsEnabled(false);
      setHint('已拿起棕刷！请在宣纸上按住并拖拽进行拓印。');
    }
  };

  const handlePointerDownGlobal = (e: any) => {
    e.stopPropagation();
    if (brushSelected && printQuality < 100) {
      setIsPointerDown(true);
    }
  };

  const handlePointerUpGlobal = () => {
    setIsPointerDown(false);
  };

  const handlePointerMoveGlobal = (e: any) => {
    if (brushSelected) {
      e.stopPropagation();
      setBrushPos(e.point);
      if (isPointerDown && printQuality < 100) {
        // Check if we are roughly over the tray area to increase quality
        const dx = Math.abs(e.point.x);
        const dz = Math.abs(e.point.z - 2); // Tray is at z=2
        const isOverPaper = layoutMode === 'vertical' 
          ? (dx < 1.5 && dz < 3.5) 
          : (dx < 3.5 && dz < 1.5);
        
        if (isOverPaper) {
          const newQuality = Math.min(100, printQuality + 1.5);
          setPrintQuality(newQuality);
          
          if (newQuality === 100) {
            setHint('拓印清晰！请点击揭下宣纸。');
            setPrintedTray([...tray]);
            setBrushSelected(false);
            setControlsEnabled(true);
            setIsPointerDown(false);
            setBrushPos(null);
          } else {
            setHint(`正在拓印... ${Math.floor(newQuality)}%`);
          }
        }
      }
    }
  };

  useFrame(() => {
    if (brushRef.current) {
      if (brushSelected && brushPos) {
        brushRef.current.position.lerp(new THREE.Vector3(brushPos.x, brushPos.y + 0.2, brushPos.z), 0.3);
      } else {
        // Idle position: Right of the paper stack
        brushRef.current.position.lerp(new THREE.Vector3(3.5, 0.25, -2.5), 0.1);
      }
    }
  });

  const handleRemovePaper = () => {
    if (printQuality === 100) {
      setPaperRemoved(true);
      setHint('拓印成功！进入拆版收纳环节。');
      setTimeout(() => {
        setStage(5);
        setHint('请拔出木楔，将活字放回字柜并清理。');
      }, 2000);
    }
  };

  return (
    <group position={[0, 0, 0]}>
      {/* Invisible Catch-all Plane for Brush Movement */}
      {brushSelected && (
        <Plane
          args={[30, 30]}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 1.1, 2]} // Same height as the paper on the tray
          visible={false}
          onPointerDown={handlePointerDownGlobal}
          onPointerUp={handlePointerUpGlobal}
          onPointerOut={handlePointerUpGlobal}
          onPointerMove={handlePointerMoveGlobal}
        />
      )}

      {/* Paper Color Controls */}
      <group position={[4.5, 1.5, 0]}>
        <Label position={[0, 0.5, 0]} fontSize={0.2} color="#4E342E" text="宣纸颜色" />
        <Box 
          args={[0.6, 0.3, 0.6]} 
          position={[0, 0, 0]}
          onClick={() => setPaperColor('white')}
          onPointerOver={() => document.body.style.cursor = 'pointer'}
          onPointerOut={() => document.body.style.cursor = 'auto'}
        >
          <meshStandardMaterial color={paperColor === 'white' ? '#ffffff' : '#e0e0e0'} />
        </Box>
        <Box 
          args={[0.6, 0.3, 0.6]} 
          position={[0, 0, 0.8]}
          onClick={() => setPaperColor('red')}
          onPointerOver={() => document.body.style.cursor = 'pointer'}
          onPointerOut={() => document.body.style.cursor = 'auto'}
        >
          <meshStandardMaterial color={paperColor === 'red' ? '#D42323' : '#a02020'} />
        </Box>
      </group>

      {/* Paper Stack (宣纸) - Top position */}
      <group position={[0, 0, -2.5]}>
        <Box args={[4, 0.4, 2.5]} position={[0, 0.1, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#4e342e" />
        </Box>
        <Label position={[0, 1.2, 0]} fontSize={0.35} color="#4E342E" text="宣纸 (点击取纸)" />
        {!paperPlaced && (
          <Plane 
            args={[2, 3]} 
            position={[0, 0.35, 0]} 
            rotation={[-Math.PI / 2, 0, 0]}
            onClick={(e) => { e.stopPropagation(); handlePaperClick(); }}
            onPointerOver={() => document.body.style.cursor = 'pointer'}
            onPointerOut={() => document.body.style.cursor = 'auto'}
          >
            <meshStandardMaterial color={paperColor === 'red' ? '#D42323' : '#f5f5f5'} side={THREE.DoubleSide} />
          </Plane>
        )}
      </group>

      {/* Brush (棕刷) - Right of paper stack */}
      <group>
        {!brushSelected && <Label position={[3.5, 1.0, -2.5]} fontSize={0.3} color="#4E342E" text="棕刷" />}
        <Box 
          ref={brushRef}
          args={[1.5, 0.5, 0.8]} 
          position={[3.5, 0.25, -2.5]} 
          onClick={(e) => { e.stopPropagation(); handleBrushClick(); }}
          onPointerOver={() => document.body.style.cursor = 'pointer'}
          onPointerOut={() => document.body.style.cursor = 'auto'}
        >
          <meshStandardMaterial color="#8d6e63" />
        </Box>
      </group>

      {/* Tray (字盘) - Bottom position */}
      <group position={[0, 0, 2]}>
        <Label position={[0, 1.2, 0]} fontSize={0.35} color="#4E342E" text="字盘 (拓印区)" />
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
            <TrayChar key={i} char={char} index={i} layoutMode={layoutMode} />
          ) : null)}

          {/* Placed Paper */}
          {paperPlaced && !paperRemoved && (
            <group position={[0, 1.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <Plane 
                args={layoutMode === 'vertical' ? [1.5, 5.2] : [5.2, 1.5]} 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (printQuality === 100) handleRemovePaper(); 
                }}
                onPointerOver={() => {
                  if (printQuality === 100) document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => document.body.style.cursor = 'auto'}
              >
                <meshStandardMaterial 
                  color={paperColor === 'red' ? '#D42323' : '#f5f5f5'} 
                  transparent 
                  opacity={0.9} 
                  side={THREE.DoubleSide} 
                />
              </Plane>
              
              {/* Grid Lines on Paper (Visible as quality increases) */}
              {printQuality > 0 && (
                <Plane 
                  args={layoutMode === 'vertical' ? [1.0, 4.7] : [4.7, 1.0]} 
                  position={[0, 0, 0.01]} 
                >
                  <meshStandardMaterial 
                    map={paperGridTexture} 
                    transparent 
                    opacity={0.15 * (printQuality / 100)} 
                  />
                </Plane>
              )}
            </group>
          )}
          
          {/* Printed Text on Paper (Visible as quality increases) */}
          {paperPlaced && !paperRemoved && printQuality > 0 && (
            <group position={[0, 1.13, 0]}>
              {/* Printed Frame */}
              <Plane 
                args={layoutMode === 'vertical' ? [1.2, 5.0] : [5.0, 1.2]} 
                position={[0, 0, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <meshStandardMaterial 
                  map={printedFrameTexture} 
                  transparent 
                  opacity={printQuality / 100} 
                  depthWrite={false}
                />
              </Plane>

              {tray.map((char, i) => char ? (
                <PrintedChar key={i} char={char} index={i} printQuality={printQuality} layoutMode={layoutMode} />
              ) : null)}
            </group>
          )}
        </Tray>
      </group>
    </group>
  );
}

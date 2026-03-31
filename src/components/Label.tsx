import React, { useMemo } from 'react';
import { Plane } from '@react-three/drei';
import * as THREE from 'three';

interface LabelProps {
  text: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  fontSize?: number;
  color?: string;
  bgColor?: string;
}

export default function Label({ text, position = [0, 0, 0], rotation = [0, 0, 0], fontSize = 0.4, color = '#4E342E', bgColor = 'transparent' }: LabelProps) {
  const { texture, aspect } = useMemo(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    let canvasWidth = 512;
    const canvasHeight = 128;
    
    if (ctx) {
      // Set font first to measure text accurately
      ctx.font = 'bold 80px "Noto Serif SC", "KaiTi", "STKaiti", serif';
      const metrics = ctx.measureText(text);
      // Ensure canvas is wide enough for the text plus some padding
      canvasWidth = Math.max(512, Math.ceil(metrics.width) + 120);
      
      // Resizing canvas clears its context state, so we must set it again
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      if (bgColor !== 'transparent') {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      } else {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      }
      
      // Re-apply font and text settings
      ctx.font = 'bold 80px "Noto Serif SC", "KaiTi", "STKaiti", serif';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Draw text in the center of the dynamically sized canvas
      ctx.fillText(text, canvasWidth / 2, canvasHeight / 2 + 5); // +5 for visual vertical alignment with some fonts
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return { texture: tex, aspect: canvasWidth / canvasHeight };
  }, [text, color, bgColor]);

  return (
    <Plane args={[fontSize * aspect, fontSize]} position={position} rotation={rotation}>
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </Plane>
  );
}

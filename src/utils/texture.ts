import * as THREE from 'three';

export function createTextTexture(text: string, isReversed: boolean = true, color: string = '#000000', bgColor: string = '#d7ccc8'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 256, 256);
    
    ctx.fillStyle = color;
    ctx.font = 'bold 160px "Noto Serif SC", "KaiTi", "STKaiti", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (isReversed) {
      ctx.translate(256, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.fillText(text, 128, 128);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function createYangkeTextures(text: string, isReversed: boolean = true, color: string = '#5d4037', bgColor: string = '#8d6e63', textRoughnessColor: string = '#222222'): { map: THREE.CanvasTexture, bumpMap: THREE.CanvasTexture, roughnessMap: THREE.CanvasTexture } {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 256;
  bumpCanvas.height = 256;
  const bCtx = bumpCanvas.getContext('2d');

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = 256;
  roughCanvas.height = 256;
  const rCtx = roughCanvas.getContext('2d');
  
  if (ctx && bCtx && rCtx) {
    // Main Texture
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 256, 256);
    
    // Bump Map (Black background = base)
    bCtx.fillStyle = '#000000';
    bCtx.fillRect(0, 0, 256, 256);

    // Roughness Map (White background = rough/matte)
    rCtx.fillStyle = '#ffffff';
    rCtx.fillRect(0, 0, 256, 256);
    
    const font = 'bold 160px "Noto Serif SC", "KaiTi", "STKaiti", serif';
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    bCtx.font = font;
    bCtx.textAlign = 'center';
    bCtx.textBaseline = 'middle';

    rCtx.font = font;
    rCtx.textAlign = 'center';
    rCtx.textBaseline = 'middle';
    
    if (isReversed) {
      ctx.translate(256, 0);
      ctx.scale(-1, 1);
      bCtx.translate(256, 0);
      bCtx.scale(-1, 1);
      rCtx.translate(256, 0);
      rCtx.scale(-1, 1);
    }
    
    ctx.fillStyle = color;
    ctx.fillText(text, 128, 128);
    
    // Raised part is white in bump map
    bCtx.fillStyle = '#ffffff';
    bCtx.fillText(text, 128, 128);

    // Raised part roughness
    rCtx.fillStyle = textRoughnessColor;
    rCtx.fillText(text, 128, 128);
  }
  
  const map = new THREE.CanvasTexture(canvas);
  map.needsUpdate = true;
  
  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.needsUpdate = true;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.needsUpdate = true;
  
  return { map, bumpMap, roughnessMap };
}

export function createGridTexture(width: number, height: number, cols: number, rows: number, color: string = '#3e2723', showHorizontal: boolean = true, showVertical: boolean = true, showBorder: boolean = true): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    ctx.clearRect(0, 0, 512, 512);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    
    // Draw border
    if (showBorder) {
      ctx.strokeRect(0, 0, 512, 512);
    }
    
    // Draw vertical lines
    if (showVertical) {
      for (let i = 1; i < cols; i++) {
        const x = (i / cols) * 512;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 512);
        ctx.stroke();
      }
    }
    
    // Draw horizontal lines
    if (showHorizontal) {
      for (let i = 1; i < rows; i++) {
        const y = (i / rows) * 512;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
      }
    }
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function createInkedFrameTexture(color: string = '#212121', opacity: number = 1): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    ctx.clearRect(0, 0, 512, 512);
    ctx.strokeStyle = color;
    ctx.lineWidth = 24; // Thick inked frame
    ctx.globalAlpha = opacity;
    
    // Draw main border with some jitter
    ctx.strokeRect(12, 12, 488, 488);
    
    // Add ink noise and splatter
    ctx.fillStyle = color;
    for (let i = 0; i < 1500; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      // Only splatter near the border
      if (x < 40 || x > 472 || y < 40 || y > 472) {
        ctx.globalAlpha = Math.random() * opacity;
        ctx.beginPath();
        ctx.arc(x, y, Math.random() * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Add some "dry" spots
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      if (x < 40 || x > 472 || y < 40 || y > 472) {
        ctx.beginPath();
        ctx.arc(x, y, Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

import React from 'react';
import { useGameStore } from '../store';

const ProgressBar: React.FC = () => {
  const { stage, outlineProgress, carveProgress, polishProgress, inkLevel, printQuality } = useGameStore();

  let progress = 0;
  let label = '';
  let show = false;

  switch (stage) {
    case 1:
      const currentTool = outlineProgress < 100 ? 'brush' : carveProgress < 100 ? 'chisel' : 'sandpaper';
      if (currentTool === 'chisel' || currentTool === 'sandpaper') {
        progress = (carveProgress + polishProgress) / 2;
        label = '雕刻与打磨';
        show = true;
      }
      break;
    case 3:
      progress = inkLevel;
      label = '刷墨';
      show = true;
      break;
    case 4:
      progress = printQuality;
      label = '拓印';
      show = true;
      break;
    default:
      progress = 0;
      label = '';
      show = false;
  }

  if (!show) return null;

  return (
    <div className="absolute top-50 sm:top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-white/80 p-2 rounded-full shadow-lg">
      <div className="relative w-10 h-14 sm:w-12 sm:h-16">
        {/* Ink Bottle SVG */}
        <svg viewBox="0 0 100 120" className="w-full h-full">
          <path d="M20 30 L80 30 L85 110 L15 110 Z" fill="#e0e0e0" stroke="#333" strokeWidth="2" />
          <path d="M35 10 L65 10 L65 30 L35 30 Z" fill="#333" />
          <rect x="20" y={110 - (progress * 0.8)} width="60" height={progress * 0.8} fill="#333" />
        </svg>
      </div>
      <span className="text-xs sm:text-sm font-bold text-gray-700">{label}</span>
    </div>
  );
};

export default ProgressBar;

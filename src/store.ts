import { create } from 'zustand';

export type GameMode = 'novice' | 'challenge' | 'free';
export type LayoutMode = 'vertical' | 'horizontal';

interface GameState {
  mode: GameMode;
  layoutMode: LayoutMode;
  stage: number;
  score: number;
  hint: string;
  showTutorial: boolean;
  
  // Stage 1: Making type
  blockSelected: boolean;
  outlineProgress: number;
  carveProgress: number;
  polishProgress: number;
  
  // Stage 2: Typesetting
  targetText: string;
  tray: string[];
  wedgesPlaced: boolean;
  
  // Stage 3: Inking
  inkLevel: number; // 0 to 100
  rollerInked: boolean;
  
  // Stage 4: Printing
  paperPlaced: boolean;
  paperColor: string; // 'white' or 'red'
  printQuality: number; // 0 to 100
  paperRemoved: boolean;
  printedTray: string[];
  
  // Stage 5: Cleaning
  wedgesRemoved: boolean;
  typesCleaned: boolean;
  typesStored: boolean;
  
  // Camera Controls
  controlsEnabled: boolean;
  viewLocked: boolean;
  
  // Actions
  setMode: (mode: GameMode) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  setStage: (stage: number) => void;
  setHint: (hint: string) => void;
  setShowTutorial: (show: boolean) => void;
  
  setBlockSelected: (selected: boolean) => void;
  setOutlineProgress: (progress: number) => void;
  setCarveProgress: (progress: number) => void;
  setPolishProgress: (progress: number) => void;
  
  addToTray: (char: string, index: number) => void;
  removeFromTray: (index: number) => void;
  setWedgesPlaced: (placed: boolean) => void;
  
  setInkLevel: (level: number) => void;
  setRollerInked: (inked: boolean) => void;
  
  setPaperPlaced: (placed: boolean) => void;
  setPaperColor: (color: string) => void;
  setPrintQuality: (quality: number) => void;
  setPaperRemoved: (removed: boolean) => void;
  setPrintedTray: (tray: string[]) => void;
  
  setWedgesRemoved: (removed: boolean) => void;
  setTypesCleaned: (cleaned: boolean) => void;
  setTypesStored: (stored: boolean) => void;
  
  setControlsEnabled: (enabled: boolean) => void;
  setViewLocked: (locked: boolean) => void;
  
  prevStage: () => void;
  resetGame: () => void;
}

const initialState = {
  mode: 'novice' as GameMode,
  layoutMode: 'vertical' as LayoutMode,
  stage: 1,
  score: 0,
  hint: '欢迎来到活字印刷模拟器！请选择工具开始制字。',
  showTutorial: true,
  
  blockSelected: false,
  outlineProgress: 0,
  carveProgress: 0,
  polishProgress: 0,
  
  targetText: '春眠不觉晓',
  tray: ['', '', '', '', ''],
  wedgesPlaced: false,
  
  inkLevel: 0,
  rollerInked: false,
  
  paperPlaced: false,
  paperColor: 'white',
  printQuality: 0,
  paperRemoved: false,
  printedTray: ['', '', '', '', ''],
  
  wedgesRemoved: false,
  typesCleaned: false,
  typesStored: false,
  
  controlsEnabled: true,
  viewLocked: false,
};

export const useGameStore = create<GameState>((set) => ({
  ...initialState,
  
  setMode: (mode) => set({ mode }),
  setLayoutMode: (layoutMode) => set({ layoutMode }),
  setStage: (stage) => set({ stage }),
  setHint: (hint) => set({ hint }),
  setShowTutorial: (showTutorial) => set({ showTutorial }),
  
  setBlockSelected: (blockSelected) => set({ blockSelected }),
  setOutlineProgress: (outlineProgress) => set({ outlineProgress }),
  setCarveProgress: (carveProgress) => set({ carveProgress }),
  setPolishProgress: (polishProgress) => set({ polishProgress }),
  
  addToTray: (char, index) => set((state) => {
    const newTray = [...state.tray];
    newTray[index] = char;
    return { tray: newTray };
  }),
  removeFromTray: (index) => set((state) => {
    const newTray = [...state.tray];
    newTray[index] = '';
    return { tray: newTray };
  }),
  setWedgesPlaced: (wedgesPlaced) => set({ wedgesPlaced }),
  
  setInkLevel: (inkLevel) => set({ inkLevel }),
  setRollerInked: (rollerInked) => set({ rollerInked }),
  
  setPaperPlaced: (paperPlaced) => set({ paperPlaced }),
  setPaperColor: (paperColor) => set({ paperColor }),
  setPrintQuality: (printQuality) => set({ printQuality }),
  setPaperRemoved: (paperRemoved) => set({ paperRemoved }),
  setPrintedTray: (printedTray) => set({ printedTray }),
  
  setWedgesRemoved: (wedgesRemoved) => set({ wedgesRemoved }),
  setTypesCleaned: (typesCleaned) => set({ typesCleaned }),
  setTypesStored: (typesStored) => set({ typesStored }),
  
  setControlsEnabled: (controlsEnabled) => set({ controlsEnabled }),
  setViewLocked: (viewLocked) => set({ viewLocked }),
  
  prevStage: () => set((state) => ({ stage: Math.max(1, state.stage - 1) })),
  
  resetGame: () => set(initialState),
}));

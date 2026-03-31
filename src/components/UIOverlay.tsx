import React from 'react';
import { useGameStore } from '../store';
import { RefreshCcw, HelpCircle, Save, CheckCircle, AlertCircle, ArrowLeft, Lock, Unlock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STAGES = [
  '制字成型', '排版', '刷墨', '拓印', '收纳', '成品'
];

export default function UIOverlay() {
  const { stage, hint, mode, showTutorial, setShowTutorial, resetGame, prevStage } = useGameStore();

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4">
      {/* Top Navigation */}
      <header className="flex justify-between items-center pointer-events-auto bg-[#FFF8E1]/90 backdrop-blur-sm p-2 md:p-3 rounded-xl border border-[#D4A574]/50 shadow-lg">
        <div className="flex items-center gap-2 md:gap-4">
          <h1 className="text-lg md:text-2xl font-serif font-bold text-[#4E342E] tracking-widest">
            活字印刷
          </h1>
          <div className="px-2 py-1 md:px-3 md:py-1 bg-[#D4A574]/20 rounded-full text-xs md:text-sm text-[#4E342E] border border-[#D4A574]/50 whitespace-nowrap">
            {mode === 'novice' ? '新手体验' : mode === 'challenge' ? '趣味挑战' : '自由创作'}
          </div>
        </div>
        
        <div className="flex gap-1 md:gap-3">
          {stage > 1 && (
            <button onClick={prevStage} className="p-1.5 md:p-2 hover:bg-[#D4A574]/30 rounded-lg transition-colors text-[#4E342E] group relative">
              <ArrowLeft size={18} className="md:w-5 md:h-5" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs bg-[#4E342E] text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap hidden md:block">上一步</span>
            </button>
          )}
          <button onClick={resetGame} className="p-1.5 md:p-2 hover:bg-[#E54D42]/10 rounded-lg transition-colors text-[#E54D42] group relative">
            <RefreshCcw size={18} className="md:w-5 md:h-5" />
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs bg-[#E54D42] text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap hidden md:block">重置</span>
          </button>
          <button onClick={() => setShowTutorial(true)} className="p-1.5 md:p-2 hover:bg-[#177CB0]/10 rounded-lg transition-colors text-[#177CB0] group relative">
            <HelpCircle size={18} className="md:w-5 md:h-5" />
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs bg-[#177CB0] text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap hidden md:block">帮助</span>
          </button>
        </div>
      </header>

      {/* Steps Indicator */}
      <div className="absolute top-[72px] left-1/2 -translate-x-1/2 md:top-1/2 md:left-4 md:-translate-y-1/2 md:-translate-x-0 pointer-events-auto w-[95%] md:w-auto z-20">
        <div className="flex flex-row md:flex-col justify-between md:justify-start gap-1 md:gap-2 bg-[#FFF8E1]/90 backdrop-blur-sm p-1.5 md:p-3 rounded-xl border border-[#D4A574]/50 shadow-lg overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {STAGES.map((s, i) => (
            <div 
              key={i}
              className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 p-1.5 md:p-2 rounded-lg transition-all shrink-0 ${
                stage === i + 1 
                  ? 'bg-[#FFB61E]/20 text-[#4E342E] border border-[#FFB61E]' 
                  : stage > i + 1
                    ? 'text-[#789262]'
                    : 'text-[#8D6E63]'
              }`}
            >
              <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold shrink-0 ${
                stage === i + 1 ? 'bg-[#FFB61E] text-[#4E342E]' : stage > i + 1 ? 'bg-[#789262] text-white' : 'bg-[#FFFDE7] border border-[#D4A574] text-[#8D6E63]'
              }`}>
                {stage > i + 1 ? <CheckCircle size={12} className="md:w-[14px] md:h-[14px]" /> : i + 1}
              </div>
              <span className="font-serif tracking-widest text-[10px] md:text-sm whitespace-nowrap">{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Hint Bar */}
      <div className="flex justify-center pointer-events-auto mb-8 md:mb-4 px-4">
        <motion.div 
          key={hint}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#177CB0]/90 backdrop-blur-md px-4 py-2 md:px-6 md:py-3 rounded-full border border-[#177CB0] shadow-2xl flex items-center gap-2 md:gap-3 max-w-full"
        >
          <AlertCircle className="text-white shrink-0" size={18} />
          <p className="text-white font-medium tracking-wide text-sm md:text-base truncate">{hint}</p>
        </motion.div>
      </div>

      {/* Tutorial Modal */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#4E342E]/40 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#FFF8E1] border border-[#D4A574] p-6 md:p-8 rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl md:text-2xl font-serif font-bold text-[#E54D42] mb-4 border-b border-[#D4A574]/50 pb-2">活字印刷工艺指南</h2>
              <div className="space-y-3 md:space-y-4 text-[#4E342E] text-xs md:text-sm leading-relaxed">
                <p><strong className="text-[#177CB0]">1. 制字成型：</strong>选中空白字胚，拖拽勾勒反字轮廓，精雕剔除多余胚体，最后打磨抛光。</p>
                <p><strong className="text-[#177CB0]">2. 排版：</strong>将活字按顺序放入字盘，并用木楔固定。</p>
                <p><strong className="text-[#177CB0]">3. 刷墨：</strong>用墨辊蘸取墨汁，均匀涂抹在活字表面。</p>
                <p><strong className="text-[#177CB0]">4. 拓印：</strong>铺上宣纸，用棕刷适度按压，将墨迹转印到纸上。</p>
                <p><strong className="text-[#177CB0]">5. 收纳：</strong>拆除木楔，清理活字并归位，以便重复使用。</p>
              </div>
              <button 
                onClick={() => setShowTutorial(false)}
                className="mt-8 w-full py-3 bg-[#789262] hover:bg-[#60774d] text-white font-bold rounded-lg transition-colors"
              >
                开始体验
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

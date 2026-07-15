import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mic, Navigation, Filter, Sparkles, Volume2, VolumeX, ArrowRight, CornerDownRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { triggerHaptic } from '../utils/haptic';
import { setMuted, getMuted } from '../utils/speech';

interface VoiceHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCommand?: (commandText: string) => void;
}

export const VoiceHelpModal: React.FC<VoiceHelpModalProps> = ({
  isOpen,
  onClose,
  onSelectCommand
}) => {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [isMuted, setIsMuted] = useState(getMuted());

  if (!isOpen) return null;

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setMuted(nextMuted);
    setIsMuted(nextMuted);
    triggerHaptic('light');
  };

  const navigationCommands = [
    { en: 'Navigate to Table View', np: 'तालिका दृश्यमा जानुहोस्', keywordEn: 'Table View', keywordNp: 'टेबल / तालिका' },
    { en: 'Navigate to Card View', np: 'कार्ड दृश्यमा जानुहोस्', keywordEn: 'Card View', keywordNp: 'कार्ड' },
    { en: 'Navigate to Chart View', np: 'चार्ट दृश्यमा जानुहोस्', keywordEn: 'Chart View', keywordNp: 'चार्ट' },
    { en: 'Navigate to Heatmap View', np: 'हिटम्याप दृश्यमा जानुहोस्', keywordEn: 'Heatmap View', keywordNp: 'हिटम्याप' },
    { en: 'Navigate to Dashboard View', np: 'ड्यासबोर्डमा जानुहोस्', keywordEn: 'Dashboard View', keywordNp: 'ड्यासबोर्ड' },
  ];

  const filterCommands = [
    { en: 'Show Infrastructure Creation', np: 'पूर्वाधार सूचक देखाउनुहोस्', keywordEn: 'Infrastructure', keywordNp: 'पूर्वाधार / भौतिक' },
    { en: 'Show Road Maintenance', np: 'मर्मतसम्भार सूचक देखाउनुहोस्', keywordEn: 'Maintenance', keywordNp: 'मर्मत / सडक' },
    { en: 'Show Employment Creation', np: 'रोजगारी सिर्जना देखाउनुहोस्', keywordEn: 'Employment', keywordNp: 'रोजगार / रोजगारी' },
    { en: 'Show Budget Indicators', np: 'बजेट सूचकहरू देखाउनुहोस्', keywordEn: 'Budget', keywordNp: 'बजेट' },
    { en: 'Show Governance Indicators', np: 'सुशासन सूचक देखाउनुहोस्', keywordEn: 'Governance', keywordNp: 'सुशासन' },
    { en: 'Show All Indicators', np: 'सबै सूचकहरू देखाउनुहोस्', keywordEn: 'Show All / Clear', keywordNp: 'सबै' },
  ];

  const handleCommandClick = (cmdText: string) => {
    triggerHaptic('light');
    if (onSelectCommand) {
      onSelectCommand(cmdText);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10 pointer-events-auto"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Mic size={18} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  {isEn ? 'Voice Commands Cheat Sheet' : 'आवाज आदेश सहयोगी सामग्री'}
                </h3>
                <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mt-0.5">
                  {isEn ? 'Department of Roads Portal' : 'सडक विभाग पोर्टल'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className={`p-2 rounded-xl transition-colors active:scale-90 ${isMuted ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                title={isEn ? (isMuted ? 'Unmute AI' : 'Mute AI') : (isMuted ? 'AI अनम्यूट गर्नुहोस्' : 'AI म्यूट गर्नुहोस्')}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-400 transition-colors active:scale-90"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Quick info / Tips */}
          <div className="px-6 py-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-slate-100 dark:border-indigo-500/10 flex items-start gap-2.5 shrink-0">
            <Sparkles size={14} className="text-indigo-500 mt-0.5 shrink-0" />
            <p className="text-[10px] sm:text-xs text-indigo-800 dark:text-indigo-300 font-medium leading-relaxed">
              {isEn 
                ? 'Tap the Microphone icon in the dashboard to start listening, then speak one of the phrases below. You can also click any command below to test it immediately!'
                : 'सुन्न सुरु गर्न ड्यासबोर्डमा रहेको माइक आइकनमा ट्याप गर्नुहोस्, त्यसपछि तलका मध्ये कुनै एक आदेश भन्नुहोस्। तुरुन्तै परीक्षण गर्न तलको कुनै पनि आदेशमा क्लिक गर्न सक्नुहुन्छ!'}
            </p>
          </div>

          {/* Body scrollable content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {/* Navigation Category */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-1.5">
                <Navigation size={14} className="text-slate-400 dark:text-slate-500" />
                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {isEn ? 'Navigation Commands' : 'दृश्य परिवर्तन गर्ने आदेशहरू'}
                </h4>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {navigationCommands.map((cmd, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCommandClick(isEn ? cmd.en : cmd.np)}
                    className="w-full text-left p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 dark:bg-slate-950/40 dark:hover:bg-indigo-950/20 border border-slate-100 hover:border-indigo-100 dark:border-white/5 dark:hover:border-indigo-500/20 transition-all group flex items-center justify-between"
                  >
                    <div className="space-y-1 pr-4 min-w-0">
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                        "{isEn ? cmd.en : cmd.np}"
                      </p>
                      <div className="flex items-center gap-1 text-[9px] text-slate-400 uppercase tracking-wider">
                        <CornerDownRight size={10} className="text-slate-400" />
                        <span>Key triggers: <strong>{isEn ? cmd.keywordEn : cmd.keywordNp}</strong></span>
                      </div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-hover:border-indigo-200 dark:group-hover:border-indigo-500/20 shadow-xs shrink-0 transition-all">
                      <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Category */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-1.5">
                <Filter size={14} className="text-slate-400 dark:text-slate-500" />
                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {isEn ? 'Filter Commands' : 'श्रेणी फिल्टर गर्ने आदेशहरू'}
                </h4>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {filterCommands.map((cmd, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCommandClick(isEn ? cmd.en : cmd.np)}
                    className="w-full text-left p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 dark:bg-slate-950/40 dark:hover:bg-indigo-950/20 border border-slate-100 hover:border-indigo-100 dark:border-white/5 dark:hover:border-indigo-500/20 transition-all group flex items-center justify-between"
                  >
                    <div className="space-y-1 pr-4 min-w-0">
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                        "{isEn ? cmd.en : cmd.np}"
                      </p>
                      <div className="flex items-center gap-1 text-[9px] text-slate-400 uppercase tracking-wider">
                        <CornerDownRight size={10} className="text-slate-400" />
                        <span>Key triggers: <strong>{isEn ? cmd.keywordEn : cmd.keywordNp}</strong></span>
                      </div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-hover:border-indigo-200 dark:group-hover:border-indigo-500/20 shadow-xs shrink-0 transition-all">
                      <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-white/5 text-center shrink-0">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] flex items-center justify-center gap-1.5">
              <Volume2 size={12} />
              {isEn ? 'Uses standard Web Speech synthesis & recognition' : 'वेब स्पिच सिन्थेसिस र रिकग्जिसन प्रविधि प्रयोग गर्दछ'}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Smile } from 'lucide-react';

interface ViewNavigatorProps {
  isQuickViewOpen?: boolean;
}

export const ViewNavigator: React.FC<ViewNavigatorProps> = ({ 
  isQuickViewOpen = false 
}) => {
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsScrolling(false), 800);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeout);
    };
  }, []);

  if (isQuickViewOpen) return null;

  return (
    <>
      {/* SCROLLING SMILE INDICATOR */}
      <motion.div
        initial={false}
        animate={{ 
          opacity: isScrolling ? 1 : 0, 
          scale: isScrolling ? 1 : 0.5,
          pointerEvents: isScrolling ? 'auto' : 'none',
          y: isScrolling ? 0 : 20
        }}
        className="sm:hidden fixed right-4 bottom-[5.5rem] z-[95] text-indigo-600 dark:text-indigo-400 bg-white/90 dark:bg-slate-800/90 p-3 rounded-full shadow-lg backdrop-blur-md border border-indigo-200 dark:border-indigo-900 transition-all duration-300 flex items-center justify-center"
      >
        <Smile size={24} strokeWidth={2.5} />
      </motion.div>

      {/* Navigator is now integrated into main FAB at bottom right */}
    </>
  );
};

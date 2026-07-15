import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, animate } from 'motion/react';
import { triggerHaptic } from '../utils/haptic';
import { ZoomIn, ZoomOut, RotateCcw, HelpCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ZoomableChartContainerProps {
  children: React.ReactNode;
  titleEn?: string;
  titleNe?: string;
}

export const ZoomableChartContainer: React.FC<ZoomableChartContainerProps> = ({
  children,
}) => {
  const { language } = useLanguage();
  const scale = useMotionValue(1);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [displayScale, setDisplayScale] = useState(1);
  const [isPinching, setIsPinching] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const lastTouchTimeRef = useRef<number>(0);
  const touchStartDistRef = useRef<number>(0);
  const touchStartScaleRef = useRef<number>(1);
  const touchStartCenterRef = useRef({ x: 0, y: 0 });
  const touchStartOffsetRef = useRef({ x: 0, y: 0 });
  
  // Sync scale with state for UI elements
  useEffect(() => {
    const unsubscribe = scale.on('change', (v) => setDisplayScale(v));
    return () => unsubscribe();
  }, [scale]);

  // Measure container dimensions
  useEffect(() => {
    if (!containerRef.current) return;
    
    const measure = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(containerRef.current);
    
    return () => observer.disconnect();
  }, []);

  // Handle double tap or double click to zoom
  const handleDoubleTap = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    
    const currentScale = scale.get();

    if (currentScale > 1) {
      animate(scale, 1, { type: 'spring', stiffness: 300, damping: 30 });
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
      animate(y, 0, { type: 'spring', stiffness: 300, damping: 30 });
      triggerHaptic('light');
    } else {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = clientX - rect.left - rect.width / 2;
      const clickY = clientY - rect.top - rect.height / 2;
      
      const targetScale = 2.5;
      animate(scale, targetScale, { type: 'spring', stiffness: 300, damping: 30 });
      
      // Pan towards double clicked point
      const targetX = -clickX * 1.5;
      const targetY = -clickY * 1.5;
      
      // Calculate constraints for target scale
      const maxX = (dimensions.width * targetScale - dimensions.width) / 2;
      const maxY = (dimensions.height * targetScale - dimensions.height) / 2;
      
      animate(x, Math.max(-maxX, Math.min(maxX, targetX)), { type: 'spring', stiffness: 300, damping: 30 });
      animate(y, Math.max(-maxY, Math.min(maxY, targetY)), { type: 'spring', stiffness: 300, damping: 30 });
      
      triggerHaptic('medium');
    }
  };

  // Mouse double click wrapper
  const handleDoubleClick = (e: React.MouseEvent) => {
    handleDoubleTap(e.clientX, e.clientY);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch / Two-finger Pan start
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const centerX = (t1.clientX + t2.clientX) / 2;
      const centerY = (t1.clientY + t2.clientY) / 2;

      touchStartDistRef.current = dist;
      touchStartScaleRef.current = scale.get();
      touchStartCenterRef.current = { x: centerX, y: centerY };
      touchStartOffsetRef.current = { x: x.get(), y: y.get() };
      setIsPinching(true);
    } else if (e.touches.length === 1) {
      // Double tap check
      const now = Date.now();
      const diff = now - lastTouchTimeRef.current;
      if (diff < 300) {
        const touch = e.touches[0];
        handleDoubleTap(touch.clientX, touch.clientY);
        lastTouchTimeRef.current = 0; // prevent triple tap
      } else {
        lastTouchTimeRef.current = now;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPinching && e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      
      // Update Scale
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const ratio = dist / touchStartDistRef.current;
      const nextScale = Math.max(1, Math.min(4, touchStartScaleRef.current * ratio));
      scale.set(nextScale);

      // Update Pan (Center movement)
      const centerX = (t1.clientX + t2.clientX) / 2;
      const centerY = (t1.clientY + t2.clientY) / 2;
      const deltaX = centerX - touchStartCenterRef.current.x;
      const deltaY = centerY - touchStartCenterRef.current.y;
      
      if (nextScale > 1) {
        const nextX = touchStartOffsetRef.current.x + deltaX;
        const nextY = touchStartOffsetRef.current.y + deltaY;
        
        // Respect boundaries based on current scale
        const maxX = (dimensions.width * nextScale - dimensions.width) / 2;
        const maxY = (dimensions.height * nextScale - dimensions.height) / 2;
        
        x.set(Math.max(-maxX, Math.min(maxX, nextX)));
        y.set(Math.max(-maxY, Math.min(maxY, nextY)));
      }
    }
  };

  const handleTouchEnd = () => {
    setIsPinching(false);
  };

  // Wheel zoom supporting Command or Ctrl key
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = 1.1;
      let nextScale = scale.get();
      if (e.deltaY < 0) {
        nextScale = Math.min(4, nextScale * zoomFactor);
      } else {
        nextScale = Math.max(1, nextScale / zoomFactor);
      }
      
      scale.set(nextScale);
      
      // Ensure pan stays within bounds
      const maxX = (dimensions.width * nextScale - dimensions.width) / 2;
      const maxY = (dimensions.height * nextScale - dimensions.height) / 2;
      x.set(Math.max(-maxX, Math.min(maxX, x.get())));
      y.set(Math.max(-maxY, Math.min(maxY, y.get())));

      if (Math.abs(nextScale - displayScale) > 0.01) {
        triggerHaptic(10);
      }
    }
  };

  // Reset zoom action
  const resetZoom = () => {
    animate(scale, 1, { type: 'spring', stiffness: 300, damping: 30 });
    animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
    animate(y, 0, { type: 'spring', stiffness: 300, damping: 30 });
    triggerHaptic('light');
  };

  // Zoom In button
  const zoomIn = () => {
    const nextScale = Math.min(4, scale.get() + 0.5);
    animate(scale, nextScale, { type: 'spring', stiffness: 300, damping: 30 });
    triggerHaptic('light');
  };

  // Zoom Out button
  const zoomOut = () => {
    const nextScale = Math.max(1, scale.get() - 0.5);
    animate(scale, nextScale, { type: 'spring', stiffness: 300, damping: 30 });
    
    // Snap back to bounds if zooming out
    const maxX = (dimensions.width * nextScale - dimensions.width) / 2;
    const maxY = (dimensions.height * nextScale - dimensions.height) / 2;
    animate(x, Math.max(-maxX, Math.min(maxX, x.get())), { type: 'spring', stiffness: 300, damping: 30 });
    animate(y, Math.max(-maxY, Math.min(maxY, y.get())), { type: 'spring', stiffness: 300, damping: 30 });
    
    triggerHaptic('light');
  };

  // Drag constraints helper
  const maxX = (dimensions.width * displayScale - dimensions.width) / 2;
  const maxY = (dimensions.height * displayScale - dimensions.height) / 2;

  return (
      <motion.div 
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none transition-all duration-300 rounded-2xl group border ${
        displayScale > 1 
          ? 'border-indigo-500 dark:border-indigo-400/80 ring-2 ring-indigo-500/10 shadow-lg shadow-indigo-500/5' 
          : 'border-transparent'
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
    >
      {/* Zoom / Controls Panel Overlay */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 opacity-80 hover:opacity-100 group-hover:opacity-100 transition-opacity duration-200">
        {/* Help Icon */}
        <button
          onClick={() => {
            setShowHelp(!showHelp);
            triggerHaptic('light');
          }}
          className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-100 dark:border-slate-700/50 transition-colors"
          title={language === 'en' ? 'Zoom info' : 'जुम जानकारी'}
        >
          <HelpCircle size={14} />
        </button>

        {/* Zoom scale info pill */}
        <span className="text-[10px] font-black font-mono px-2 py-1 bg-indigo-50/90 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
          {displayScale.toFixed(1)}x
        </span>

        {/* Control Buttons */}
        <div className="flex items-center gap-0.5 bg-white/95 dark:bg-slate-900/90 border border-slate-100 dark:border-slate-700/50 p-0.5 rounded-lg shadow-xs backdrop-blur-xs">
          <button
            onClick={zoomIn}
            disabled={displayScale >= 4}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-40 transition-colors"
            title={language === 'en' ? 'Zoom in' : 'भित्र जुम गर्नुहोस्'}
          >
            <ZoomIn size={13} />
          </button>
          <button
            onClick={zoomOut}
            disabled={displayScale <= 1}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-40 transition-colors"
            title={language === 'en' ? 'Zoom out' : 'बाहिर जुम गर्नुहोस्'}
          >
            <ZoomOut size={13} />
          </button>
          {displayScale > 1 && (
            <button
              onClick={resetZoom}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-500 hover:text-rose-600 transition-colors"
              title={language === 'en' ? 'Reset zoom' : 'जुम रिसेट'}
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Floating Instructions Banner when showHelp is active */}
      {showHelp && (
        <div className="absolute top-12 right-2 left-2 z-15 p-2.5 bg-indigo-50 dark:bg-indigo-950/90 border border-indigo-100 dark:border-indigo-900/60 rounded-xl text-[11px] leading-relaxed text-indigo-700 dark:text-indigo-300 shadow-sm animate-in fade-in slide-in-from-top-1 duration-150">
          <p className="font-bold mb-1">
            {language === 'en' ? 'How to navigate:' : 'नेभिगेट गर्ने तरिका:'}
          </p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>
              {language === 'en' 
                ? 'Pinch with two fingers (mobile) or hold Cmd/Ctrl + Scroll (desktop) to zoom.' 
                : 'जुम गर्न दुई औंलाले पिन्च गर्नुहोस् (मोबाइल) वा Cmd/Ctrl थिचेर स्क्रोल गर्नुहोस् (डेस्कटप)।'}
            </li>
            <li>
              {language === 'en' 
                ? 'Two-finger drag to pan even while zooming.' 
                : 'जुम गरिरहेको बेला पनि प्यान गर्न दुई-औंलाले तान्नुहोस्।'}
            </li>
            <li>
              {language === 'en' 
                ? 'Double-tap/Double-click to toggle quick focus mode.' 
                : 'द्रुत फोकस मोड टगल गर्न डबल-ट्याप/डबल-क्लिक गर्नुहोस्।'}
            </li>
            <li>
              {language === 'en' 
                ? 'When zoomed, single-finger drag the chart to pan.' 
                : 'जुम भएको बेला, प्यान गर्न एउटा औंलाले चार्ट तान्नुहोस्।'}
            </li>
          </ul>
        </div>
      )}

      {/* Helper label on bottom corner shown briefly when zoomed */}
      {displayScale > 1 && (
        <div className="absolute bottom-2 right-2 z-10 pointer-events-none text-[9px] font-bold text-indigo-500/80 bg-indigo-50/50 dark:bg-indigo-950/30 px-1.5 py-0.5 rounded backdrop-blur-xs tracking-wide">
          {language === 'en' ? '🔍 PANNING ENABLED' : '🔍 प्यान सक्षम गरियो'}
        </div>
      )}

      {/* The Animated scalable content wrapper */}
      <motion.div
        ref={contentRef}
        style={{ x, y, scale }}
        drag={displayScale > 1}
        dragConstraints={{ left: -maxX, right: maxX, top: -maxY, bottom: maxY }}
        dragElastic={0.08}
        className={`w-full h-full ${displayScale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

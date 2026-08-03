import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Toast } from '../types';
import { Check, AlertTriangle, AlertCircle, X, RefreshCw } from 'lucide-react';

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div id="toast-root" className="fixed top-5 right-5 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastCardProps {
  key?: string;
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastCard({ toast, onClose }: ToastCardProps) {
  const { id, message, messageEn, type, duration = 4500 } = toast;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  // Color & Icon mapping
  const getStyleConfigs = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-150 dark:border-emerald-900/50',
          text: 'text-emerald-800 dark:text-emerald-300',
          descText: 'text-emerald-600 dark:text-emerald-400',
          iconBg: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400',
          icon: <Check size={16} strokeWidth={2.5} />,
          glow: 'shadow-[0_4px_16px_rgba(16,185,129,0.12)]',
          barColor: 'bg-emerald-500'
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-150 dark:border-amber-900/35',
          text: 'text-amber-800 dark:text-amber-300',
          descText: 'text-amber-600 dark:text-amber-400',
          iconBg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
          icon: <AlertTriangle size={16} />,
          glow: 'shadow-[0_4px_16px_rgba(245,158,11,0.12)]',
          barColor: 'bg-amber-500'
        };
      case 'error':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-150 dark:border-rose-900/50',
          text: 'text-rose-800 dark:text-rose-300',
          descText: 'text-rose-600 dark:text-rose-400',
          iconBg: 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400',
          icon: <AlertCircle size={16} />,
          glow: 'shadow-[0_4px_16px_rgba(244,63,94,0.12)]',
          barColor: 'bg-rose-500'
        };
      case 'info':
      default:
        return {
          bg: 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-150/70 dark:border-indigo-900/50',
          text: 'text-indigo-900 dark:text-indigo-300',
          descText: 'text-indigo-600 dark:text-indigo-400',
          iconBg: 'bg-indigo-100/90 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400',
          icon: <RefreshCw size={14} className="animate-spin text-indigo-500 dark:text-indigo-400" />,
          glow: 'shadow-[0_6px_20px_rgba(99,102,241,0.15)]',
          barColor: 'bg-gradient-to-r from-indigo-500 to-purple-500'
        };
    }
  };

  const style = getStyleConfigs();

  return (
    <motion.div
      layout
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(event, info) => {
        if (Math.abs(info.offset.x) > 100) {
          onClose(id);
        }
      }}
      initial={{ opacity: 0, y: -20, scale: 0.92, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.95, y: 15, filter: 'blur(4px)' }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      className={`pointer-events-auto relative w-full border rounded-2xl p-4 flex gap-3.5 ${style.bg} ${style.glow} group overflow-hidden`}
    >
      {/* Dynamic Animated Status Icon */}
      <div className={`p-2.5 rounded-xl flex items-center justify-center self-start shadow-2xs ${style.iconBg}`}>
        {style.icon}
      </div>

      <div className="flex-1 flex flex-col justify-center min-w-0 pr-2">
        <h4 className={`text-xs font-bold leading-snug font-sans ${style.text}`}>
          {message}
        </h4>
        {messageEn && (
          <p className={`text-[10px] mt-0.5 leading-relaxed font-sans ${style.descText}`}>
            {messageEn}
          </p>
        )}
      </div>

      {/* Close button button */}
      <button
        onClick={() => onClose(id)}
        className="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-350 absolute top-3.5 right-3.5 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
        aria-label="Close notification"
      >
        <X size={12} />
      </button>

      {/* Elegant Progress Indicator Line */}
      <motion.div
        className={`absolute bottom-0 left-0 right-0 h-1 ${style.barColor}`}
        initial={{ width: '100%' }}
        animate={{ width: 0 }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
      />
    </motion.div>
  );
}

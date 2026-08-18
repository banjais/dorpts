import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ModalBackdropProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  backdropClassName?: string;
  closeOnBackdropClick?: boolean;
  zIndex?: number;
}

export const ModalBackdrop: React.FC<ModalBackdropProps> = ({
  isOpen,
  onClose,
  children,
  className = '',
  backdropClassName = '',
  closeOnBackdropClick = true,
  zIndex = 50,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`fixed inset-0 bg-slate-950/80 dark:bg-black/70 backdrop-blur-md z-[${zIndex}] flex items-center justify-center p-4 ${backdropClassName}`}
          onClick={closeOnBackdropClick && onClose ? onClose : undefined}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/60 dark:border-white/10 shadow-2xl shadow-indigo-500/10 dark:shadow-black/40 ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

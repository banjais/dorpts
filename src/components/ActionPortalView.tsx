import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import {
  FileText,
  Share2,
  HelpCircle,
  MessageSquare,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Copy,
  Check,
  MessageCircle,
  Facebook,
  Linkedin,
  Mail,
  Instagram,
  ShieldCheck,
  X,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { APP_TITLES } from '../constants/appTitles';

interface ActionPortalViewProps {
  onOpenReportBuilder?: () => void;
  onOpenHelp?: () => void;
  onOpenFeedback?: () => void;
  onScrollTop?: () => void;
  onScrollBottom?: () => void;
  onOpenAI?: () => void;
  isScrolled?: boolean;
  fiscalYear?: string;
}

export const ActionPortalView: React.FC<ActionPortalViewProps> = ({
  onOpenReportBuilder,
  onOpenHelp,
  onOpenFeedback,
  onScrollTop,
  onScrollBottom,
  onOpenAI,
  isScrolled,
  fiscalYear,
}) => {
  const { language, t } = useLanguage();
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const shareLinks = [
    { name: 'WhatsApp', icon: MessageCircle, color: 'text-green-600', url: `https://wa.me/?text=${encodeURIComponent(APP_TITLES.shortAppName[language] + ' ' + currentUrl)}` },
    { name: 'Facebook', icon: Facebook, color: 'text-blue-600', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}` },
    { name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}` },
    { name: 'Gmail', icon: Mail, color: 'text-red-500', url: `mailto:?subject=${encodeURIComponent(language === 'en' ? 'DOR Progress Tracking' : 'सडक विभाग प्रगति ट्र्याकिङ')}&body=${encodeURIComponent(APP_TITLES.shortAppName[language] + ' ' + currentUrl)}` },
    { name: 'Instagram', icon: Instagram, color: 'text-pink-600', url: `https://www.instagram.com/` },
  ];

  const menuItems = [
    {
      id: 'btn-reports',
      icon: FileText,
      label: language === 'en' ? 'GENERATE REPORTS' : (t('reports') || 'विवरणहरू'),
      action: onOpenReportBuilder || (() => { try { window.print(); } catch(e) { console.error(e); } }),
      color: 'indigo',
    },
    {
      id: 'btn-share',
      icon: Share2,
      label: language === 'en' ? 'SHARE APP' : (t('share') || 'साझा गर्नुहोस्'),
      action: () => setShowQr(true),
      color: 'emerald',
    },
    {
      id: 'btn-help',
      icon: HelpCircle,
      label: language === 'en' ? 'SYSTEM INFO' : (t('help') || 'सहायता'),
      action: onOpenHelp || (() => {}),
      color: 'amber',
    },
    {
      id: 'btn-feedback',
      icon: MessageSquare,
      label: language === 'en' ? 'FEEDBACK' : 'प्रतिक्रिया',
      action: onOpenFeedback || (() => {}),
      color: 'rose',
    },
  ];

  const actionItems = [
    {
      id: 'btn-scroll',
      icon: isScrolled ? ChevronUp : ChevronDown,
      label: isScrolled ? (language === 'en' ? 'MOVE UP' : 'माथि जानुहोस्') : (language === 'en' ? 'Down' : 'तल'),
      action: isScrolled ? onScrollTop : onScrollBottom,
      color: 'slate',
    },
    {
      id: 'btn-ai',
      icon: Sparkles,
      label: 'AI',
      action: onOpenAI,
      color: 'violet',
      highlight: true,
    },
  ];

  const colorMap: Record<string, { bg: string; border: string; text: string; shadow: string; hover: string }> = {
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-950/30', border: 'border-indigo-200 dark:border-indigo-800', text: 'text-indigo-700 dark:text-indigo-300', shadow: 'shadow-indigo-500/10', hover: 'hover:border-indigo-500/50 hover:bg-indigo-100 dark:hover:bg-indigo-950/50' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300', shadow: 'shadow-emerald-500/10', hover: 'hover:border-emerald-500/50 hover:bg-emerald-100 dark:hover:bg-emerald-950/50' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300', shadow: 'shadow-amber-500/10', hover: 'hover:border-amber-500/50 hover:bg-amber-100 dark:hover:bg-amber-950/50' },
    rose: { bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800', text: 'text-rose-700 dark:text-rose-300', shadow: 'shadow-rose-500/10', hover: 'hover:border-rose-500/50 hover:bg-rose-100 dark:hover:bg-rose-950/50' },
    slate: { bg: 'bg-slate-50 dark:bg-slate-900', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-300', shadow: 'shadow-slate-500/10', hover: 'hover:border-slate-400/50 hover:bg-slate-100 dark:hover:bg-slate-800' },
    violet: { bg: 'bg-violet-600 dark:bg-violet-500', border: 'border-violet-700 dark:border-violet-400', text: 'text-white', shadow: 'shadow-violet-600/30', hover: 'hover:bg-violet-700 dark:hover:bg-violet-600' },
  };

  return (
    <motion.div
      layout
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-500/10 dark:shadow-slate-500/5 overflow-hidden"
    >
      <div className="px-3 sm:px-4 py-3 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-3">
          <span className="p-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl">
            <ShieldCheck size={18} />
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {language === 'en' ? 'Action Portal' : 'कार्य पोर्टल'}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Quick access to all app actions' : 'एप कार्यहरूमा छिटो पहुँच'}
            </p>
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {menuItems.map((item) => {
            const colors = colorMap[item.color];
            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  item.action();
                }}
                className={`flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-2xl border ${colors.bg} ${colors.border} ${colors.text} ${colors.shadow} ${colors.hover} transition-all cursor-pointer`}
              >
                <item.icon size={20} className="sm:size-6 shrink-0" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-center leading-tight">
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Action Items Row */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {actionItems.map((item) => {
            const colors = colorMap[item.color];
            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  item.action?.();
                }}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-2xl border ${colors.bg} ${colors.border} ${colors.text} ${colors.shadow} ${colors.hover} transition-all cursor-pointer`}
              >
                <item.icon size={16} className="sm:size-5 shrink-0" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Share Section */}
        <div className="border-t border-slate-100 dark:border-white/5 pt-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 text-center">
            {language === 'en' ? 'Share This App' : 'एप साझा गर्नुहोस्'}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {shareLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${social.color} hover:border-indigo-500/50 transition-all`}
                title={social.name}
              >
                <social.icon size={18} />
                <span className="text-[8px] font-bold uppercase tracking-wider">{social.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* QR Code Modal */}
        <AnimatePresence>
          {showQr && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center bg-black/80 z-[100] p-6 backdrop-blur-md"
              onClick={() => setShowQr(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, rotate: -2 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-white p-8 rounded-[2rem] flex flex-col items-center gap-6 shadow-2xl relative max-w-xs w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-100">
                  <QRCodeCanvas value={currentUrl} size={160} />
                </div>
                <div className="text-center space-y-2 w-full">
                  <h3 className="font-black text-slate-900 text-lg">
                    {language === 'en' ? 'Scan to Open' : 'स्क्यान गर्नुहोस्'}
                  </h3>
                  <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-lg text-[0.625rem] font-mono text-slate-600 overflow-hidden">
                    <span className="truncate flex-1">{currentUrl}</span>
                    <button onClick={handleCopy} className="p-1.5 bg-white rounded-md shadow-sm hover:text-indigo-600 cursor-pointer">
                      {copied ? <Check size={12} className="text-emerald-500 font-bold" /> : <Copy size={12} />}
                    </button>
                  </div>
                  {copied && (
                    <p className="text-[0.625rem] font-bold text-emerald-500 tracking-wider">
                      {language === 'en' ? 'Link Copied!' : 'लिङ्क कपि भयो!'}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowQr(false)}
                  className="absolute -top-4 -right-4 bg-[#dc2626] text-white p-2.5 rounded-full shadow-xl hover:scale-110 transition-transform cursor-pointer"
                >
                  <X size={18} />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Megaphone, X, AlertTriangle, Info, AlertCircle, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { collection, query, where, onSnapshot, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface Announcement {
  id: string;
  title: string;
  message: string;
  messageEn?: string;
  priority: 'info' | 'warning' | 'urgent';
  targetOffices?: string[];
  targetRoles?: string[];
  createdBy: string;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
  isActive: boolean;
}

export const AnnouncementBoard: React.FC = () => {
  const { language, t } = useLanguage();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const q = query(
      collection(db, 'announcements'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = Timestamp.now();
      const items: Announcement[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Announcement;
        if (data.expiresAt && data.expiresAt.toMillis() < now.toMillis()) return;
        items.push({ id: doc.id, ...data });
      });
      setAnnouncements(items);
      setLoading(false);
    }, (err) => {
      console.error('Announcements listener failed:', err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set(prev).add(id));
  };

  const visible = announcements.filter(a => !dismissedIds.has(a.id));

  const priorityConfig = {
    urgent: {
      bg: 'bg-rose-50 dark:bg-rose-500/10',
      border: 'border-rose-200 dark:border-rose-500/30',
      text: 'text-rose-700 dark:text-rose-300',
      icon: <AlertCircle size={18} className="text-rose-600 dark:text-rose-400" />,
      badge: 'bg-rose-600 text-white',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      border: 'border-amber-200 dark:border-amber-500/30',
      text: 'text-amber-700 dark:text-amber-300',
      icon: <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />,
      badge: 'bg-amber-600 text-white',
    },
    info: {
      bg: 'bg-indigo-50 dark:bg-indigo-500/10',
      border: 'border-indigo-200 dark:border-indigo-500/30',
      text: 'text-indigo-700 dark:text-indigo-300',
      icon: <Info size={18} className="text-indigo-600 dark:text-indigo-400" />,
      badge: 'bg-indigo-600 text-white',
    },
  };

  const formatDate = (ts?: Timestamp) => {
    if (!ts) return '';
    const d = ts.toDate();
    return d.toLocaleDateString(language === 'ne' ? 'ne-NP' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-xs text-slate-400">{language === 'en' ? 'Loading announcements...' : 'घोषणाहरू लोड गर्दै...'}</p>
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div className="p-8 text-center">
        <Megaphone size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
        <p className="text-xs text-slate-400">{language === 'en' ? 'No active announcements' : 'सक्रिय घोषणा छैन'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visible.map((ann) => {
        const config = priorityConfig[ann.priority] || priorityConfig.info;
        return (
          <motion.div
            key={ann.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`relative rounded-2xl p-4 border ${config.bg} ${config.border}`}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">{config.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${config.badge}`}>
                    {ann.priority}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock size={10} />
                    {formatDate(ann.createdAt)}
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">
                  {language === 'en' ? ann.title : (ann.title)}
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {language === 'en' ? ann.message : (ann.messageEn || ann.message)}
                </p>
                {ann.targetOffices && ann.targetOffices.length > 0 && (
                  <p className="text-[10px] text-slate-400 mt-2">
                    {language === 'en' ? 'For' : 'लागि'}: {ann.targetOffices.join(', ')}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDismiss(ann.id)}
                className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white/50 transition-all"
                title={language === 'en' ? 'Dismiss' : 'हटाउनुहोस्'}
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

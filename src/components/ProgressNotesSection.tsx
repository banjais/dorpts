import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Send, Calendar, User, Loader2, 
  ChevronRight, Bookmark, AlertCircle, HelpCircle, Check
} from 'lucide-react';
import { 
  collection, query, where, orderBy, limit, onSnapshot, doc, setDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Indicator, IndicatorComment } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ProgressNotesSectionProps {
  indicator: Indicator;
  addToast?: (message: string, messageEn?: string, type?: 'success' | 'info' | 'error' | 'warning') => void;
}

export const ProgressNotesSection: React.FC<ProgressNotesSectionProps> = ({ indicator, addToast }) => {
  const { user, isAdmin, logActivity } = useAuth();
  const { language } = useLanguage();
  const [notes, setNotes] = useState<IndicatorComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!indicator.id) return;

    setLoading(true);
    const commentsQuery = query(
      collection(db, 'indicator_comments'),
      where('indicatorId', '==', indicator.id),
      where('parentId', '==', null), // Only show top-level notes here
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const list: IndicatorComment[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as IndicatorComment);
      });
      setNotes(list);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching notes:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [indicator.id]);

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !noteText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const newNote = {
      id: noteId,
      indicatorId: indicator.id,
      userId: user.uid,
      userName: user.displayName || user.email?.split('@')[0] || 'Unknown User',
      userEmail: user.email || '',
      content: noteText.trim(),
      createdAt: new Date().toISOString(),
      category: 'update', // Default category for progress notes
      parentId: null
    };

    try {
      await setDoc(doc(db, 'indicator_comments', noteId), newNote);
      await logActivity('edit_indicator', `Added progress note on indicator "${indicator.id}"`);
      
      if (addToast) {
        addToast(
          'प्रगति नोट सफलतापूर्वक थपियो।',
          'Progress note added successfully.',
          'success'
        );
      }
      setNoteText('');
    } catch (error) {
      console.error("Error adding note:", error);
      if (addToast) {
        addToast(
          'नोट थप्न असफल भयो।',
          'Failed to add note.',
          'error'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(language === 'en' ? 'en-US' : 'ne-NP', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return isoString;
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'update': return <Check size={12} className="text-emerald-500" />;
      case 'issue': return <AlertCircle size={12} className="text-rose-500" />;
      case 'question': return <HelpCircle size={12} className="text-amber-500" />;
      default: return <Bookmark size={12} className="text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
          <MessageSquare size={14} className="text-indigo-500" />
          {language === 'en' ? 'Team Observations & Progress Notes' : 'टोली अवलोकन र प्रगति नोटहरू'}
        </h3>
      </div>

      {/* Quick Add Form */}
      {user && (
        <form onSubmit={handlePostNote} className="relative">
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-white/5 p-3 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={language === 'en' ? 'Leave a progress note or observation...' : 'प्रगति नोट वा अवलोकन छोड्नुहोस्...'}
              className="w-full bg-transparent border-0 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-0 resize-none min-h-[60px]"
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 dark:border-white/5">
              <span className="text-[10px] text-slate-400 font-medium">
                {noteText.length}/500
              </span>
              <button
                type="submit"
                disabled={!noteText.trim() || isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
              >
                {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                {language === 'en' ? 'Post Note' : 'नोट पोस्ट गर्नुहोस्'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Notes List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 size={20} className="animate-spin text-slate-300" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-white/5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {language === 'en' ? 'No recent observations' : 'कुनै हालैका अवलोकनहरू छैनन्'}
            </p>
          </div>
        ) : (
          notes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-white/10 shadow-sm"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase border border-indigo-100 dark:border-indigo-900/30">
                    {note.userName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-[11px] font-black text-slate-900 dark:text-white leading-tight">
                      {note.userName}
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">
                      <Calendar size={10} />
                      {formatDate(note.createdAt)}
                      <span className="inline-flex items-center gap-1 ml-1 px-1 py-0.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5">
                        {getCategoryIcon((note as any).category)}
                        {(note as any).category || 'note'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {note.content}
              </p>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

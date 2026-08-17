import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, User, Mail, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot, doc, updateDoc, deleteDoc, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { LoginScreen } from './LoginScreen';

interface Feedback {
  id: string;
  message: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  createdAt: any;
  status: 'new' | 'read' | 'replied';
  reply?: string;
  repliedAt?: any;
  repliedBy?: string;
}

export const UserFeedbackView: React.FC<{ language: 'en' | 'ne' }> = ({ language }) => {
  const { user, isSuperadmin, role } = useAuth();
  const { t } = useLanguage();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'user_feedback'), orderBy('createdAt', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Feedback));
      setFeedbacks(list);
      setLoading(false);
    }, (err) => {
      console.error('Failed to fetch feedbacks:', err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async () => {
    if (!message.trim() || !user) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'user_feedback'), {
        message: message.trim(),
        userName: user.displayName || user.email,
        userEmail: user.email,
        userRole: role || 'viewer',
        createdAt: serverTimestamp(),
        status: 'new',
      });
      setMessage('');
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (feedbackId: string) => {
    const reply = replyText[feedbackId]?.trim();
    if (!reply) return;
    try {
      const feedbackRef = doc(db, 'user_feedback', feedbackId);
      const feedbackSnap = await getDocs(query(collection(db, 'user_feedback'), where('__name__', '==', feedbackId)));
      if (!feedbackSnap.empty) {
        await updateDoc(feedbackRef, {
          reply,
          repliedAt: serverTimestamp(),
          repliedBy: user?.email,
          status: 'replied',
        });
        setReplyingTo(null);
        setReplyText(prev => ({ ...prev, [feedbackId]: '' }));
      }
    } catch (err) {
      console.error('Failed to reply to feedback:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'en' ? 'Delete this feedback?' : 'यो प्रतिक्रिया मेट्नुहोस्?')) return;
    try {
      await deleteDoc(doc(db, 'user_feedback', id));
      setFeedbacks(prev => prev.filter(f => f.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const canReply = isSuperadmin;
  const canSubmit = user && (role === 'office_admin' || role === 'viewer' || isSuperadmin);

  return (
    <div className="h-full flex flex-col">
      {showLogin && (
        <LoginScreen onClose={() => setShowLogin(false)} />
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {language === 'en' ? 'User Feedbacks' : 'प्रयोगकर्ता प्रतिक्रियाहरू'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'en' ? `Total: ${feedbacks.length}` : `कुल: ${feedbacks.length}`}
            </p>
          </div>
        </div>

        {canSubmit && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
              {language === 'en' ? 'Submit Feedback' : 'प्रतिक्रिया पठाउनुहोस्'}
            </h4>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={language === 'en' ? 'Write your feedback here...' : 'तपाईंको प्रतिक्रिया यहाँ लेख्नुहोस्...'}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[100px]"
            />
            <button
              onClick={handleSubmit}
              disabled={!message.trim() || submitting}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              <span>{language === 'en' ? 'Submit Feedback' : 'प्रतिक्रिया पठाउनुहोस्'}</span>
            </button>
            {submitted && (
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={14} />
                <span>{language === 'en' ? 'Feedback submitted successfully!' : 'प्रतिक्रिया सफलतापूर्वक पठाइयो!'}</span>
              </div>
            )}
          </div>
        )}

        {!user && (
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800 text-center space-y-2">
            <ShieldCheck size={24} className="mx-auto text-amber-600 dark:text-amber-400" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {language === 'en' ? 'Please sign in to submit feedback' : 'प्रतिक्रिया पठाउन साइन इन गर्नुहोस्'}
            </p>
            <button
              onClick={() => setShowLogin(true)}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700 transition-all"
            >
              {language === 'en' ? 'Sign In' : 'साइन इन'}
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <Loader2 size={24} className="mx-auto text-slate-400 animate-spin" />
          </div>
        )}

        {!loading && feedbacks.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs text-slate-500">
              {language === 'en' ? 'No feedbacks yet' : 'अहिले सम्म कुनै प्रतिक्रिया छैन'}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {feedbacks.map((fb) => (
            <div key={fb.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <User size={14} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {fb.userName || fb.userEmail || (language === 'en' ? 'Anonymous' : 'बेनामी')}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {fb.createdAt?.toDate?.()?.toLocaleString() || ''}
                    </p>
                  </div>
                </div>
                {fb.userRole && (
                  <span className="text-[9px] font-black uppercase px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {fb.userRole}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {fb.message}
              </p>
              {fb.reply && (
                <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-3 border border-indigo-100 dark:border-indigo-900/50 space-y-1">
                  <p className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                    {language === 'en' ? 'Admin Reply' : 'प्रशासकको उत्तर'}
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300">{fb.reply}</p>
                  <p className="text-[10px] text-slate-500">
                    {fb.repliedAt?.toDate?.()?.toLocaleString() || ''}
                  </p>
                </div>
              )}
              {canReply && fb.status !== 'replied' && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {replyingTo === fb.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={replyText[fb.id] || ''}
                        onChange={(e) => setReplyText(prev => ({ ...prev, [fb.id]: e.target.value }))}
                        placeholder={language === 'en' ? 'Write your reply...' : 'तपाईंको उत्तर लेख्नुहोस्...'}
                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs min-h-[80px]"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReply(fb.id)}
                          disabled={!replyText[fb.id]?.trim()}
                          className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {language === 'en' ? 'Send Reply' : 'उत्तर पठाउनुहोस्'}
                        </button>
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-black rounded-lg hover:bg-slate-300"
                        >
                          {language === 'en' ? 'Cancel' : 'रद्द'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyingTo(fb.id)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-[10px] font-black rounded-lg hover:bg-indigo-100 transition-all"
                    >
                      <Send size={12} />
                      {language === 'en' ? 'Reply' : 'उत्तर दिनुहोस्'}
                    </button>
                  )}
                </div>
              )}
              {canReply && (
                <button
                  onClick={() => handleDelete(fb.id)}
                  className="text-[10px] text-rose-600 hover:text-rose-700 font-bold"
                >
                  {language === 'en' ? 'Delete' : 'मेट्नुहोस्'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

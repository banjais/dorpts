import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Send, CornerDownRight, Trash2, Edit2, Shield, User, 
  MessageSquare, Calendar, HelpCircle, AlertCircle, Bookmark, Check, Loader2,
  Lock, MessageCircle, RefreshCw, MessageSquarePlus
} from 'lucide-react';
import { Indicator, IndicatorComment } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  collection, doc, setDoc, updateDoc, deleteDoc, 
  query, where, orderBy, onSnapshot 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface IndicatorCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicator: Indicator | null;
  addToast?: (message: string, messageEn?: string, type?: 'success' | 'info' | 'error' | 'warning') => void;
}

type CommentCategory = 'general' | 'update' | 'issue' | 'question';

export const IndicatorCommentsModal: React.FC<IndicatorCommentsModalProps> = ({ 
  isOpen, 
  onClose, 
  indicator,
  addToast
}) => {
  const { user, isAdmin, logActivity } = useAuth();
  const { language } = useLanguage();
  
  const [comments, setComments] = useState<IndicatorComment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [commentText, setCommentText] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<CommentCategory>('general');
  const [replyingTo, setReplyingTo] = useState<IndicatorComment | null>(null);
  const [editingComment, setEditingComment] = useState<IndicatorComment | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Real-time Firestore sync
  useEffect(() => {
    if (!isOpen || !indicator) return;

    setLoading(true);
    const colPath = 'indicator_comments';
    const commentsQuery = query(
      collection(db, colPath),
      where('indicatorId', '==', indicator.id)
    );

    const unsubscribe = onSnapshot(
      commentsQuery,
      (snapshot) => {
        const list: IndicatorComment[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          list.push({
            id: doc.id,
            indicatorId: data.indicatorId,
            userId: data.userId,
            userName: data.userName,
            userEmail: data.userEmail,
            content: data.content,
            parentId: data.parentId,
            createdAt: data.createdAt,
            // Fallback fields for optional tags
            ...((data.category) && { category: data.category })
          } as any);
        });

        // Sort comments by createdAt ISO string ascending
        list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setComments(list);
        setLoading(false);
      },
      (error) => {
        console.error('Firestore snapshot listener failed for comments:', error);
        setLoading(false);
        try {
          handleFirestoreError(error, OperationType.GET, colPath);
        } catch (e) {
          if (addToast) {
            addToast(
              'टिप्पणीहरू लोड गर्न असफल भयो।',
              'Failed to load comments.',
              'error'
            );
          }
        }
      }
    );

    return () => unsubscribe();
  }, [isOpen, indicator, addToast]);

  // Scroll to bottom on new top-level comment
  useEffect(() => {
    if (comments.length > 0 && !loading) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments.length, loading]);

  const indicatorName = indicator ? (language === 'en' ? (indicator.nameEn || indicator.name) : indicator.name) : '';

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      if (addToast) {
        addToast(
          'टिप्पणी पोस्ट गर्न कृपया पहिले लगइन गर्नुहोस्।',
          'Please log in first to post a comment.',
          'warning'
        );
      }
      return;
    }

    if (!commentText.trim()) return;

    setSubmitting(true);
    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const pathForWrite = 'indicator_comments';

    const newCommentPayload = {
      id: commentId,
      indicatorId: indicator.id,
      userId: user.uid,
      userName: user.displayName || user.email?.split('@')[0] || 'Unknown User',
      userEmail: user.email || '',
      content: commentText.trim(),
      createdAt: new Date().toISOString(),
      category: replyingTo ? 'general' : selectedCategory, // replies are usually general responses
      ...(replyingTo && { parentId: replyingTo.id })
    };

    try {
      await setDoc(doc(db, pathForWrite, commentId), newCommentPayload);
      
      // Log activity
      await logActivity(
        'edit_indicator',
        `Added collaboration comment on indicator "${indicator.id}": "${commentText.substring(0, 30)}..."`
      );

      if (addToast) {
        addToast(
          replyingTo ? 'जवाफ सफलतापूर्वक पोस्ट गरियो।' : 'टिप्पणी सफलतापूर्वक पोस्ट गरियो।',
          replyingTo ? 'Reply posted successfully.' : 'Comment posted successfully.',
          'success'
        );
      }

      setCommentText('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error posting comment:', error);
      if (addToast) {
        addToast(
          'टिप्पणी पोस्ट गर्न असफल भयो।',
          'Failed to post comment.',
          'error'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (comment: IndicatorComment) => {
    setEditingComment(comment);
    setEditText(comment.content);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editText.trim()) return;

    setSubmitting(true);
    const path = `indicator_comments/${commentId}`;
    try {
      await updateDoc(doc(db, 'indicator_comments', commentId), {
        content: editText.trim(),
        updatedAt: new Date().toISOString()
      });

      if (addToast) {
        addToast(
          'टिप्पणी सफलतापूर्वक सम्पादन गरियो।',
          'Comment edited successfully.',
          'success'
        );
      }

      setEditingComment(null);
      setEditText('');
    } catch (error) {
      console.error('Error saving comment edit:', error);
      if (addToast) {
        addToast(
          'टिप्पणी सम्पादन गर्न असफल भयो।',
          'Failed to update comment.',
          'error'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm(language === 'en' ? 'Are you sure you want to delete this comment?' : 'के तपाईं निश्चित रूपमा यो टिप्पणी हटाउन चाहनुहुन्छ?')) {
      return;
    }

    setSubmitting(true);
    try {
      await deleteDoc(doc(db, 'indicator_comments', commentId));

      // Also delete or orphan any replies associated with this comment
      // To be safe and clean, we keep it simple since firestore.rules allows deletes.
      if (addToast) {
        addToast(
          'टिप्पणी सफलतापूर्वक हटाइयो।',
          'Comment deleted successfully.',
          'success'
        );
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      if (addToast) {
        addToast(
          'टिप्पणी हटाउन असफल भयो।',
          'Failed to delete comment.',
          'error'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to format date
  const formatCommentDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '';
      
      const options: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return date.toLocaleDateString(language === 'en' ? 'en-US' : 'ne-NP', options);
    } catch (e) {
      return '';
    }
  };

  // Organize comments into threaded tree structure
  const parentComments = comments.filter(c => !c.parentId);
  const getRepliesFor = (parentId: string) => comments.filter(c => c.parentId === parentId);

  // Custom colors for different category badges
  const getCategoryStyles = (category?: string) => {
    switch (category) {
      case 'update':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/30',
          border: 'border-emerald-150 dark:border-emerald-900/40',
          text: 'text-emerald-700 dark:text-emerald-400',
          label: language === 'en' ? 'Update' : 'अपडेट',
          icon: <Check size={10} className="mr-1" />
        };
      case 'issue':
        return {
          bg: 'bg-red-50 dark:bg-red-950/30',
          border: 'border-red-150 dark:border-red-900/40',
          text: 'text-red-700 dark:text-red-400',
          label: language === 'en' ? 'Risk/Issue' : 'जोखिम/समस्या',
          icon: <AlertCircle size={10} className="mr-1" />
        };
      case 'question':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/30',
          border: 'border-amber-150 dark:border-amber-900/40',
          text: 'text-amber-700 dark:text-amber-400',
          label: language === 'en' ? 'Question' : 'प्रश्न',
          icon: <HelpCircle size={10} className="mr-1" />
        };
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/30',
          border: 'border-blue-150 dark:border-blue-900/40',
          text: 'text-blue-700 dark:text-blue-400',
          label: language === 'en' ? 'Note' : 'टिप्पणी',
          icon: <Bookmark size={10} className="mr-1" />
        };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && indicator && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl h-[85vh] sm:h-[80vh] bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-white/10"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-150 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-xl shadow-inner">
                <MessageSquare size={20} />
              </div>
              <div className="overflow-hidden max-w-[420px]">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                  {language === 'en' ? 'Discussion & Notes' : 'छलफल र टिप्पणीहरू'}
                </h2>
                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-0.5 truncate">
                  {indicatorName}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Comments list space */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-slate-50/30 dark:bg-slate-950/10">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 space-y-2 text-slate-400">
                <Loader2 size={32} className="animate-spin text-indigo-500" />
                <p className="text-xs font-semibold">{language === 'en' ? 'Loading notes...' : 'टिप्पणीहरू लोड हुँदैछ...'}</p>
              </div>
            ) : parentComments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-52 text-center p-6 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-3xl bg-white dark:bg-slate-900/50">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 rounded-2xl mb-3">
                  <MessageSquarePlus size={24} />
                </div>
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {language === 'en' ? 'No Notes or Discussions Yet' : 'अहिलेसम्म कुनै टिप्पणीहरू छैनन्'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  {language === 'en' 
                    ? 'Be the first to attach a note or start a collaborative discussion thread on this indicator!'
                    : 'यस सूचकमा नोट थप्न वा सामूहिक छलफल सुरु गर्ने पहिलो बन्नुहोस्!'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {parentComments.map((comment) => {
                  const badge = getCategoryStyles((comment as any).category);
                  const replies = getRepliesFor(comment.id);
                  const isAuthor = user && user.uid === comment.userId;

                  return (
                    <div key={comment.id} className="space-y-4">
                      {/* Parent Comment */}
                      <div className="group relative bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-150 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300 shrink-0 border border-slate-200 dark:border-white/10 shadow-sm uppercase">
                            {comment.userName.charAt(0)}
                          </div>

                          {/* Content Panel */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                                {comment.userName}
                              </span>
                              
                              {/* Category Badge */}
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border ${badge.bg} ${badge.border} ${badge.text}`}>
                                {badge.icon}
                                {badge.label}
                              </span>

                              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                                {formatCommentDate(comment.createdAt)}
                              </span>
                            </div>

                            <p className="text-[10px] text-slate-400 truncate mt-0.5 max-w-xs font-mono">
                              {comment.userEmail}
                            </p>

                            {/* Comment Text or Editor */}
                            {editingComment?.id === comment.id ? (
                              <div className="mt-2 space-y-2">
                                <textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="w-full text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[60px]"
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setEditingComment(null)}
                                    className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-700 bg-slate-100 dark:bg-slate-800 rounded-lg"
                                  >
                                    {language === 'en' ? 'Cancel' : 'रद्द'}
                                  </button>
                                  <button
                                    onClick={() => handleSaveEdit(comment.id)}
                                    disabled={submitting || !editText.trim()}
                                    className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg flex items-center gap-1 disabled:opacity-50"
                                  >
                                    {submitting && <Loader2 size={10} className="animate-spin" />}
                                    {language === 'en' ? 'Save' : 'सुरक्षित गर्नुहोस्'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 leading-relaxed whitespace-pre-wrap font-medium">
                                {comment.content}
                              </p>
                            )}

                            {/* Actions bar */}
                            {!editingComment && (
                              <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-slate-50 dark:border-white/5">
                                <button
                                  onClick={() => setReplyingTo(comment)}
                                  className="inline-flex items-center text-[9px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                  <CornerDownRight size={10} className="mr-1" />
                                  {language === 'en' ? 'Reply' : 'जवाफ दिनुहोस्'}
                                </button>

                                {isAuthor && (
                                  <button
                                    onClick={() => handleStartEdit(comment)}
                                    className="inline-flex items-center text-[9px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                  >
                                    <Edit2 size={10} className="mr-1" />
                                    {language === 'en' ? 'Edit' : 'सम्पादन गर्नुहोस्'}
                                  </button>
                                )}

                                {(isAuthor || isAdmin) && (
                                  <button
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="inline-flex items-center text-[9px] font-black uppercase tracking-wider text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 size={10} className="mr-1" />
                                    {language === 'en' ? 'Delete' : 'हटाउनुहोस्'}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Replies Grid */}
                      {replies.length > 0 && (
                        <div className="pl-6 sm:pl-8 space-y-3 relative">
                          {/* Thread Connector Line */}
                          <div className="absolute left-3 sm:left-4 top-0 bottom-6 w-0.5 bg-slate-200 dark:bg-white/5 rounded-full" />

                          {replies.map((reply) => {
                            const isReplyAuthor = user && user.uid === reply.userId;

                            return (
                              <div key={reply.id} className="relative group bg-slate-50/45 dark:bg-slate-900/40 p-3.5 rounded-2xl border border-slate-150 dark:border-white/5 hover:border-slate-250 dark:hover:border-white/10 transition-colors">
                                <div className="flex items-start gap-3">
                                  {/* Avatar */}
                                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-600 dark:text-slate-300 shrink-0 uppercase">
                                    {reply.userName.charAt(0)}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                      <span className="text-[11px] font-extrabold text-slate-900 dark:text-white">
                                        {reply.userName}
                                      </span>
                                      
                                      <span className="text-[8px] text-slate-400 dark:text-slate-500 font-semibold">
                                        {formatCommentDate(reply.createdAt)}
                                      </span>
                                    </div>

                                    {editingComment?.id === reply.id ? (
                                      <div className="mt-2 space-y-2">
                                        <textarea
                                          value={editText}
                                          onChange={(e) => setEditText(e.target.value)}
                                          className="w-full text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[50px]"
                                        />
                                        <div className="flex justify-end gap-2">
                                          <button
                                            onClick={() => setEditingComment(null)}
                                            className="px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-700 bg-slate-100 dark:bg-slate-800 rounded-md"
                                          >
                                            {language === 'en' ? 'Cancel' : 'रद्द'}
                                          </button>
                                          <button
                                            onClick={() => handleSaveEdit(reply.id)}
                                            disabled={submitting || !editText.trim()}
                                            className="px-2 py-0.5 text-[8px] font-black uppercase tracking-wider bg-indigo-500 hover:bg-indigo-600 text-white rounded-md flex items-center gap-1 disabled:opacity-50"
                                          >
                                            {submitting && <Loader2 size={8} className="animate-spin" />}
                                            {language === 'en' ? 'Save' : 'सुरक्षित गर्नुहोस्'}
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1.5 font-medium leading-relaxed">
                                        {reply.content}
                                      </p>
                                    )}

                                    {/* Reply edit/delete controls */}
                                    {!editingComment && (
                                      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-100/50 dark:border-white/5">
                                        {isReplyAuthor && (
                                          <button
                                            onClick={() => handleStartEdit(reply)}
                                            className="inline-flex items-center text-[8px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                          >
                                            <Edit2 size={8} className="mr-1" />
                                            {language === 'en' ? 'Edit' : 'सम्पादन गर्नुहोस्'}
                                          </button>
                                        )}

                                        {(isReplyAuthor || isAdmin) && (
                                          <button
                                            onClick={() => handleDeleteComment(reply.id)}
                                            className="inline-flex items-center text-[8px] font-black uppercase tracking-wider text-red-500 hover:text-red-700"
                                          >
                                            <Trash2 size={8} className="mr-1" />
                                            {language === 'en' ? 'Delete' : 'हटाउनुहोस्'}
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={commentsEndRef} />
              </div>
            )}
          </div>

          {/* Form Composer */}
          <div className="p-4 sm:p-5 border-t border-slate-150 dark:border-white/5 bg-white dark:bg-slate-900 shrink-0">
            {user ? (
              <form onSubmit={handlePostComment} className="space-y-3">
                {/* Replying banner */}
                <AnimatePresence>
                  {replyingTo && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-between px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-[10px] text-indigo-700 dark:text-indigo-400 font-bold"
                    >
                      <div className="flex items-center gap-1.5">
                        <CornerDownRight size={12} />
                        <span>
                          {language === 'en' 
                            ? `Replying to ${replyingTo.userName}` 
                            : `${replyingTo.userName} को टिप्पणीको जवाफ दिँदै`}
                        </span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setReplyingTo(null)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      >
                        <X size={12} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Tag Selection Row (only for top-level comments) */}
                {!replyingTo && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">
                      {language === 'en' ? 'Note Category:' : 'टिप्पणी प्रकार:'}
                    </span>
                    {(['general', 'update', 'issue', 'question'] as CommentCategory[]).map((cat) => {
                      const isActive = selectedCategory === cat;
                      const styles = getCategoryStyles(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all flex items-center ${
                            isActive 
                              ? `${styles.bg} ${styles.border} ${styles.text} ring-1 ring-offset-1 ring-indigo-500 dark:ring-offset-slate-900`
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:border-slate-300'
                          }`}
                        >
                          {styles.icon}
                          {styles.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Input row */}
                <div className="flex items-end gap-3">
                  <div className="flex-1 relative bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-white/15 px-3.5 py-2.5 focus-within:ring-1 focus-within:ring-indigo-500 transition-shadow">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={
                        replyingTo 
                          ? (language === 'en' ? 'Type your reply...' : 'आफ्नो जवाफ लेख्नुहोस्...')
                          : (language === 'en' ? 'Write a note or start a discussion thread...' : 'नोट लेख्नुहोस् वा नयाँ छलफल सुरु गर्नुहोस्...')
                      }
                      rows={replyingTo ? 1 : 2}
                      className="w-full text-xs bg-transparent border-0 p-0 text-slate-800 dark:text-slate-150 placeholder-slate-400 focus:ring-0 focus:outline-none resize-none min-h-[24px] max-h-[80px]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !commentText.trim()}
                    className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-600/20 shrink-0"
                  >
                    {submitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-950/40 rounded-3xl border border-slate-150 dark:border-white/5 text-center sm:text-left">
                <div className="flex items-center gap-2.5">
                  <Lock size={16} className="text-slate-400" />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-normal">
                    {language === 'en' 
                      ? 'Collaboration features are locked. Sign in to post updates, attach notes, or reply.'
                      : 'छलफल सुविधाहरू बन्द छन्। नोट थप्न वा जवाफ दिन कृपया लगइन गर्नुहोस्।'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

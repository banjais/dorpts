import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BarChart3, Users, MapPin, Bell, Shield, Gauge, Activity, MessageSquare } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { fetchPublishedCsv, PUBLISHED_CSV_URLS } from '../utils/sheetSync';
import { parseCSVLine } from '../data';
import { FeedbackModal } from './FeedbackModal';

interface ViewerDashboardProps {
  language: 'en' | 'ne';
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const ViewerDashboard: React.FC<ViewerDashboardProps> = ({ language, activeTab: externalActiveTab, onTabChange }) => {
  const { user, isAdmin, isSuperadmin, userAssignedOffice } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [internalActiveTab, setInternalActiveTab] = useState('overview');

  const activeTab = externalActiveTab || internalActiveTab;
  const handleTabChange = onTabChange || setInternalActiveTab;

  const tabs = [
    { id: 'overview', labelEn: 'Overview', labelNp: 'सारांश', icon: <BarChart3 size={16} /> },
    { id: 'feedback', labelEn: 'Feedback', labelNp: 'प्रतिक्रिया', icon: <MessageSquare size={16} /> },
  ] as const;

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const activitiesSnap = await getDocs(query(collection(db, 'activities'), orderBy('timestamp', 'desc'), limit(100)));
      const recentActivities = activitiesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayActivities = recentActivities.filter((a: any) => {
        const ts = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
        return ts >= today;
      });

      setAnalyticsData({
        activeSessions: 1,
        todayLogins: todayActivities.filter((a: any) => a.actionType === 'login').length,
        todayActivities: todayActivities.length,
      });
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (activeTab === 'overview') await fetchAnalytics();
    };
    load();
  }, [activeTab]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Welcome Notice */}
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 rounded-xl p-4">
        <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
          {language === 'en' 
            ? `Welcome! You are viewing as a Viewer. ${user?.email ? `Signed in as: ${user.email}` : ''}`
            : `स्वागत छ! तपाईं दर्शकको रूपमा हेर्दै हुनुहुन्छ। ${user?.email ? `लगइन गरिएको: ${user.email}` : ''}`}
        </p>
      </div>

      {/* Notifications for Logged-in Viewers */}
      {user && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Bell size={18} className="text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-1">
                {language === 'en' ? 'Notifications' : 'सूचनाहरू'}
              </h4>
              <p className="text-[11px] text-blue-700 dark:text-blue-400">
                {language === 'en' 
                  ? 'You are logged in and will receive important updates. Check this section regularly for announcements.'
                  : 'तपाईं लगइन गरिएको हुनुहुन्छ र महत्वपूर्ण अपडेटहरू प्राप्त गर्नुहुन्छ। घोषणाहरूका लागि नियमित रूपमा यो सेक्सन जाँच गर्नुहोस्।'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-1.5 overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-200'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <span
                  className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {item.icon}
                </span>
                <span className="block text-[11px] font-bold leading-tight">
                  {language === 'en' ? item.labelEn : item.labelNp}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
            {language === 'en' ? 'Dashboard Overview' : 'ड्यासबोर्ड सारांश'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-6 border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                  <Users size={20} className="text-slate-400" />
                </div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  {language === 'en' ? "Today's Logins" : "आजको लगइनहरू"}
                </span>
              </div>
              <div className="text-5xl font-black text-slate-900 dark:text-white mb-2">
                {analyticsData?.todayLogins ?? 0}
              </div>
              <div className="text-[11px] text-slate-400">
                {language === 'en' ? 'Login events today' : 'आजको लगइन घटनाहरू'}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-6 border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                  <Activity size={20} className="text-slate-400" />
                </div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  {language === 'en' ? "Today's Activities" : "आजको गतिविधिहरू"}
                </span>
              </div>
              <div className="text-5xl font-black text-slate-900 dark:text-white mb-2">
                {analyticsData?.todayActivities ?? 0}
              </div>
              <div className="text-[11px] text-slate-400">
                {language === 'en' ? 'Total events today' : 'आजको कुल घटनाहरू'}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-6 border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                  <Gauge size={20} className="text-emerald-400" />
                </div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  {language === 'en' ? 'System Status' : 'प्रणाली स्थिति'}
                </span>
              </div>
              <div className="text-5xl font-black text-emerald-600 mb-2">
                {language === 'en' ? 'Online' : 'अनलाइन'}
              </div>
              <div className="text-[11px] text-slate-400">
                {language === 'en' ? 'All systems operational' : 'सबै प्रणालीहरू कार्यरत'}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'feedback' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
            {language === 'en' ? 'Send Feedback' : 'प्रतिक्रिया पठाउनुहोस्'}
          </h3>
          <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {language === 'en' 
                ? 'We value your feedback. Please share your thoughts, suggestions, or report any issues.'
                : 'हामी तपाईंको प्रतिक्रियालाई मूल्याङ्कन गर्छौं। कृपया आफ्नो विचार, सुझाव वा कुनै पनि समस्याहरू बारे जानकारी दिनुहोस्।'}
            </p>
            <FeedbackInline language={language} user={user} />
</div>
        </motion.div>
      )}
    </motion.div>
  );
};

const FeedbackInline: React.FC<{ language: string; user: any }> = ({ language, user }) => {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) return;
    
    // Check if user is logged in before submitting
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'user_feedback'), {
        message: feedback,
        timestamp: serverTimestamp(),
        userEmail: user?.email || 'anonymous',
        userId: user?.uid || 'anonymous',
      });
      setFeedback('');
      alert(language === 'en' ? 'Feedback submitted successfully!' : 'प्रतिक्रिया सफलतापूर्वक पठाइयो!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert(language === 'en' ? 'Failed to submit feedback.' : 'प्रतिक्रिया पठाउन असफल भयो।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      {showLoginPrompt && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4">
          <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-2">
            {language === 'en' ? 'Please sign in to submit feedback' : 'प्रतिक्रिया पठाउन कृपया साइन इन गर्नुहोस्'}
          </p>
          <p className="text-[10px] text-amber-600 dark:text-amber-400">
            {language === 'en' ? 'Click the Sign In button in the top right corner to login with Google.' : 'गूगलले लगइन गर्न कोनामा साइन इन बटन क्लिक गर्नुहोस्।'}
          </p>
        </div>
      )}
      
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        className="w-full h-32 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
        placeholder={language === 'en' ? 'Tell us your thoughts or report a bug...' : 'हामीलाई आफ्नो विचार वा बगको बारेमा जानकारी दिनुहोस्...'}
      />
      
      {user && (
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-lg px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
            {language === 'en' ? `Signed in as: ${user.email}` : `लगइन गरिएको: ${user.email}`}
          </span>
        </div>
      )}
      
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !feedback.trim()}
        className="w-full py-2 bg-emerald-600 text-white text-[10px] font-black rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            {language === 'en' ? 'Submitting...' : 'पठाउँदै...'}
          </>
        ) : (
          language === 'en' ? 'Submit Feedback' : 'प्रतिक्रिया पठाउनुहोस्'
        )}
      </button>
    </div>
  );
};
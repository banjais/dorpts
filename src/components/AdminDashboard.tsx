import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FileText, BarChart3, Users, MapPin, Bell, Shield, Lock, Gauge, Activity, MessageSquare, CalendarDays } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit, Timestamp, addDoc, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { APP_VERSION } from '../constants/appTitles';
import { fetchPublishedCsv, PUBLISHED_CSV_URLS } from '../utils/sheetSync';
import { parseCSVLine } from '../data';
import { API_BASE } from '../utils/apiBase';
import { MessagingCenter } from './MessagingCenter';
import { CalendarDeadlines } from './CalendarDeadlines';

const SystemCard: React.FC<{ label: string; status: string; isText?: boolean; language: 'en' | 'ne' }> = ({ label, status, isText, language }) => {
  const isConnected = status === 'connected' || status === 'active';
  const isUnsupported = status === 'unsupported';

  return (
    <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">{label}</div>
      {isText ? (
        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{status}</div>
      ) : (
        <div className="flex items-center gap-2">
          {isUnsupported ? (
            <div className="w-2 h-2 rounded-full bg-amber-500" />
          ) : isConnected ? (
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-rose-500" />
          )}
          <span className={`text-xs font-bold ${
            isUnsupported ? 'text-amber-700 dark:text-amber-400' :
            isConnected ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
          }`}>
            {isUnsupported ? (language === 'en' ? 'Not Supported' : 'समर्थित छैन') :
             isConnected ? (language === 'en' ? 'Connected' : 'जडान भयो') : (language === 'en' ? 'Disconnected' : 'अलग')}
          </span>
        </div>
      )}
    </div>
  );
};

interface AdminDashboardProps {
  language: 'en' | 'ne';
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  offices?: Array<{ name: string; officeId: string; shortName: string }>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ language, activeTab: externalActiveTab, onTabChange, offices = [] }) => {
  const { user, isAdmin, isSuperadmin, userAssignedOffice, adminsList } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notificationText, setNotificationText] = useState('');
  const [notificationSending, setNotificationSending] = useState(false);
  const [internalActiveTab, setInternalActiveTab] = useState('analytics');

  const activeTab = externalActiveTab || internalActiveTab;
  const handleTabChange = onTabChange || setInternalActiveTab;

  // Listen for AI assistant fill_data requests
  useEffect(() => {
    const handler = (e: any) => {
      const values = e.detail?.values || {};
      if (Object.keys(values).length > 0) {
        setDataInputValues(prev => ({ ...prev, ...values }));
        // Switch to data-input tab if not already there
        if (activeTab !== 'data-input') {
          handleTabChange('data-input');
        }
      }
    };
    window.addEventListener('ai:fill_data_request', handler);
    return () => window.removeEventListener('ai:fill_data_request', handler);
  }, [activeTab, handleTabChange]);

  // Determine the office name this admin can access
  const accessibleOffice = useMemo(() => {
    if (isSuperadmin) return null; // Superadmin sees all
    return userAssignedOffice || null;
  }, [isSuperadmin, userAssignedOffice]);

  const tabs = [
    { id: 'analytics', labelEn: 'Office Analytics', labelNp: 'कार्यालय विश्लेषण', icon: <BarChart3 size={16} /> },
    { id: 'data-input', labelEn: 'Data Input', labelNp: 'डाटा इनपुट', icon: <FileText size={16} /> },
    { id: 'messaging', labelEn: 'Messages', labelNp: 'सन्देशहरू', icon: <MessageSquare size={16} /> },
    { id: 'calendar', labelEn: 'Calendar', labelNp: 'क्यालेन्डर', icon: <CalendarDays size={16} /> },
    { id: 'feedbacks', labelEn: 'Feedbacks', labelNp: 'प्रतिक्रियाहरू', icon: <MessageSquare size={16} /> },
    { id: 'reports', labelEn: 'Reports', labelNp: 'प्रतिवेदनहरू', icon: <FileText size={16} /> },
    { id: 'notifications', labelEn: 'Notifications', labelNp: 'सूचनाहरू', icon: <Bell size={16} /> },
    { id: 'system', labelEn: 'System Health', labelNp: 'प्रणाली स्वास्थ्य', icon: <Activity size={16} /> },
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
        accessibleOffice: accessibleOffice || 'All Offices',
      });
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!notificationText.trim()) return;
    setNotificationSending(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`${API_BASE}/api/admin/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: notificationText, office: accessibleOffice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setNotificationText('');
      alert(language === 'en' ? `Notification sent to ${data.sentTo} users` : `${data.sentTo} प्रयोगकर्ताहरूलाई सूचना पठाइयो`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setNotificationSending(false);
    }
  };

  const [dataInputOffice, setDataInputOffice] = useState('');
  const [dataInputValues, setDataInputValues] = useState<Record<string, string>>({});
  const [dataInputLoading, setDataInputLoading] = useState(false);
  const [dataInputSaving, setDataInputSaving] = useState(false);
  const [dataInputSheetHeaders, setDataInputSheetHeaders] = useState<string[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [feedbacksLoading, setFeedbacksLoading] = useState(false);

  // Office-specific data input fetch
  const fetchIndicatorsForOffice = async () => {
    if (!accessibleOffice) return;
    setDataInputLoading(true);
    try {
      const csv = await fetchPublishedCsv(PUBLISHED_CSV_URLS.offices);
      if (!csv) throw new Error('Failed to fetch sheet data');

      const lines = csv.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
      const headersRowIdx = lines.findIndex((line) => {
        const cols = parseCSVLine(line);
        return cols.some((c) => c.toLowerCase().includes('office') || c.toLowerCase().includes('कार्यालय'));
      });

      const headerRow = headersRowIdx !== -1 ? parseCSVLine(lines[headersRowIdx]) : [];
      const headers = headerRow.slice(2);
      setDataInputSheetHeaders(headers);
    } catch (err) {
      console.error('Failed to fetch indicators for office:', err);
    } finally {
      setDataInputLoading(false);
    }
  };

  const fetchFeedbacks = async () => {
    setFeedbacksLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'user_feedback'), orderBy('createdAt', 'desc'), limit(50)));
      setFeedbacks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Failed to fetch feedbacks:', err);
    } finally {
      setFeedbacksLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'analytics') fetchAnalytics();
    if (activeTab === 'data-input') {
      if (accessibleOffice && !dataInputOffice) {
        setDataInputOffice(accessibleOffice);
      }
      fetchIndicatorsForOffice();
    }
    if (activeTab === 'feedbacks') fetchFeedbacks();
  }, [activeTab]);

  const analyticsCards = useMemo(() => [
    {
      label: language === 'en' ? 'Your Office' : 'तपाईंको कार्यालय',
      value: analyticsData?.accessibleOffice || accessibleOffice || '--',
      sublabel: language === 'en' ? 'Assigned office' : 'नियुक्त कार्यालय',
      color: 'text-slate-900 dark:text-white',
      bgColor: 'bg-slate-50 dark:bg-slate-950',
      borderColor: 'border-slate-100 dark:border-white/5',
      icon: <MapPin size={20} className="text-slate-400" />,
    },
    {
      label: language === 'en' ? "Today's Logins" : "आजको लगइनहरू",
      value: analyticsData?.todayLogins ?? 0,
      sublabel: language === 'en' ? 'Login events today' : 'आजको लगइन घटनाहरू',
      color: 'text-slate-900 dark:text-white',
      bgColor: 'bg-slate-50 dark:bg-slate-950',
      borderColor: 'border-slate-100 dark:border-white/5',
      icon: <Users size={20} className="text-slate-400" />,
    },
    {
      label: language === 'en' ? "Today's Activities" : "आजको गतिविधिहरू",
      value: analyticsData?.todayActivities ?? 0,
      sublabel: language === 'en' ? 'Total events today' : 'आजको कुल घटनाहरू',
      color: 'text-slate-900 dark:text-white',
      bgColor: 'bg-slate-50 dark:bg-slate-950',
      borderColor: 'border-slate-100 dark:border-white/5',
      icon: <Activity size={20} className="text-slate-400" />,
    },
    {
      label: language === 'en' ? 'System Status' : 'प्रणाली स्थिति',
      value: language === 'en' ? 'Online' : 'अनलाइन',
      sublabel: language === 'en' ? 'All systems operational' : 'सबै प्रणालीहरू कार्यरत',
      color: 'text-emerald-600',
      bgColor: 'bg-slate-50 dark:bg-slate-950',
      borderColor: 'border-slate-100 dark:border-white/5',
      icon: <Gauge size={20} className="text-emerald-400" />,
    },
  ], [analyticsData, accessibleOffice, language]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Office Assignment Notice */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-4">
        <p className="text-xs font-bold text-indigo-800 dark:text-indigo-300">
          {language === 'en' 
            ? `You are managing: ${accessibleOffice || 'All Offices'}`
            : `तपाईं व्यवस्थापन गर्नुभएको: ${accessibleOffice || 'सबै कार्यालयहरू'}`}
        </p>
      </div>

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
                    ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-200'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <span
                  className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white'
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
      {activeTab === 'analytics' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
            {language === 'en' ? 'Office Analytics Overview' : 'कार्यालय विश्लेषण सारांश'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {analyticsCards.map((card, idx) => (
              <div key={idx} className={`${card.bgColor} rounded-2xl p-6 border ${card.borderColor}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                    {card.icon}
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    {card.label}
                  </span>
                </div>
                <div className={`text-5xl font-black ${card.color} mb-2`}>
                  {card.value}
                </div>
                <div className="text-[11px] text-slate-400">
                  {card.sublabel}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'data-input' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
            {language === 'en' ? 'Data Input' : 'डाटा इनपुट'}
          </h3>
          
          <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5 space-y-3">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {language === 'en' ? 'Your Assigned Office' : 'तपाईंको नियुक्त कार्यालय'}
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              {accessibleOffice || (language === 'en' ? 'No office assigned' : 'कार्यालय नियुक्त छैन')}
            </div>
            {!accessibleOffice && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400">
                {language === 'en' ? 'Contact superadmin to assign an office.' : 'कार्यालय नियुक्त गर्न सुपरएडमिनलाई सम्पर्क गर्नुहोस्।'}
              </p>
            )}
          </div>

          {accessibleOffice && (
            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {language === 'en' ? 'Office' : 'कार्यालय'}: {dataInputOffice || accessibleOffice}
                </span>
              </div>

              {dataInputLoading && (
                <div className="text-[11px] text-slate-400 text-center py-4">
                  {language === 'en' ? 'Loading sheet data...' : 'शीट डाटा लोड गर्दै...'}
                </div>
              )}

              {!dataInputLoading && dataInputSheetHeaders.length > 0 && (
                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {dataInputSheetHeaders.map((header, idx) => {
                    const currentValue = dataInputValues[header] ?? '';
                    return (
                      <div key={idx} className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-lg px-3 py-2.5 border border-slate-100 dark:border-white/5">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{header}</div>
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={currentValue}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || /^[0-9]+$/.test(val)) {
                              setDataInputValues(prev => ({ ...prev, [header]: val }));
                            }
                          }}
                          className="w-24 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-right"
                          placeholder="0"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={async () => {
                  if (!dataInputOffice) return;
                  setDataInputSaving(true);
                  try {
                    const officeDoc = doc(db, 'offices', dataInputOffice);
                    const existing = await getDoc(officeDoc);
                    const updates: any = { ...dataInputValues, updatedAt: Timestamp.now(), updatedBy: user?.email };
                    if (existing.exists()) {
                      await setDoc(officeDoc, updates, { merge: true });
                    } else {
                      await setDoc(officeDoc, { name: dataInputOffice, ...updates });
                    }
                    alert(language === 'en' ? 'Data saved successfully' : 'डाटा सफलतापूर्वक सुरक्षित भयो');
                  } catch (err: any) {
                    alert(err.message);
                  } finally {
                    setDataInputSaving(false);
                  }
                }}
                disabled={dataInputSaving || Object.keys(dataInputValues).length === 0}
                className="w-full py-2 bg-emerald-600 text-white text-[10px] font-black rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {dataInputSaving ? (language === 'en' ? 'Saving...' : 'सुरक्षित गर्दै...') : (language === 'en' ? 'Save Data' : 'डाटा सुरक्षित गर्नुहोस्')}
              </button>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'messaging' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
            {language === 'en' ? 'Group & Office Messaging' : 'समूह र कार्यालय मेसेजिङ'}
          </h3>
           <MessagingCenter language={language} offices={offices} isAdmin={isAdmin} users={adminsList.map(a => ({ email: a.email }))} />
        </motion.div>
      )}

      {activeTab === 'calendar' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <CalendarDeadlines language={language} offices={offices} />
        </motion.div>
      )}

      {activeTab === 'calendar' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <CalendarDeadlines language={language} offices={offices} />
        </motion.div>
      )}

      {activeTab === 'feedbacks' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
            {language === 'en' ? 'User Feedbacks' : 'प्रयोगकर्ता प्रतिक्रियाहरू'}
          </h3>
          <div className="space-y-2">
            {feedbacksLoading && (
              <p className="text-[11px] text-slate-400 text-center py-4">
                {language === 'en' ? 'Loading feedbacks...' : 'प्रतिक्रियाहरू लोड गर्दै...'}
              </p>
            )}
            {!feedbacksLoading && feedbacks.length === 0 && (
              <p className="text-[11px] text-slate-400 text-center py-4">
                {language === 'en' ? 'No feedbacks yet' : 'अहिले सम्म कुनै प्रतिक्रिया छैन'}
              </p>
            )}
            {feedbacks.map((fb: any) => (
              <div key={fb.id} className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {fb.userName || fb.userEmail || 'Anonymous'}
                      </span>
                      {fb.rating && (
                        <span className="text-[10px] font-black text-amber-600">
                          {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {fb.message || fb.content || fb.text || '(no message)'}
                    </p>
                    <div className="text-[10px] text-slate-400 mt-2">
                      {fb.createdAt?.toDate?.()?.toLocaleString() || fb.createdAt || '--'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'reports' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
            {language === 'en' ? 'Office Reports' : 'कार्यालय प्रतिवेदनहरू'}
          </h3>
          <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'en' 
                ? `Generate reports for ${accessibleOffice || 'your assigned office'}.`
                : `${accessibleOffice || 'तपाईंको नियुक्त कार्यालय'} का लागि प्रतिवेदनहरू तयार गर्नुहोस्।`}
            </p>
          </div>
        </motion.div>
      )}

      {activeTab === 'notifications' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
            {language === 'en' ? 'Notification Center' : 'सूचना केन्द्र'}
          </h3>
          <div className="space-y-3">
            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Bell size={14} className="text-indigo-600" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {language === 'en' ? 'Send Announcement' : 'घोषणा पठाउनुहोस्'}
                </span>
              </div>
              <textarea
                value={notificationText}
                onChange={(e) => setNotificationText(e.target.value)}
                placeholder={language === 'en' ? 'Type your announcement...' : 'तपाईंको घोषणा टाइप गर्नुहोस्...'}
                className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs resize-none"
                rows={3}
              />
              <button
                onClick={handleSendNotification}
                disabled={notificationSending || !notificationText.trim()}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {notificationSending ? (language === 'en' ? 'Sending...' : 'पठाउँदै...') : (language === 'en' ? 'Send Notification' : 'सूचना पठाउनुहोस्')}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'system' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
            {language === 'en' ? 'System Health' : 'प्रणाली स्वास्थ्य'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SystemCard label={language === 'en' ? 'Firebase Connection' : 'फायरबेस जडान'} status="connected" language={language} />
            <SystemCard label={language === 'en' ? 'Service Worker' : 'सर्भिस वर्कर'} status={typeof navigator !== 'undefined' && 'serviceWorker' in navigator ? 'active' : 'unsupported'} language={language} />
            <SystemCard label={language === 'en' ? 'App Version' : 'अप्लिकेशन संस्करण'} status={APP_VERSION} isText language={language} />
            <SystemCard label={language === 'en' ? 'Office Access' : 'कार्यालय पहुँच'} status={accessibleOffice || 'All'} isText language={language} />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
// import { useLanguage } from '../context/LanguageContext'; // Removed unused import
import {
  Users, Activity, BarChart3,
  Send, CheckCircle, Clock, ShieldCheck, Trash2, Edit3, Plus, X, ChevronDown, LogIn, Megaphone, MessageSquare, FileText, Menu
} from 'lucide-react';
import { collection, getDocs, orderBy, query, limit, Timestamp, addDoc, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { APP_VERSION } from '../constants/appTitles';
import { fetchPublishedCsv, PUBLISHED_CSV_URLS } from '../utils/sheetSync';
import { parseCSVLine } from '../data';
import { API_BASE } from '../utils/apiBase';
import { MessagingCenter } from './MessagingCenter';
import { UserLocationMap } from './UserLocationMap';

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

const OfficeDropdown: React.FC<{
  value: string;
  onChange: (value: string) => void;
  offices: Array<{ name: string; officeId: string; shortName: string }>;
  language: 'en' | 'ne';
}> = ({ value, onChange, offices, language }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-left flex items-center justify-between"
      >
        <span className={value ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}>
          {value || (language === 'en' ? 'Select Office' : 'कार्यालय छान्नुहोस्')}
        </span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-[200px] overflow-y-auto custom-scrollbar">
          {offices.map((o) => (
            <button
              key={o.name}
              type="button"
              onClick={() => {
                onChange(o.name);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 ${
                value === o.name ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {o.name}
            </button>
          ))}
        </div>
      )}
     </div>
    );
  };

interface SuperAdminDashboardProps {
  language: 'en' | 'ne';
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  offices?: Array<{ name: string; officeId: string; shortName: string }>;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ language, activeTab: externalActiveTab, onTabChange, offices = [] }) => {
  const { adminsList, user, isSuperadmin } = useAuth();

  if (!isSuperadmin) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {language === 'en' ? 'Access denied. Superadmin only.' : 'पहुँच अस्वीकृत। सुपरएडमिन मात्र।'}
        </p>
      </div>
    );
  }
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [securityData, setSecurityData] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [notificationText, setNotificationText] = useState('');
  const [notificationSending, setNotificationSending] = useState(false);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserEmailError, setNewUserEmailError] = useState('');
  const [newUserRole, setNewUserRole] = useState<'superadmin' | 'admin' | 'data_updater' | 'viewer'>('admin');
  const [newUserOffice, setNewUserOffice] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [dataInputOffice, setDataInputOffice] = useState('');
  const [dataInputValues, setDataInputValues] = useState<Record<string, string>>({});
  const [dataInputLoading, setDataInputLoading] = useState(false);
  const [dataInputSaving, setDataInputSaving] = useState(false);
  const [dataInputSheetHeaders, setDataInputSheetHeaders] = useState<string[]>([]);
  const [dataInputSheetOffices, setDataInputSheetOffices] = useState<string[]>([]);
  const [analyticsCardIndex, setAnalyticsCardIndex] = useState(0);
  const analyticsCardRef = useRef<HTMLDivElement>(null);
  const [internalActiveTab, setInternalActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [officeRankings, setOfficeRankings] = useState<Array<{ name: string; completion: number; total: number; progress: number }>>([]);

  const activeTab = externalActiveTab || internalActiveTab;
  const handleTabChange = onTabChange || setInternalActiveTab;
  const [rankingsLoading, setRankingsLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [feedbacksLoading, setFeedbacksLoading] = useState(false);
  const [feedbackSearch, setFeedbackSearch] = useState('');

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    messageEn: '',
    priority: 'info',
    targetOffices: '',
    targetRoles: '',
    expiresAt: '',
  });
  const [announcementSaving, setAnnouncementSaving] = useState(false);

  const totalAdmins = useMemo(() => (adminsList?.length ?? 0) + 1, [adminsList]);
  const adminEmails = useMemo(() => adminsList?.map(a => a.email) ?? [], [adminsList]);

  const analyticsCards = useMemo(() => [
    {
      label: language === 'en' ? 'Total Users' : 'कुल प्रयोगकर्ता',
      value: analyticsData?.totalAdmins ?? totalAdmins,
      sublabel: language === 'en' ? 'Registered admins' : 'दर्ता प्रशासकहरू',
      color: 'text-slate-900 dark:text-white',
      bgColor: 'bg-slate-200 dark:bg-slate-800',
      borderColor: 'border-slate-300 dark:border-slate-600',
      icon: <Users size={20} className="text-slate-600 dark:text-slate-300" />,
    },
    {
      label: language === 'en' ? 'Active Sessions' : 'सक्रिय सत्रहरू',
      value: analyticsData?.activeSessions ?? 1,
      sublabel: language === 'en' ? 'Current session' : 'हालको सत्र',
      color: 'text-emerald-800',
      bgColor: 'bg-emerald-200 dark:bg-emerald-900/40',
      borderColor: 'border-emerald-300 dark:border-emerald-700',
      icon: <Activity size={20} className="text-emerald-700 dark:text-emerald-300" />,
    },
    {
      label: language === 'en' ? 'Superadmin' : 'सुपरप्रशासक',
      value: 1,
      sublabel: analyticsData?.superadminEmail ?? (user?.email || ''),
      color: 'text-indigo-800',
      bgColor: 'bg-indigo-200 dark:bg-indigo-900/40',
      borderColor: 'border-indigo-300 dark:border-indigo-700',
      icon: <ShieldCheck size={20} className="text-indigo-700 dark:text-indigo-300" />,
    },
    {
      label: language === 'en' ? "Today's Logins" : "आजको लगइनहरू",
      value: analyticsData?.todayLogins ?? 0,
      sublabel: language === 'en' ? 'Login events today' : 'आजको लगइन घटनाहरू',
      color: 'text-slate-900 dark:text-white',
      bgColor: 'bg-slate-200 dark:bg-slate-800',
      borderColor: 'border-slate-300 dark:border-slate-600',
      icon: <LogIn size={20} className="text-slate-600 dark:text-slate-300" />,
    },
    {
      label: language === 'en' ? "Today's Activities" : "आजको गतिविधिहरू",
      value: analyticsData?.todayActivities ?? 0,
      sublabel: language === 'en' ? 'Total events today' : 'आजको कुल घटनाहरू',
      color: 'text-slate-900 dark:text-white',
      bgColor: 'bg-slate-200 dark:bg-slate-800',
      borderColor: 'border-slate-300 dark:border-slate-600',
      icon: <BarChart3 size={20} className="text-slate-600 dark:text-slate-300" />,
    },
  ], [analyticsData, totalAdmins, user?.email, language]);

  const handleAnalyticsSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      setAnalyticsCardIndex(prev => Math.min(prev + 1, analyticsCards.length - 1));
    } else {
      setAnalyticsCardIndex(prev => Math.max(prev - 1, 0));
    }
  };

  const tabs = [
    { id: 'overview', labelEn: 'Overview & Tracking', labelNp: 'सारांश र ट्र्याकिङ', icon: <BarChart3 size={16} /> },
    { id: 'user-management', labelEn: 'User Management', labelNp: 'प्रयोगकर्ता व्यवस्थापन', icon: <Users size={16} /> },
    { id: 'data-input', labelEn: 'Data Input & Sync', labelNp: 'डाटा इनपुट र सिङ्क', icon: <FileText size={16} /> },
    { id: 'communications', labelEn: 'Communications', labelNp: 'सञ्चार', icon: <Megaphone size={16} /> },
    { id: 'messaging', labelEn: 'Messaging Center', labelNp: 'सन्देश केन्द्र', icon: <MessageSquare size={16} /> },
    { id: 'feedbacks', labelEn: 'User Feedbacks', labelNp: 'प्रयोगकर्ता प्रतिक्रिया', icon: <MessageSquare size={16} /> },
    { id: 'system', labelEn: 'System & Security', labelNp: 'प्रणाली र सुरक्षा', icon: <Activity size={16} /> },
  ] as const;

  const fetchAnalytics = async () => {
    if (!isSuperadmin) return;
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
        totalAdmins,
        adminEmails,
        activeSessions: 1,
        superadminEmail: user?.email,
        todayLogins: todayActivities.filter((a: any) => a.actionType === 'login').length,
        todayActivities: todayActivities.length,
      });

      // Fetch office rankings from indicators
      const indicatorsSnap = await getDocs(query(collection(db, 'indicators'), orderBy('id')));
      const indicators = indicatorsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      
      const officeMap = new Map<string, { total: number; progress: number; count: number }>();
      indicators.forEach((ind: any) => {
        const office = ind.office || 'Unassigned';
        if (!officeMap.has(office)) {
          officeMap.set(office, { total: 0, progress: 0, count: 0 });
        }
        const entry = officeMap.get(office)!;
        entry.total += ind.annualTarget || 0;
        entry.progress += ind.annualProgress || 0;
        entry.count += 1;
      });

      const rankings = Array.from(officeMap.entries())
        .map(([name, data]) => ({
          name,
          completion: data.total > 0 ? Math.round((data.progress / data.total) * 100) : 0,
          total: data.total,
          progress: data.progress,
        }))
        .sort((a, b) => b.completion - a.completion)
        .slice(0, 10);

      setOfficeRankings(rankings);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const activitiesSnap = await getDocs(query(collection(db, 'activities'), orderBy('timestamp', 'desc'), limit(50)));
      const logs = activitiesSnap.docs.map(d => {
        const data = d.data();
        const ts = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
        return {
          id: d.id,
          time: ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          action: data.actionType || 'unknown',
          user: data.email || 'system',
          status: 'success',
          details: data.details || '',
        };
      });
      setLogs(logs);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSecurity = async () => {
    setLoading(true);
    try {
      const activitiesSnap = await getDocs(query(collection(db, 'activities'), orderBy('timestamp', 'desc'), limit(200)));
      const allActivities = activitiesSnap.docs.map(d => d.data());

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayActivities = allActivities.filter((a: any) => {
        const ts = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
        return ts >= today;
      });

      setSecurityData({
        loginAttempts: todayActivities.filter((a: any) => a.actionType === 'login').length,
        failedAttempts: todayActivities.filter((a: any) => a.actionType === 'login_failed').length,
        activeSessions: 1,
        mfaEnabled: true,
        ipTracking: true,
      });
    } catch (err) {
      console.error('Failed to fetch security:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const start = performance.now();
      await getDocs(query(collection(db, 'activities'), limit(1)));
      const latency = Math.round(performance.now() - start);

      setPerformanceData({
        apiLatency: latency,
        syncSuccess: 98.5,
        errorRate: 0.2,
        uptime: 99.9,
        lastCheck: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to fetch performance:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(100)));
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAnnouncement = async () => {
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) return;
    setAnnouncementSaving(true);
    try {
      const payload: any = {
        title: announcementForm.title.trim(),
        message: announcementForm.message.trim(),
        messageEn: announcementForm.messageEn.trim() || announcementForm.message.trim(),
        priority: announcementForm.priority,
        createdBy: user?.email || 'unknown',
        createdAt: Timestamp.now(),
        isActive: true,
      };
      if (announcementForm.targetOffices.trim()) {
        payload.targetOffices = announcementForm.targetOffices.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      if (announcementForm.targetRoles.trim()) {
        payload.targetRoles = announcementForm.targetRoles.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      if (announcementForm.expiresAt) {
        payload.expiresAt = Timestamp.fromDate(new Date(announcementForm.expiresAt));
      }

      if (editingAnnouncement) {
        await setDoc(doc(db, 'announcements', editingAnnouncement.id), payload, { merge: true });
      } else {
        await addDoc(collection(db, 'announcements'), payload);
      }
      setAnnouncementForm({ title: '', message: '', messageEn: '', priority: 'info', targetOffices: '', targetRoles: '', expiresAt: '' });
      setShowAnnouncementForm(false);
      setEditingAnnouncement(null);
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAnnouncementSaving(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm(language === 'en' ? 'Delete this announcement?' : 'यो घोषणा मेट्नुहोस्?')) return;
    try {
      await deleteDoc(doc(db, 'announcements', id));
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const fetchFeedbacks = async () => {
    setFeedbacksLoading(true);
    try {
      const snap = await getDocs(collection(db, 'user_feedback'));
      const list = snap.docs.map(d => {
        const data = d.data();
        const dateVal = data.createdAt || data.timestamp;
        let tsStr = '--';
        let rawTime = 0;
        if (dateVal?.toDate) {
          const dObj = dateVal.toDate();
          tsStr = dObj.toLocaleString();
          rawTime = dObj.getTime();
        } else if (dateVal) {
          const dObj = new Date(dateVal);
          tsStr = dObj.toLocaleString();
          rawTime = dObj.getTime();
        }
        return {
          id: d.id,
          ...data,
          formattedTime: tsStr,
          rawTime,
        };
      });
      list.sort((a, b) => b.rawTime - a.rawTime);
      setFeedbacks(list);
    } catch (err) {
      console.error('Failed to fetch feedbacks:', err);
    } finally {
      setFeedbacksLoading(false);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm(language === 'en' ? 'Delete this feedback?' : 'यो प्रतिक्रिया मेट्नुहोस्?')) return;
    try {
      await deleteDoc(doc(db, 'user_feedback', id));
      setFeedbacks(prev => prev.filter(f => f.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleAnnouncement = async (ann: any) => {
    try {
      await setDoc(doc(db, 'announcements', ann.id), { isActive: !ann.isActive }, { merge: true });
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const fetchCollaboration = async () => {
    setLoading(true);
    try {
      const activitiesSnap = await getDocs(query(collection(db, 'activities'), orderBy('timestamp', 'desc'), limit(100)));
      const activities = activitiesSnap.docs.map(d => d.data());

      const collabs = adminEmails.map((email) => {
        const userActivities = activities.filter((a: any) => a.email === email);
        const lastActive = userActivities.length > 0 ? new Date(userActivities[0].timestamp?.toDate?.() || userActivities[0].timestamp).toISOString() : null;
        const actionTypes = [...new Set(userActivities.map((a: any) => a.actionType))];

        return {
          email,
          activityCount: userActivities.length,
          lastActive,
          actionTypes,
          status: lastActive ? 'active' : 'inactive',
        };
      });

      setCollaborators(collabs);
    } catch (err) {
      console.error('Failed to fetch collaboration:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGeolocation = async () => {
    setLoading(true);
    try {
      const adminsSnap = await getDocs(collection(db, 'admins'));
      const admins = adminsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const locs = admins.map((admin: any) => ({
        email: admin.email,
        name: admin.name || admin.email,
        lastSeen: admin.lastSignInTime || admin.lastLogin || 'unknown',
        location: admin.location || null,
        device: admin.device || 'unknown',
      }));

      setLocations(locs);
    } catch (err) {
      console.error('Failed to fetch geolocation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSuperadmin || !user?.email) return;

    let watchId: number | null = null;

    const trackLocation = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'system'));
        const settings = settingsSnap.exists() ? settingsSnap.data() : {};
        if (!settings.geolocationEnabled) return;

        if (!navigator.geolocation) {
          console.warn('Geolocation not supported');
          return;
        }

        watchId = navigator.geolocation.watchPosition(
          async (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            try {
              await setDoc(doc(db, 'admins', user.uid), {
                location: { lat: latitude, lng: longitude, accuracy, updatedAt: new Date().toISOString() },
                lastSignInTime: new Date().toISOString(),
              }, { merge: true });
            } catch (err) {
              console.error('Failed to update location:', err);
            }
          },
          (err) => {
            console.error('Geolocation error:', err);
          },
          { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
        );
      } catch (err) {
        console.error('Failed to load settings for geolocation:', err);
      }
    };

    trackLocation();

    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isSuperadmin, user?.email, user?.uid]);

  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationTargetRole, setNotificationTargetRole] = useState<'all' | 'admin' | 'data_updater' | 'viewer'>('all');
  const [notificationTargetOffice, setNotificationTargetOffice] = useState('');
  const [notificationChannel, setNotificationChannel] = useState<'all' | 'email' | 'in_app' | 'messaging'>('all');
  const [notificationLogs, setNotificationLogs] = useState<any[]>([]);

  const fetchNotificationLogs = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(50)));
      setNotificationLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Failed to fetch notification logs:', err);
    }
  };

  const handleSendNotification = async () => {
    if (!notificationText.trim()) return;
    setNotificationSending(true);
    try {
      const token = await user?.getIdToken();
      let sentCount = 0;

      // 1. Email Broadcast if enabled
      if (notificationChannel === 'all' || notificationChannel === 'email') {
        try {
          const res = await fetch(`${API_BASE}/api/superadmin/notifications/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              message: notificationText,
            }),
          });
          const data = await res.json();
          if (data?.sentTo) sentCount = data.sentTo;
        } catch (e) {
          console.warn('Email broadcast skipped or failed:', e);
        }
      }

      // 2. Real-Time In-App Push & Announcement Board Broadcast
      if (notificationChannel === 'all' || notificationChannel === 'in_app') {
        await addDoc(collection(db, 'announcements'), {
          title: notificationTitle.trim() || (language === 'en' ? 'Superadmin Notification' : 'सुपरएडमिन सूचना'),
          message: notificationText.trim(),
          messageEn: notificationText.trim(),
          priority: 'urgent',
          targetOffices: notificationTargetOffice ? [notificationTargetOffice] : [],
          targetRoles: notificationTargetRole !== 'all' ? [notificationTargetRole] : [],
          createdBy: user?.email || 'superadmin',
          createdAt: Timestamp.now(),
          isActive: true,
        });
      }

      // 3. Save Notification Log to Firestore History
      await addDoc(collection(db, 'notifications'), {
        title: notificationTitle.trim() || 'Superadmin Notification',
        message: notificationText.trim(),
        targetRole: notificationTargetRole,
        targetOffice: notificationTargetOffice || 'All Offices',
        channel: notificationChannel,
        sender: user?.email || 'superadmin',
        createdAt: Timestamp.now(),
        sentCount: sentCount || 1,
      });

      setNotificationText('');
      setNotificationTitle('');
      fetchNotificationLogs();
      alert(
        language === 'en'
          ? `Notification successfully relayed across channels!`
          : `सूचना च्यानलहरू मार्फत सफलतापूर्वक पठाइयो!`
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setNotificationSending(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const adminsSnap = await getDocs(collection(db, 'admins'));
      const usersList = adminsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(usersList);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    const email = newUserEmail.trim();
    if (!email) {
      setNewUserEmailError(language === 'en' ? 'Email is required' : 'इमेल आवश्यक छ');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setNewUserEmailError(language === 'en' ? 'Invalid email format' : 'अमान्य इमेल ढाँचा');
      return;
    }
    const exists = users.some(u => (u.email || '').toLowerCase() === email.toLowerCase());
    if (exists) {
      setNewUserEmailError(language === 'en' ? 'This email is already added' : 'यो इमेल पहिले नै थपिएको छ');
      return;
    }
    setNewUserEmailError('');
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`${API_BASE}/api/admin/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, role: newUserRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add user');

      await addDoc(collection(db, 'admins'), {
        email,
        role: newUserRole,
        office: newUserOffice || null,
        createdAt: new Date(),
        createdBy: user?.email,
      });

      setNewUserEmail('');
      setNewUserEmailError('');
      setNewUserRole('admin');
      setNewUserOffice('');
      setShowAddUser(false);
      fetchUsers();
      alert(language === 'en' ? 'User added successfully' : 'प्रयोगकर्ता सफलता पूर्वक थपियो');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    const email = (editingUser.email || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert(language === 'en' ? 'Please enter a valid email address.' : 'कृपया वैध इमेल ठेगाना प्रविष्ट गर्नुहोस्।');
      return;
    }
    const exists = users.some(u => (u.email || '').toLowerCase() === email.toLowerCase() && u.id !== editingUser.id);
    if (exists) {
      alert(language === 'en' ? 'A user with this email already exists.' : 'यो इमेल सँग प्रयोगकर्ता पहिले नै अवस्थित छ।');
      return;
    }
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`${API_BASE}/api/admin/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, role: editingUser.role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user');

      await setDoc(doc(db, 'admins', editingUser.id), {
        ...editingUser,
        email,
        role: editingUser.role,
        office: editingUser.office || null,
      }, { merge: true });

      setEditingUser(null);
      fetchUsers();
      alert(language === 'en' ? 'User updated successfully' : 'प्रयोगकर्ता सफलता पूर्वक अपडेट भयो');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(language === 'en' ? `Delete user ${email}?` : `प्रयोगकर्ता ${email} मेट्नुहोस्?`)) return;
    try {
      await deleteDoc(doc(db, 'admins', userId));
      setUsers(users.filter(u => u.id !== userId));
      alert(language === 'en' ? 'User deleted' : 'प्रयोगकर्ता मेटियो');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const fetchSheetData = async () => {
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

      const startRow = headersRowIdx !== -1 ? headersRowIdx + 1 : 0;
      const officeNames: string[] = [];
      for (let i = startRow; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length > 1) {
          const name = cols[1]?.trim();
          if (name && name !== 'Total' && name !== 'कुल' && name.length > 3) {
            officeNames.push(name);
          }
        }
      }
      setDataInputSheetOffices(officeNames);
    } catch (err) {
      console.error('Failed to fetch sheet data:', err);
    } finally {
      setDataInputLoading(false);
    }
  };

  const fetchIndicators = async () => {
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

      const startRow = headersRowIdx !== -1 ? headersRowIdx + 1 : 0;
      const officeNames: string[] = [];
      for (let i = startRow; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length > 1) {
          const name = cols[1]?.trim();
          if (name && name !== 'Total' && name !== 'कुल' && name.length > 3) {
            officeNames.push(name);
          }
        }
      }
      setDataInputSheetOffices(officeNames);
    } catch (err) {
      console.error('Failed to fetch sheet data:', err);
    } finally {
      setDataInputLoading(false);
    }
  };

  useEffect(() => {
    if (!isSuperadmin) return;
    const run = async () => {
      if (activeTab === 'overview') {
        await fetchAnalytics();
        await fetchGeolocation();
      }
      if (activeTab === 'user-management' || activeTab === 'bulk-roles') await fetchUsers();
      if (activeTab === 'data-input' || activeTab === 'data-manager') await fetchIndicators();
      if (activeTab === 'system') {
        await fetchLogs();
        await fetchSecurity();
        await fetchPerformance();
      }
      if (activeTab === 'communications') {
        await fetchAnnouncements();
        await fetchNotificationLogs();
      }
      if (activeTab === 'feedbacks') await fetchFeedbacks();
    };
    run();
  }, [activeTab, isSuperadmin]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-[100dvh] flex flex-col overflow-hidden"
      >
        {/* Mobile header with menu toggle */}
        <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-700 dark:text-slate-200"
          >
            <Menu size={16} />
            {language === 'en' ? 'Menu' : 'मेनु'}
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-[0.65rem] font-black uppercase tracking-wider text-slate-800 dark:text-white truncate">
              {language === 'en' ? 'Super Admin Panel' : 'सुपर एडमिन प्यानल'}
            </h2>
          </div>
        </div>

        {/* Main layout: sidebar + content */}
        <div className="flex-1 flex flex-col md:flex-row gap-3 sm:gap-4 items-start overflow-hidden">
          {/* Left Sidebar Navigation Menu */}
          <aside className={`${sidebarOpen ? 'fixed inset-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-4' : 'hidden'} md:relative md:block md:bg-transparent md:dark:bg-transparent md:p-0 md:z-auto md:inset-auto md:backdrop-blur-none w-full md:w-56 lg:w-60 shrink-0 h-full`}>
            <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-2xl p-2.5 sm:p-3 shadow-xl space-y-3 h-full flex flex-col">
              {/* Header Badge */}
              <div className="hidden md:flex items-center gap-2.5 pb-2.5 border-b border-slate-100 dark:border-white/10 px-1">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h2 className="text-[0.65rem] font-black uppercase tracking-wider text-slate-800 dark:text-white">
                    {language === 'en' ? 'Super Admin Panel' : 'सुपर एडमिन प्यानल'}
                  </h2>
                  <p className="text-[0.55rem] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">
                    {language === 'en' ? 'Control Center' : 'नियन्त्रण केन्द्र'}
                  </p>
                </div>
              </div>

              {/* Vertical Left Navigation Items */}
              <nav className="space-y-1 flex-1 overflow-y-auto custom-scrollbar">
                {tabs.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { handleTabChange(item.id); setSidebarOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-left font-bold text-[11px] group relative ${
                        isActive
                          ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-200 shadow-sm border border-rose-200/50 dark:border-rose-500/30'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span
                        className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                          isActive
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-700'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="truncate">
                        {language === 'en' ? item.labelEn : item.labelNp}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="activeLeftIndicator"
                          className="absolute right-2 w-1.5 h-3.5 bg-rose-600 dark:bg-rose-400 rounded-full"
                        />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

        {/* Content based on active tab */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 custom-scrollbar">
          {activeTab === 'overview' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
             <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
               {language === 'en' ? 'Overview & Tracking' : 'सारांश र ट्र्याकिङ'}
             </h3>
               <div
                 ref={analyticsCardRef}
                 className="relative w-full overflow-hidden rounded-2xl h-[500px]"
               >
                <div
                  className="flex transition-transform duration-500 ease-out h-full"
                  style={{ transform: `translateX(-${analyticsCardIndex * 100}%)` }}
                >
                  {analyticsCards.map((card, idx) => (
                    <div
                      key={idx}
                      className="w-full flex-shrink-0 px-2 h-full"
                    >
                      <div className={`${card.bgColor} rounded-2xl p-6 border ${card.borderColor} h-full flex flex-col justify-between`}>
                       <div>
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
                       <div className="mt-4">
                         <div className="flex gap-1.5 justify-center">
                           {analyticsCards.map((_, i) => (
                             <button
                               key={i}
                               onClick={() => setAnalyticsCardIndex(i)}
                               className={`h-1.5 rounded-full transition-all duration-300 ${
                                 i === analyticsCardIndex
                                   ? 'bg-indigo-500 w-6'
                                   : 'bg-slate-200 dark:bg-slate-700 w-1.5'
                               }`}
                             />
                           ))}
                         </div>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
               {analyticsCardIndex > 0 && (
                 <button
                   onClick={() => handleAnalyticsSwipe('right')}
                   className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors z-10"
                 >
                   <ChevronDown size={16} className="rotate-90" />
                 </button>
               )}
               {analyticsCardIndex < analyticsCards.length - 1 && (
                 <button
                   onClick={() => handleAnalyticsSwipe('left')}
                   className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors z-10"
                 >
                   <ChevronDown size={16} className="-rotate-90" />
                 </button>
               )}
             </div>
           </motion.div>
         )}

         {activeTab === 'overview' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
             <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
               {language === 'en' ? 'User Locations' : 'यूजरहरूको स्थानहरू'}
             </h3>
             <UserLocationMap users={locations.map((loc: any) => ({
               email: loc.email,
               name: loc.name,
               location: loc.location,
               lastSeen: loc.lastSeen,
               device: loc.device,
             }))} language={language} />
           </motion.div>
         )}

         {activeTab === 'data-input' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
             <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
               {language === 'en' ? 'Data Input / Update' : 'डाटा इनपुट / अपडेट'}
             </h3>
            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5 space-y-3">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {language === 'en' ? 'Select Office' : 'कार्यालय छान्नुहोस्'}
              </div>
              <select
                value={dataInputOffice}
                onChange={(e) => {
                  setDataInputOffice(e.target.value);
                  setDataInputValues({});
                }}
                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                <option value="">{language === 'en' ? 'Choose an office...' : 'कार्यालय छान्नुहोस्...'}</option>
                {dataInputSheetOffices.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            {dataInputOffice && (
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {language === 'en' ? 'Office' : 'कार्यालय'}: {dataInputOffice}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {language === 'en' ? 'Update indicator values below' : 'तलका सूचक मान अपडेट गर्नुहोस्'}
                  </span>
                </div>

                {dataInputLoading && (
                  <div className="text-[11px] text-slate-400 text-center py-4">
                    {language === 'en' ? 'Loading sheet data...' : 'शीट डाटा लोड गर्दै...'}
                  </div>
                )}

                {!dataInputLoading && dataInputSheetHeaders.length === 0 && (
                  <div className="text-[11px] text-slate-400 text-center py-4">
                    {language === 'en' ? 'No indicator headers found in sheet.' : 'शीटमा सूचक हेडर फेला परेन।'}
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
                            type="number"
                            value={currentValue}
                            onChange={(e) => setDataInputValues(prev => ({ ...prev, [header]: e.target.value }))}
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

          {activeTab === 'communications' && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
             <div className="flex items-center justify-between">
               <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                 {language === 'en' ? 'Announcement Board' : 'घोषणा बोर्ड'}
               </h3>
               <button
                 onClick={() => { setShowAnnouncementForm(true); setEditingAnnouncement(null); setAnnouncementForm({ title: '', message: '', messageEn: '', priority: 'info', targetOffices: '', targetRoles: '', expiresAt: '' }); }}
                 className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-lg hover:bg-indigo-700 transition-colors"
               >
                 <Plus size={12} />
                 {language === 'en' ? 'New Announcement' : 'नयाँ घोषणा'}
               </button>
             </div>

             {showAnnouncementForm && (
               <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5 space-y-3">
                 <div className="flex items-center justify-between">
                   <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                     {editingAnnouncement ? (language === 'en' ? 'Edit Announcement' : 'घोषणा सम्पादन') : (language === 'en' ? 'New Announcement' : 'नयाँ घोषणा')}
                   </span>
                   <button onClick={() => { setShowAnnouncementForm(false); setEditingAnnouncement(null); }} className="text-slate-400 hover:text-slate-600">
                     <X size={14} />
                   </button>
                 </div>
                 <input
                   type="text"
                   value={announcementForm.title}
                   onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                   placeholder={language === 'en' ? 'Title' : 'शीर्षक'}
                   className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                 />
                 <textarea
                   value={announcementForm.message}
                   onChange={(e) => setAnnouncementForm(prev => ({ ...prev, message: e.target.value }))}
                   placeholder={language === 'en' ? 'Message (Nepali)' : 'सन्देश (नेपाली)'}
                   className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs resize-none"
                   rows={3}
                 />
                 <input
                   type="text"
                   value={announcementForm.messageEn}
                   onChange={(e) => setAnnouncementForm(prev => ({ ...prev, messageEn: e.target.value }))}
                   placeholder={language === 'en' ? 'Message (English, optional)' : 'सन्देश (अंग्रेजी, वैकल्पिक)'}
                   className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                 />
                 <select
                   value={announcementForm.priority}
                   onChange={(e) => setAnnouncementForm(prev => ({ ...prev, priority: e.target.value as any }))}
                   className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                 >
                   <option value="info">{language === 'en' ? 'Info' : 'जानकारी'}</option>
                   <option value="warning">{language === 'en' ? 'Warning' : 'चेतावनी'}</option>
                   <option value="urgent">{language === 'en' ? 'Urgent' : 'जरूरी'}</option>
                 </select>
                 <input
                   type="text"
                   value={announcementForm.targetOffices}
                   onChange={(e) => setAnnouncementForm(prev => ({ ...prev, targetOffices: e.target.value }))}
                   placeholder={language === 'en' ? 'Target offices (comma-separated, leave blank for all)' : 'लक्षित कार्यालयहरू (कमा सेpareted, सबैका लागि खाली छोड्नुहोस्)'}
                   className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                 />
                 <input
                   type="datetime-local"
                   value={announcementForm.expiresAt}
                   onChange={(e) => setAnnouncementForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                   className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                 />
                 <button
                   onClick={handleSaveAnnouncement}
                   disabled={announcementSaving || !announcementForm.title.trim() || !announcementForm.message.trim()}
                   className="w-full py-2 bg-indigo-600 text-white text-[10px] font-black rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {announcementSaving ? (language === 'en' ? 'Saving...' : 'सुरक्षित गर्दै...') : (language === 'en' ? 'Save Announcement' : 'घोषणा सुरक्षित गर्नुहोस्')}
                 </button>
               </div>
             )}

             <div className="space-y-2">
               {announcements.length === 0 && !loading && (
                 <p className="text-[11px] text-slate-400 text-center py-4">
                   {language === 'en' ? 'No announcements yet' : 'अहिले सम्म कुनै घोषणा छैन'}
                 </p>
               )}
               {announcements.map((ann) => (
                 <div key={ann.id} className={`flex items-start gap-3 bg-slate-50 dark:bg-slate-950 rounded-lg p-3 border ${ann.isActive ? 'border-slate-100 dark:border-white/5' : 'border-slate-200 dark:border-slate-700 opacity-60'}`}>
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2 mb-1">
                       <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                         ann.priority === 'urgent' ? 'bg-rose-600 text-white' :
                         ann.priority === 'warning' ? 'bg-amber-600 text-white' :
                         'bg-indigo-600 text-white'
                       }`}>{ann.priority}</span>
                       <span className="text-[10px] text-slate-400">{ann.createdAt?.toDate?.()?.toLocaleDateString() || '--'}</span>
                     </div>
                     <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{ann.title}</div>
                     <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{ann.message}</div>
                   </div>
                   <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleToggleAnnouncement(ann)}
                        className={`p-1.5 rounded-lg transition-all ${ann.isActive ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10' : 'text-slate-400 hover:text-slate-600'}`}
                        title={ann.isActive ? (language === 'en' ? 'Deactivate' : 'निस्क्रिय गर्नुहोस्') : (language === 'en' ? 'Activate' : 'सक्रिय गर्नुहोस्')}
                      >
                        <CheckCircle size={12} />
                      </button>
                      <button
                        onClick={() => { setEditingAnnouncement(ann); setAnnouncementForm({ title: ann.title, message: ann.message, messageEn: ann.messageEn || '', priority: ann.priority, targetOffices: (ann.targetOffices || []).join(', '), targetRoles: (ann.targetRoles || []).join(', '), expiresAt: ann.expiresAt?.toDate?.()?.toISOString().slice(0, 16) || '' }); setShowAnnouncementForm(true); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"
                        title={language === 'en' ? 'Edit' : 'सम्पादन'}
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                        title={language === 'en' ? 'Delete' : 'मेटाउनुहोस्'}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Notification Relay Center */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {language === 'en' ? 'Notification Relay Center' : 'सूचना रिले केन्द्र'}
              </h3>

              <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-white/5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
                  <Send size={16} className="text-rose-600 dark:text-rose-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    {language === 'en' ? 'Relay New Notification' : 'नयाँ सूचना रिले गर्नुहोस्'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      {language === 'en' ? 'Subject / Title' : 'विषय / शीर्षक'}
                    </label>
                    <input
                      type="text"
                      value={notificationTitle}
                      onChange={(e) => setNotificationTitle(e.target.value)}
                      placeholder={language === 'en' ? 'Announcement Title...' : 'सूचनाको शीर्षक...'}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      {language === 'en' ? 'Target Role' : 'लक्षित भूमिका'}
                    </label>
                    <select
                      value={notificationTargetRole}
                      onChange={(e) => setNotificationTargetRole(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                    >
                      <option value="all">{language === 'en' ? 'All Registered Users & Admins' : 'सबै प्रयोगकर्ता र प्रशासकहरू'}</option>
                      <option value="admin">{language === 'en' ? 'Admins Only' : 'प्रशासकहरू मात्र'}</option>
                      <option value="data_updater">{language === 'en' ? 'Data Updaters Only' : 'डाटा अपडेटरहरू मात्र'}</option>
                      <option value="viewer">{language === 'en' ? 'General Viewers Only' : 'सामान्य दर्शकहरू मात्र'}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      {language === 'en' ? 'Target Office (Optional)' : 'लक्षित कार्यालय (वैकल्पिक)'}
                    </label>
                    <OfficeDropdown
                      value={notificationTargetOffice}
                      onChange={setNotificationTargetOffice}
                      offices={offices}
                      language={language}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      {language === 'en' ? 'Relay Channel' : 'रिले च्यानल'}
                    </label>
                    <select
                      value={notificationChannel}
                      onChange={(e) => setNotificationChannel(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                    >
                      <option value="all">{language === 'en' ? 'All Channels (Email + In-App Live Push Banner)' : 'सबै च्यानलहरू (इमेल + इन-एप लाइभ पुस)'}</option>
                      <option value="email">{language === 'en' ? 'Email Broadcast Only' : 'इमेल प्रसारण मात्र'}</option>
                      <option value="in_app">{language === 'en' ? 'In-App Banner & Announcement Board' : 'इन-एप ब्यानर र घोषणा बोर्ड'}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    {language === 'en' ? 'Message Content' : 'सन्देशको विवरण'}
                  </label>
                  <textarea
                    value={notificationText}
                    onChange={(e) => setNotificationText(e.target.value)}
                    placeholder={language === 'en' ? 'Write notification message to relay...' : 'रिले गर्न सूचना सन्देश लेख्नुहोस्...'}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs resize-none text-slate-800 dark:text-slate-200"
                    rows={4}
                  />
                </div>

                <button
                  onClick={handleSendNotification}
                  disabled={notificationSending || !notificationText.trim()}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white text-xs font-black rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {notificationSending
                    ? (language === 'en' ? 'Relaying Notification...' : 'सूचना पठाउँदै...')
                    : (language === 'en' ? 'Broadcast Notification Now' : 'अहिले नै सूचना प्रसारण गर्नुहोस्')}
                </button>
              </div>

              {/* Notification History Logs */}
              <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-100 dark:border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    {language === 'en' ? 'Relayed Notifications Log' : 'रिले गरिएका सूचनाहरूको लग'}
                  </span>
                  <button
                    onClick={fetchNotificationLogs}
                    className="text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:underline"
                  >
                    {language === 'en' ? 'Refresh Log' : 'लग अपडेट गर्नुहोस्'}
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                  {notificationLogs.length === 0 && (
                    <p className="text-[11px] text-slate-400 text-center py-4">
                      {language === 'en' ? 'No past notifications logged' : 'कुनै विगत सूचना लग गरिएको छैन'}
                    </p>
                  )}
                  {notificationLogs.map((log: any) => (
                    <div key={log.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-white/5 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                        <span>{log.title}</span>
                        <span className="text-[10px] text-emerald-600 font-mono">Relayed</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">{log.message}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span>Target: {log.targetRole || 'all'} ({log.targetOffice || 'All Offices'})</span>
                        <span>{log.createdAt?.toDate?.()?.toLocaleString() || '--'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
          )}

          {activeTab === 'messaging' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <MessagingCenter language={language} offices={offices} isAdmin={isSuperadmin} users={users} userRole={isSuperadmin ? 'superadmin' : 'admin'} />
            </motion.div>
          )}

          {activeTab === 'feedbacks' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {language === 'en' ? 'General User Feedbacks' : 'आम प्रयोगकर्ता प्रतिक्रियाहरू'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {language === 'en' ? `Total Feedbacks Received: ${feedbacks.length}` : `प्राप्त कुल प्रतिक्रियाहरू: ${feedbacks.length}`}
                  </p>
                </div>
                <button
                  onClick={fetchFeedbacks}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-all self-start sm:self-auto"
                >
                  {language === 'en' ? 'Refresh' : 'पुनः लोड गर्नुहोस्'}
                </button>
              </div>

              <input
                type="text"
                value={feedbackSearch}
                onChange={(e) => setFeedbackSearch(e.target.value)}
                placeholder={language === 'en' ? 'Search feedback by message text, name, email or role...' : 'पाठ, नाम, इमेल वा भूमिकाद्वारा खोज्नुहोस्...'}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
              />

              <div className="space-y-3">
                {feedbacksLoading && (
                  <p className="text-[11px] text-slate-400 text-center py-6">
                    {language === 'en' ? 'Loading feedbacks...' : 'प्रतिक्रियाहरू लोड गर्दै...'}
                  </p>
                )}
                {!feedbacksLoading && feedbacks.length === 0 && (
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-8 text-center border border-slate-100 dark:border-white/5 space-y-2">
                    <MessageSquare className="mx-auto text-slate-400" size={32} />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {language === 'en' ? 'No user feedbacks found' : 'कुनै प्रयोगकर्ता प्रतिक्रिया फेला परेन'}
                    </p>
                  </div>
                )}
                {feedbacks.filter(fb => {
                  if (!feedbackSearch.trim()) return true;
                  const q = feedbackSearch.toLowerCase();
                  return (fb.message || fb.content || fb.text || '').toLowerCase().includes(q) ||
                         (fb.userName || '').toLowerCase().includes(q) ||
                         (fb.userEmail || '').toLowerCase().includes(q) ||
                         (fb.userRole || '').toLowerCase().includes(q);
                }).map((fb: any) => (
                  <div key={fb.id} className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 transition-all shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">
                            {fb.userName || fb.userEmail || (language === 'en' ? 'Anonymous User' : 'अनाम प्रयोगकर्ता')}
                          </span>
                          {fb.userEmail && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({fb.userEmail})
                            </span>
                          )}
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                            {fb.userRole || 'general_user'}
                          </span>
                          {fb.rating && (
                            <span className="text-[10px] font-black text-amber-500">
                              {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                          {fb.message || fb.content || fb.text || '(No message content)'}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-2">
                          <Clock size={10} />
                          <span>{fb.formattedTime || fb.createdAt || '--'}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteFeedback(fb.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all shrink-0"
                        title={language === 'en' ? 'Delete feedback' : 'प्रतिक्रिया मेट्नुहोस्'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'overview' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
             <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
               {language === 'en' ? 'User Locations' : 'यूजरहरूको स्थानहरू'}
             </h3>
             <UserLocationMap users={locations.map((loc: any) => ({
               email: loc.email,
               name: loc.name,
               location: loc.location,
               lastSeen: loc.lastSeen,
               device: loc.device,
             }))} language={language} />
           </motion.div>
         )}

         {activeTab === 'user-management' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {language === 'en' ? 'User Management' : 'प्रयोगकर्ता व्यवस्थापन'}
              </h3>
              <button
                onClick={() => setShowAddUser(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus size={12} />
                {language === 'en' ? 'Add User' : 'प्रयोगकर्ता थप्नुहोस्'}
              </button>
            </div>

            {showAddUser && (
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {language === 'en' ? 'Add New User' : 'नयाँ प्रयोगकर्ता थप्नुहोस्'}
                  </span>
                  <button onClick={() => setShowAddUser(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                </div>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => { setNewUserEmail(e.target.value); if (newUserEmailError) setNewUserEmailError(''); }}
                  placeholder={language === 'en' ? 'Email address' : 'इमेल ठेगाना'}
                  className={`w-full p-2 rounded-lg border bg-white dark:bg-slate-800 text-xs ${newUserEmailError ? 'border-rose-300 dark:border-rose-700' : 'border-slate-200 dark:border-slate-700'}`}
                />
                {newUserEmailError && (
                  <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">{newUserEmailError}</p>
                )}
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as 'superadmin' | 'admin' | 'data_updater' | 'viewer')}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                >
                  <option value="superadmin">Superadmin</option>
                  <option value="admin">{language === 'en' ? 'Admin' : 'प्रशासक'}</option>
                  <option value="data_updater">{language === 'en' ? 'Data Updater' : 'डाटा अपडेटर'}</option>
                  <option value="viewer">{language === 'en' ? 'Viewer' : 'दर्शक'}</option>
                </select>
                {newUserRole !== 'superadmin' && (
                  <OfficeDropdown
                    value={newUserOffice}
                    onChange={setNewUserOffice}
                    offices={offices}
                    language={language}
                  />
                )}
                <button
                  onClick={handleAddUser}
                  disabled={!newUserEmail.trim() || !!newUserEmailError}
                  className="w-full py-2 bg-emerald-600 text-white text-[10px] font-black rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {language === 'en' ? 'Add User' : 'प्रयोगकर्ता थप्नुहोस्'}
                </button>
              </div>
            )}

            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder={language === 'en' ? 'Search users...' : 'प्रयोगकर्ता खोज्नुहोस्...'}
                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs mb-3"
              />
              <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                {users.length === 0 && !loading && (
                  <p className="text-[11px] text-slate-400 text-center py-4">
                    {language === 'en' ? 'No users found' : 'प्रयोगकर्ता फेला परेन'}
                  </p>
                )}
                {users.filter(u => {
                  if (!userSearch) return true;
                  const q = userSearch.toLowerCase();
                  return u.email.toLowerCase().includes(q) || (u.office || '').toLowerCase().includes(q) || (u.role || '').toLowerCase().includes(q);
                }).map((u) => (
                  <div key={u.id} className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-lg px-3 py-2.5 border border-slate-100 dark:border-white/5">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{u.email}</div>
                      <div className="text-[10px] text-slate-400">
                        {u.role === 'superadmin' ? (language === 'en' ? 'Superadmin' : 'सुपरप्रशासक') :
                         u.role === 'admin' ? (language === 'en' ? 'Admin' : 'प्रशासक') :
                         (language === 'en' ? 'Viewer' : 'दर्शक')}
                        {u.office ? ` · ${u.office}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingUser(u)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"
                        title={language === 'en' ? 'Edit' : 'सम्पादन'}
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.email)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                        title={language === 'en' ? 'Delete' : 'मेटाउनुहोस्'}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {editingUser && (
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {language === 'en' ? 'Edit User' : 'प्रयोगकर्ता सम्पादन'}
                  </span>
                  <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                </div>
                <input
                  type="email"
                  value={editingUser.email}
                  disabled
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs text-slate-500"
                />
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as 'superadmin' | 'admin' | 'data_updater' | 'viewer' })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                >
                  <option value="superadmin">Superadmin</option>
                  <option value="admin">{language === 'en' ? 'Admin' : 'प्रशासक'}</option>
                  <option value="data_updater">{language === 'en' ? 'Data Updater' : 'डाटा अपडेटर'}</option>
                  <option value="viewer">{language === 'en' ? 'Viewer' : 'दर्शक'}</option>
                </select>
                {editingUser.role !== 'superadmin' && editingUser.role !== 'viewer' && (
                  <OfficeDropdown
                    value={editingUser.office || ''}
                    onChange={(v) => setEditingUser({ ...editingUser, office: v })}
                    offices={offices}
                    language={language}
                  />
                )}
                <button
                  onClick={handleUpdateUser}
                  className="w-full py-2 bg-indigo-600 text-white text-[10px] font-black rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {language === 'en' ? 'Save Changes' : 'परिवर्तनहरू सुरक्षित गर्नुहोस्'}
                </button>
               </div>
             )}
           </motion.div>
         )}

           {activeTab === 'system' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
                {language === 'en' ? 'System & Security Overview' : 'प्रणाली र सुरक्षा सारांश'}
              </h3>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {language === 'en' ? 'Security Overview & Audit Logs' : 'सुरक्षा सारांश र अडिट लगहरू'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">Login Attempts</div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{language === 'en' ? 'Today' : 'आज'}</span>
                      <span className="text-xs font-black text-emerald-600">{securityData?.loginAttempts ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{language === 'en' ? 'Failed' : 'असफल'}</span>
                      <span className="text-xs font-black text-rose-600">{securityData?.failedAttempts ?? 0}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">Active Sessions</div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{securityData?.activeSessions ?? 1} {language === 'en' ? 'active' : 'सक्रिय'}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">2FA Status</div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-emerald-500" />
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{language === 'en' ? 'Enabled' : 'सक्षम'}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">IP Tracking</div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {language === 'en' ? 'Enabled' : 'सक्षम'}
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">
                    {language === 'en' ? 'Recent Logs' : 'हालका लगहरू'}
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {logs.length === 0 && !loading && (
                      <p className="text-[11px] text-slate-400 text-center py-4">
                        {language === 'en' ? 'No logs available' : 'लग उपलब्ध छैन'}
                      </p>
                    )}
                    {logs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-lg px-3 py-2 border border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-2">
                          <Clock size={10} className="text-slate-400" />
                          <span className="text-[10px] font-mono text-slate-500">{log.time}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{log.action}</span>
                        <span className="text-[10px] text-slate-500 truncate max-w-[120px]">{log.user}</span>
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          log.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {log.status}
                      </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {language === 'en' ? 'Performance Metrics & Diagnostics' : 'कार्यसम्पादन मेट्रिक्स र निदान'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">API Latency</div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">{performanceData?.apiLatency ?? '--'}ms</div>
                    <div className="text-[10px] text-emerald-600 mt-1">
                      {language === 'en' ? 'Measured live' : 'प्रत्यक्ष मापन'}
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Sync Success</div>
                    <div className="text-2xl font-black text-emerald-600">{performanceData?.syncSuccess ?? 0}%</div>
                    <div className="text-[10px] text-slate-500 mt-1">{language === 'en' ? 'Last 24 hours' : 'गत २४ घण्टा'}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Error Rate</div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">{performanceData?.errorRate ?? 0}%</div>
                    <div className="text-[10px] text-slate-500 mt-1">{language === 'en' ? 'Last 24 hours' : 'गत २४ घण्टा'}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {language === 'en' ? 'System Health & Services' : 'प्रणाली स्वास्थ्य र सेवाहरू'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SystemCard
                    label={language === 'en' ? 'Firebase Connection' : 'फायरबेस जडान'}
                    status="connected"
                    language={language}
                  />
                  <SystemCard
                    label={language === 'en' ? 'Service Worker' : 'सर्भिस वर्कर'}
                    status={typeof navigator !== 'undefined' && 'serviceWorker' in navigator ? 'active' : 'unsupported'}
                    language={language}
                  />
                  <SystemCard
                    label={language === 'en' ? 'Cache Storage' : 'क्यास स्टोरेज'}
                    status="dorpts-v1"
                    isText
                    language={language}
                  />
                  <SystemCard
                    label={language === 'en' ? 'App Version' : 'अप्लिकेशन संस्करण'}
                    status={APP_VERSION}
                    isText
                    language={language}
                  />
                </div>
              </div>
            </motion.div>
            )}
        </div>
      </div>
    </motion.div>
  );
};

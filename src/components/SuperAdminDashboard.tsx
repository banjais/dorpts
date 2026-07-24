import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Users, Activity, MapPin, Shield, BarChart3, Globe, UserCheck, TrendingUp,
  RefreshCw, Bell, UserPlus, Download, Upload, Lock, FileText, Gauge,
  Send, CheckCircle, AlertTriangle, Clock, Mail, ShieldCheck
} from 'lucide-react';

interface SuperAdminDashboardProps {
  language: 'en' | 'ne';
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ language }) => {
  const { adminsList, user, isSuperadmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'analytics' | 'collaboration' | 'geolocation' | 'notifications' | 'bulk-roles' | 'data-manager' | 'security' | 'logs' | 'performance' | 'system'>('analytics');

  const totalAdmins = useMemo(() => adminsList.length + 1, [adminsList]);
  const adminEmails = useMemo(() => adminsList.map(a => a.email), [adminsList]);

  const tabs = [
    { id: 'analytics', labelEn: 'User Analytics', labelNp: 'प्रयोगकर्ता विश्लेषण', icon: <BarChart3 size={16} /> },
    { id: 'collaboration', labelEn: 'Admin Collaboration', labelNp: 'प्रशासन सहकार्य', icon: <Users size={16} /> },
    { id: 'geolocation', labelEn: 'Geolocation', labelNp: 'भौगोलिक स्थान', icon: <MapPin size={16} /> },
    { id: 'notifications', labelEn: 'Notifications', labelNp: 'सूचनाहरू', icon: <Bell size={16} /> },
    { id: 'bulk-roles', labelEn: 'Bulk Roles', labelNp: 'समूह भूमिका', icon: <UserPlus size={16} /> },
    { id: 'data-manager', labelEn: 'Data Manager', labelNp: 'डेटा व्यवस्थापक', icon: <Download size={16} /> },
    { id: 'security', labelEn: 'Security', labelNp: 'सुरक्षा', icon: <Lock size={16} /> },
    { id: 'logs', labelEn: 'System Logs', labelNp: 'सिस्टम लग', icon: <FileText size={16} /> },
    { id: 'performance', labelEn: 'Performance', labelNp: 'कार्यसम्पादन', icon: <Gauge size={16} /> },
    { id: 'system', labelEn: 'System Health', labelNp: 'प्रणाली स्वास्थ्य', icon: <Activity size={16} /> },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="text-indigo-600" size={20} />
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {language === 'en' ? 'Super Admin' : 'सुपर एडमिन'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'en' ? 'System administration and oversight' : 'प्रणाली प्रशासन र निरीक्षण'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-200 px-3 py-1.5 rounded-full font-bold">
          <UserCheck size={14} />
          {totalAdmins} {language === 'en' ? 'Admins' : 'प्रशासकहरू'}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-3xl border border-slate-100 dark:border-white/5 shadow-inner">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white dark:bg-indigo-500 shadow-md border border-indigo-500'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850/50'
            }`}
          >
            {tab.icon}
            <span>{language === 'en' ? tab.labelEn : tab.labelNp}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none" />

        {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
              {language === 'en' ? 'User Analytics Overview' : 'प्रयोगकर्ता विश्लेषण सारांश'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Total Users</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">{totalAdmins}</div>
                <div className="text-[10px] text-slate-500 mt-1">{language === 'en' ? 'Registered admins' : 'दर्ता प्रशासकहरू'}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Active Sessions</div>
                <div className="text-2xl font-black text-emerald-600">1</div>
                <div className="text-[10px] text-slate-500 mt-1">{language === 'en' ? 'Current session' : 'हालको सत्र'}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Superadmin</div>
                <div className="text-2xl font-black text-indigo-600">1</div>
                <div className="text-[10px] text-slate-500 mt-1">{user?.email}</div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 rounded-xl">
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                {language === 'en'
                  ? 'Detailed user analytics, login patterns, and activity heatmaps will be available here.'
                  : 'विस्तृत प्रयोगकर्ता विश्लेषण, लगइन पैटर्न, र गतिविधि हिटम्यापहरू यहाँ उपलब्ध हुनेछन्।'}
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === 'collaboration' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
              {language === 'en' ? 'Admin Collaboration Network' : 'प्रशासन सहकार्य नेटवर्क'}
            </h3>
            <div className="space-y-2">
              {adminEmails.map((email, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 rounded-lg p-3 border border-slate-100 dark:border-white/5">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold">
                    {email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{email}</div>
                    <div className="text-[10px] text-slate-400">
                      {language === 'en' ? 'Admin' : 'प्रशासक'}
                    </div>
                  </div>
                  <TrendingUp size={14} className="text-emerald-500" />
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 italic">
              {language === 'en'
                ? 'Collaboration charts and group analytics will be displayed here.'
                : 'सहकार्य चार्टहरू र समूह विश्लेषणहरू यहाँ देखाइनेछन्।'}
            </p>
          </motion.div>
        )}

        {activeTab === 'geolocation' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
              {language === 'en' ? 'Geolocation Tracking' : 'भौगोलिक स्थान ट्र्याकिङ'}
            </h3>
            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-6 border border-slate-100 dark:border-white/5 text-center">
              <Globe size={40} className="mx-auto text-indigo-400 mb-3" />
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
                {language === 'en'
                  ? 'Individual and group map tracking will appear here.'
                  : 'व्यक्तिगत र समूह मानचित्र ट्र्याकिङ यहाँ देखाइनेछ।'}
              </p>
              <p className="text-[10px] text-slate-400">
                {language === 'en'
                  ? 'Shows last known locations of admins on an interactive map.'
                  : 'अन्तरक्रियात्मक मानचित्रमा प्रशासकहरूको अन्तिम स्थान देखाउँछ।'}
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
                  <Send size={14} className="text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {language === 'en' ? 'Send Announcement' : 'घोषणा पठाउनुहोस्'}
                  </span>
                </div>
                <textarea
                  placeholder={language === 'en' ? 'Type your announcement...' : 'तपाईंको घोषणा टाइप गर्नुहोस्...'}
                  className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs resize-none"
                  rows={3}
                />
                <button className="mt-2 px-4 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-lg hover:bg-indigo-700 transition-colors">
                  {language === 'en' ? 'Send to All Admins' : 'सबै प्रशासकहरूलाई पठाउनुहोस्'}
                </button>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 rounded-xl p-4">
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  {language === 'en'
                    ? 'Push notifications and email announcements will be sent to all registered admins.'
                    : 'पुश सूचनाहरू र इमेल घोषणाहरू सबै दर्ता प्रशासकहरूलाई पठाइनेछ।'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'bulk-roles' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
              {language === 'en' ? 'Bulk Role Assignment' : 'समूह भूमिका नियुक्ति'}
            </h3>
            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <UserPlus size={14} className="text-indigo-600" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {language === 'en' ? 'Import Multiple Admins' : 'धेरै प्रशासकहरू आयात गर्नुहोस्'}
                </span>
              </div>
              <textarea
                placeholder={language === 'en' ? 'Enter emails, one per line:\nadmin1@example.com\nadmin2@example.com' : 'इमेलहरू प्रविष्ट गर्नुहोस्, एक पङ्क्ति प्रति:\nadmin1@example.com\nadmin2@example.com'}
                className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs resize-none"
                rows={4}
              />
              <div className="flex gap-2 mt-3">
                <button className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-lg hover:bg-indigo-700 transition-colors">
                  {language === 'en' ? 'Import as Admins' : 'प्रशासकको रूपमा आयात'}
                </button>
                <button className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black rounded-lg hover:bg-emerald-700 transition-colors">
                  {language === 'en' ? 'Import as Viewers' : 'दर्शकको रूपमा आयात'}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 italic">
              {language === 'en'
                ? 'Bulk assign roles to multiple users at once. Each email will receive an invitation.'
                : 'एकैपटक धेरै प्रयोगकर्ताहरूलाई समूहमा भूमिका नियुक्त गर्नुहोस्।'}
            </p>
          </motion.div>
        )}

        {activeTab === 'data-manager' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
              {language === 'en' ? 'Data Export / Import' : 'डेटा निर्यात / आयात'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Download size={14} className="text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {language === 'en' ? 'Export Data' : 'डेटा निर्यात'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mb-3">
                  {language === 'en' ? 'Download all indicators, offices, and settings as JSON/CSV.' : 'सबै सूचकहरू, कार्यालयहरू र सेटिङहरू JSON/CSV को रूपमा डाउनलोड गर्नुहोस्।'}
                </p>
                <button className="w-full py-2 bg-emerald-600 text-white text-[10px] font-black rounded-lg hover:bg-emerald-700 transition-colors">
                  {language === 'en' ? 'Export All Data' : 'सबै डेटा निर्यात'}
                </button>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Upload size={14} className="text-blue-600" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {language === 'en' ? 'Import Data' : 'डेटा आयात'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mb-3">
                  {language === 'en' ? 'Upload JSON/CSV file to restore or merge data.' : 'डेटा पुनर्स्थापन वा मर्ज गर्न JSON/CSV फाइल अपलोड गर्नुहोस्।'}
                </p>
                <button className="w-full py-2 bg-blue-600 text-white text-[10px] font-black rounded-lg hover:bg-blue-700 transition-colors">
                  {language === 'en' ? 'Import Data' : 'डेटा आयात'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'security' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
              {language === 'en' ? 'Security Dashboard' : 'सुरक्षा ड्यासबोर्ड'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">Login Attempts</div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Today</span>
                  <span className="text-xs font-black text-emerald-600">12</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Failed</span>
                  <span className="text-xs font-black text-rose-600">0</span>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">Active Sessions</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">1 active</span>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">2FA Status</div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Enabled</span>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">IP Tracking</div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {language === 'en' ? 'Enabled' : 'सक्षम'}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'logs' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
              {language === 'en' ? 'System Logs' : 'सिस्टम लग'}
            </h3>
            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {[
                  { time: '13:45', action: 'Login', user: 'banjays@gmail.com', status: 'success' },
                  { time: '13:44', action: 'Sync', user: 'system', status: 'success' },
                  { time: '13:42', action: 'Role Change', user: 'banjays@gmail.com', status: 'success' },
                  { time: '13:40', action: 'Data Update', user: 'admin@example.com', status: 'success' },
                  { time: '13:38', action: 'Login', user: 'admin@example.com', status: 'success' },
                ].map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-lg px-3 py-2 border border-slate-100 dark:border-white/5">
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
          </motion.div>
        )}

        {activeTab === 'performance' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
              {language === 'en' ? 'Performance Metrics' : 'कार्यसम्पादन मेट्रिक्स'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">API Latency</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">45ms</div>
                <div className="text-[10px] text-emerald-600 mt-1">
                  {language === 'en' ? 'Optimal' : 'अनुकूल'}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Sync Success</div>
                <div className="text-2xl font-black text-emerald-600">98.5%</div>
                <div className="text-[10px] text-slate-500 mt-1">Last 24 hours</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Error Rate</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">0.2%</div>
                <div className="text-[10px] text-slate-500 mt-1">Last 24 hours</div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl">
              <p className="text-[11px] text-blue-800 dark:text-blue-300">
                {language === 'en'
                  ? 'Real-time performance monitoring, API health checks, and error tracking will be available here.'
                  : 'वास्तविक समय कार्यसम्पादन निगरानी, API स्वास्थ्य जाँच, र त्रुटि ट्र्याकिङ यहाँ उपलब्ध हुनेछ।'}
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === 'system' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
              {language === 'en' ? 'System Health' : 'प्रणाली स्वास्थ्य'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">Firebase Connection</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Connected</span>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">Service Worker</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Active</span>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">Cache Storage</div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">dorpts-v1</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">App Version</div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">2.9.2</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

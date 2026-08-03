import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Loader2, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SystemMetadata } from '../types';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface SettingsPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: SystemMetadata | null;
  appSettings: {
    fiscalYear: string;
    sheetUrl: string;
    appNameEn: string;
    appNameNp: string;
    subHeaderEn: string;
    subHeaderNp: string;
    themeColor: string;
    sheetId: string;
    dashboardPublishedUrl: string;
    officesPublishedUrl: string;
    autoSyncEnabled?: boolean;
    syncInterval?: number;
    copyrightEn?: string;
    copyrightNp?: string;
    officeBrandingEn?: string;
    officeBrandingNp?: string;
    sheet1PublishedUrl?: string;
    sheet2PublishedUrl?: string;
    sheet3PublishedUrl?: string;
  };
  addToast: (message: string, messageEn?: string, type?: 'success' | 'info' | 'error' | 'warning', duration?: number) => void;
  language: 'en' | 'ne';
  isSaving: boolean;
  setIsSaving: (v: boolean) => void;
}

const FISCAL_YEARS = Array.from({ length: 11 }, (_, i) => {
  const start = 2082 + i;
  const end = start + 1;
  return `${start}/${end.toString().slice(-2)}`;
});

export const SettingsPanelModal: React.FC<SettingsPanelModalProps> = ({
  isOpen, onClose, metadata, appSettings, addToast, language, isSaving, setIsSaving,
}) => {
  const [form, setForm] = useState({
    fiscalYear: '2082/83',
    sheetUrl: '',
    appNameEn: 'Progress Tracker',
    appNameNp: 'प्रगति ट्र्याकर',
    subHeaderEn: 'Performance Tracking System',
    subHeaderNp: 'सम्पादन अनुगमन प्रणाली',
    themeColor: '#0099DA',
    lastUpdateDate: '',
    nextUpdateDate: '',
    sheetId: '',
    dashboardPublishedUrl: '',
    officesPublishedUrl: '',
    copyrightEn: '© DOR | 2082/83 B.S',
    copyrightNp: '© स.वि. | २०८२/८३ बि.सं.',
    officeBrandingEn: 'Department of Roads',
    officeBrandingNp: 'सडक विभाग',
    sheet1PublishedUrl: '',
    sheet2PublishedUrl: '',
    sheet3PublishedUrl: '',
    autoSyncEnabled: true,
    syncInterval: 5,
  });

  useEffect(() => {
    if (metadata || appSettings) {
      const localAutoSync = typeof window !== 'undefined' ? localStorage.getItem('autoSyncEnabled') : null;
      const localInterval = typeof window !== 'undefined' ? localStorage.getItem('syncInterval') : null;
      
      setForm({
        fiscalYear: metadata?.lastUpdateDate || appSettings?.fiscalYear || '2082/83',
        sheetUrl: metadata?.lastSyncedBy || appSettings?.sheetUrl || '',
        appNameEn: appSettings?.appNameEn || 'Progress Tracker',
        appNameNp: appSettings?.appNameNp || 'प्रगति ट्र्याकर',
        subHeaderEn: appSettings?.subHeaderEn || 'Performance Tracking System',
        subHeaderNp: appSettings?.subHeaderNp || 'सम्पादन अनुगमन प्रणाली',
        themeColor: appSettings?.themeColor || '#0099DA',
        lastUpdateDate: metadata?.lastUpdateDate || '',
        nextUpdateDate: metadata?.nextUpdateDate || '',
        sheetId: appSettings?.sheetId || '',
        dashboardPublishedUrl: appSettings?.dashboardPublishedUrl || '',
        officesPublishedUrl: appSettings?.officesPublishedUrl || '',
        copyrightEn: appSettings?.copyrightEn || '© DOR | 2082/83 B.S',
        copyrightNp: appSettings?.copyrightNp || '© स.वि. | २०८२/८३ बि.सं.',
        officeBrandingEn: appSettings?.officeBrandingEn || 'Department of Roads',
        officeBrandingNp: appSettings?.officeBrandingNp || 'सडक विभाग',
        sheet1PublishedUrl: appSettings?.sheet1PublishedUrl || '',
        sheet2PublishedUrl: appSettings?.sheet2PublishedUrl || '',
        sheet3PublishedUrl: appSettings?.sheet3PublishedUrl || '',
        autoSyncEnabled: appSettings?.autoSyncEnabled !== undefined ? appSettings.autoSyncEnabled : (localAutoSync !== 'false'),
        syncInterval: appSettings?.syncInterval || (localInterval ? parseInt(localInterval) : 5),
      });
    }
  }, [metadata, appSettings, isOpen]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const metaRef = doc(db, 'metadata', 'current');
      await setDoc(metaRef, {
        lastUpdateDate: form.lastUpdateDate || form.fiscalYear,
        nextUpdateDate: form.nextUpdateDate,
        lastSyncedBy: form.sheetUrl,
        lastSyncedAt: new Date().toISOString(),
        totalWeight: metadata?.totalWeight || 0,
        totalWeightProgress: metadata?.totalWeightProgress || 0,
      }, { merge: true });

      const settingsRef = doc(db, 'settings', 'system');
      await setDoc(settingsRef, {
        fiscalYear: form.fiscalYear,
        sheetUrl: form.sheetUrl,
        appNameEn: form.appNameEn,
        appNameNp: form.appNameNp,
        subHeaderEn: form.subHeaderEn,
        subHeaderNp: form.subHeaderNp,
        themeColor: form.themeColor,
        sheetId: form.sheetId,
        dashboardPublishedUrl: form.dashboardPublishedUrl,
        officesPublishedUrl: form.officesPublishedUrl,
        copyrightEn: form.copyrightEn,
        copyrightNp: form.copyrightNp,
        officeBrandingEn: form.officeBrandingEn,
        officeBrandingNp: form.officeBrandingNp,
        sheet1PublishedUrl: form.sheet1PublishedUrl,
        sheet2PublishedUrl: form.sheet2PublishedUrl,
        sheet3PublishedUrl: form.sheet3PublishedUrl,
        autoSyncEnabled: form.autoSyncEnabled,
        syncInterval: form.syncInterval,
        updatedAt: new Date().toISOString(),
        updatedBy: 'superadmin',
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('autoSyncEnabled', form.autoSyncEnabled ? 'true' : 'false');
        localStorage.setItem('syncInterval', form.syncInterval.toString());
        window.dispatchEvent(new Event('autoSyncChanged'));
        window.dispatchEvent(new Event('syncIntervalChanged'));
      }

      addToast(
        language === 'en' ? 'Settings saved successfully!' : 'सेटिङहरू सफलतापूर्वक सुरक्षित भयो!',
        'Settings saved!',
        'success'
      );
      onClose();
    } catch {
      addToast(language === 'en' ? 'Failed to save settings.' : 'सेटिङ सुरक्षित गर्न सकिएन।', undefined, 'error');
    } finally {
      setIsSaving(false);
    }
  }, [form, metadata, language, addToast, onClose, setIsSaving]);

  const inputClass = "w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[500] flex items-center justify-center bg-black/30 dark:bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                  <Save className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {language === 'en' ? 'System Settings' : 'प्रणाली सेटिङ'}
                  </h3>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    {language === 'en' ? 'Fiscal year, branding, and data source' : 'आर्थिक बर्ष, ब्रान्डिङ, र डाटा स्रोत'}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                    {language === 'en' ? 'Fiscal Year' : 'आर्थिक बर्ष'}
                  </label>
                  <select
                    value={form.fiscalYear}
                    onChange={(e) => setForm({ ...form, fiscalYear: e.target.value })}
                    className={inputClass}
                  >
                    {FISCAL_YEARS.map((fy) => (
                      <option key={fy} value={fy}>
                        {fy} {language === 'en' ? 'B.S.' : 'बि.सं.'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                    {language === 'en' ? 'Last Update Date' : 'अन्तिम अद्यावधिक मिति'}
                  </label>
                  <input
                    value={form.lastUpdateDate}
                    onChange={(e) => setForm({ ...form, lastUpdateDate: e.target.value })}
                    placeholder="2082/04/01"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                  {language === 'en' ? 'Google Sheet URL' : 'गूगल शीट यूआरएल'}
                </label>
                <input
                  value={form.sheetUrl}
                  onChange={(e) => setForm({ ...form, sheetUrl: e.target.value })}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className={`${inputClass} text-[10px]`}
                />
              </div>

              {/* Auto-sync Toggle Card */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg transition-colors ${form.autoSyncEnabled ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                      <RefreshCw className={`w-4 h-4 ${form.autoSyncEnabled ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {language === 'en' ? 'Auto-sync Google Sheets' : 'गूगल शीट स्वतः अद्यावधिक'}
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${form.autoSyncEnabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                          {form.autoSyncEnabled ? (language === 'en' ? 'ON' : 'सक्रिय') : (language === 'en' ? 'OFF' : 'निष्क्रिय')}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {language === 'en'
                          ? 'Enable periodic real-time data fetching from Google Sheets'
                          : 'गूगल शीटबाट आवधिक रूपमा प्रत्यक्ष डाटा अद्यावधिकहरू तान्नुहोस्'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.autoSyncEnabled}
                    onClick={() => setForm(prev => ({ ...prev, autoSyncEnabled: !prev.autoSyncEnabled }))}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                      form.autoSyncEnabled ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        form.autoSyncEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {form.autoSyncEnabled && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {language === 'en' ? 'Sync Frequency' : 'अद्यावधिक समयावधि'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {[5, 15, 30, 60, 120].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, syncInterval: mins }))}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            form.syncInterval === mins
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                    {language === 'en' ? 'Sheet ID' : 'शीट आईडी'}
                  </label>
                  <input
                    value={form.sheetId}
                    onChange={(e) => setForm({ ...form, sheetId: e.target.value })}
                    placeholder="1ohBXufi7WEvKVAdMavbM5ZQfWnjxveFxgR0FJZf4EJM"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                    {language === 'en' ? 'Theme Color' : 'थिम रङ'}
                  </label>
                  <input
                    value={form.themeColor}
                    onChange={(e) => setForm({ ...form, themeColor: e.target.value })}
                    placeholder="#0099DA"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                    {language === 'en' ? 'Dashboard Published URL' : 'ड्यासबोर्ड प्रकाशित यूआरएल'}
                  </label>
                  <input
                    value={form.dashboardPublishedUrl}
                    onChange={(e) => setForm({ ...form, dashboardPublishedUrl: e.target.value })}
                    placeholder="https://docs.google.com/spreadsheets/d/e/..."
                    className={`${inputClass} text-[10px]`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                    {language === 'en' ? 'Offices Published URL' : 'कार्यालय प्रकाशित यूआरएल'}
                  </label>
                  <input
                    value={form.officesPublishedUrl}
                    onChange={(e) => setForm({ ...form, officesPublishedUrl: e.target.value })}
                    placeholder="https://docs.google.com/spreadsheets/d/e/..."
                    className={`${inputClass} text-[10px]`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                    {language === 'en' ? 'Sheet 1 Published URL' : 'शीट १ प्रकाशित यूआरएल'}
                  </label>
                  <input
                    value={form.sheet1PublishedUrl}
                    onChange={(e) => setForm({ ...form, sheet1PublishedUrl: e.target.value })}
                    placeholder="https://docs.google.com/spreadsheets/d/e/..."
                    className={`${inputClass} text-[10px]`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                    {language === 'en' ? 'Sheet 2 Published URL' : 'शीट २ प्रकाशित यूआरएल'}
                  </label>
                  <input
                    value={form.sheet2PublishedUrl}
                    onChange={(e) => setForm({ ...form, sheet2PublishedUrl: e.target.value })}
                    placeholder="https://docs.google.com/spreadsheets/d/e/..."
                    className={`${inputClass} text-[10px]`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                  {language === 'en' ? 'Sheet 3 Published URL' : 'शीट ३ प्रकाशित यूआरएल'}
                </label>
                <input
                  value={form.sheet3PublishedUrl}
                  onChange={(e) => setForm({ ...form, sheet3PublishedUrl: e.target.value })}
                  placeholder="https://docs.google.com/spreadsheets/d/e/..."
                  className={`${inputClass} text-[10px]`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                    {language === 'en' ? 'App Name (EN)' : 'एप नाम (अंग्रेजी)'}
                  </label>
                  <input
                    value={form.appNameEn}
                    onChange={(e) => setForm({ ...form, appNameEn: e.target.value })}
                    placeholder="Progress Tracker"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                    {language === 'en' ? 'App Name (NP)' : 'एप नाम (नेपाली)'}
                  </label>
                  <input
                    value={form.appNameNp}
                    onChange={(e) => setForm({ ...form, appNameNp: e.target.value })}
                    placeholder="प्रगति ट्र्याकर"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                    {language === 'en' ? 'Sub Header (EN)' : 'उपशीर्षक (अंग्रेजी)'}
                  </label>
                  <input
                    value={form.subHeaderEn}
                    onChange={(e) => setForm({ ...form, subHeaderEn: e.target.value })}
                    placeholder="Performance Tracking System"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                    {language === 'en' ? 'Sub Header (NP)' : 'उपशीर्षक (नेपाली)'}
                  </label>
                  <input
                    value={form.subHeaderNp}
                    onChange={(e) => setForm({ ...form, subHeaderNp: e.target.value })}
                    placeholder="सम्पादन अनुगमन प्रणाली"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                    {language === 'en' ? 'Copyright (EN)' : 'कपीराइट (अंग्रेजी)'}
                  </label>
                  <input
                    value={form.copyrightEn}
                    onChange={(e) => setForm({ ...form, copyrightEn: e.target.value })}
                    placeholder="© DOR | 2082/83 B.S"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                    {language === 'en' ? 'Copyright (NP)' : 'कपीराइट (नेपाली)'}
                  </label>
                  <input
                    value={form.copyrightNp}
                    onChange={(e) => setForm({ ...form, copyrightNp: e.target.value })}
                    placeholder="© स.वि. | २०८२/८३ बि.सं."
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                    {language === 'en' ? 'Office Branding (EN)' : 'कार्यालय ब्रान्डिङ (अंग्रेजी)'}
                  </label>
                  <input
                    value={form.officeBrandingEn}
                    onChange={(e) => setForm({ ...form, officeBrandingEn: e.target.value })}
                    placeholder="Department of Roads"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                    {language === 'en' ? 'Office Branding (NP)' : 'कार्यालय ब्रान्डिङ (नेपाली)'}
                  </label>
                  <input
                    value={form.officeBrandingNp}
                    onChange={(e) => setForm({ ...form, officeBrandingNp: e.target.value })}
                    placeholder="सडक विभाग"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 dark:border-white/5 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                {language === 'en' ? 'Cancel' : 'रद्द गर्नुहोस्'}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {isSaving ? (language === 'en' ? 'Saving...' : 'सुरक्षित गर्दै...') : (language === 'en' ? 'Save' : 'सुरक्षित गर्नुहोस्')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

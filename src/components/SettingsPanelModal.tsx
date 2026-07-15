import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Loader2 } from 'lucide-react';
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
  };
  addToast: (message: string, messageEn?: string, type?: 'success' | 'info' | 'error' | 'warning', duration?: number) => void;
  language: 'en' | 'ne';
  isSaving: boolean;
  setIsSaving: (v: boolean) => void;
}

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
  });

  useEffect(() => {
    if (metadata || appSettings) {
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
        updatedAt: new Date().toISOString(),
        updatedBy: 'superadmin',
      });

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
                  <input
                    value={form.fiscalYear}
                    onChange={(e) => setForm({ ...form, fiscalYear: e.target.value })}
                    placeholder="2082/83"
                    className={inputClass}
                  />
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                    {language === 'en' ? 'Sheet ID' : 'शीट आईडी'}
                  </label>
                  <input
                    value={form.sheetId}
                    onChange={(e) => setForm({ ...form, sheetId: e.target.value })}
                    placeholder="1ohBXufi7WEvKVAdMavbM5ZQfWnjxveFxgR0FJZf4EJM"
                    className={`${inputClass} text-[10px] font-mono`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                    {language === 'en' ? 'Dashboard Published CSV URL' : 'ड्यासबोर्ड प्रकाशित CSV URL'}
                  </label>
                  <input
                    value={form.dashboardPublishedUrl}
                    onChange={(e) => setForm({ ...form, dashboardPublishedUrl: e.target.value })}
                    placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv&gid=0"
                    className={`${inputClass} text-[10px]`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                  {language === 'en' ? 'Offices Published CSV URL' : 'कार्यालय प्रकाशित CSV URL'}
                </label>
                <input
                  value={form.officesPublishedUrl}
                  onChange={(e) => setForm({ ...form, officesPublishedUrl: e.target.value })}
                  placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv&gid=40941786"
                  className={`${inputClass} text-[10px]`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                    {language === 'en' ? 'App Name (EN)' : 'एप नाम (EN)'}
                  </label>
                  <input
                    value={form.appNameEn}
                    onChange={(e) => setForm({ ...form, appNameEn: e.target.value })}
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
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                    {language === 'en' ? 'Sub-header (EN)' : 'उप-शीर्षक (EN)'}
                  </label>
                  <input
                    value={form.subHeaderEn}
                    onChange={(e) => setForm({ ...form, subHeaderEn: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                    {language === 'en' ? 'Sub-header (NP)' : 'उप-शीर्षक (नेपाली)'}
                  </label>
                  <input
                    value={form.subHeaderNp}
                    onChange={(e) => setForm({ ...form, subHeaderNp: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                    {language === 'en' ? 'Theme Color' : 'थिम रङ'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={form.themeColor}
                      onChange={(e) => setForm({ ...form, themeColor: e.target.value })}
                      className="w-10 h-9 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent"
                    />
                    <input
                      value={form.themeColor}
                      onChange={(e) => setForm({ ...form, themeColor: e.target.value })}
                      className={`${inputClass} flex-1 font-mono uppercase`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 dark:border-white/5 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                {language === 'en' ? 'Cancel' : 'रद्द गर्नुहोस्'}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-500/25 active:scale-95 transition-all flex items-center gap-1.5"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {language === 'en' ? 'Save Settings' : 'सेटिङ सुरक्षित गर्नुहोस्'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

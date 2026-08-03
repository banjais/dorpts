import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, UserPlus, Trash2, Crown, Edit3, Building2, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { AdminUser } from '../types';
import { doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getOfficeByEmail } from '../utils/officeDetector';
import { DOR_OFFICES_LIST } from '../data';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminsList: AdminUser[];
  refreshAdmins: () => Promise<void>;
  addToast: (message: string, messageEn?: string, type?: 'success' | 'info' | 'error' | 'warning', duration?: number) => void;
  language: 'en' | 'ne';
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen, onClose, adminsList, refreshAdmins, addToast, language,
}) => {
  const { isSuperadmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'offices'>('users');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'data_updater'>('admin');
  const [removing, setRemoving] = useState<string | null>(null);
  const [officeSearch, setOfficeSearch] = useState('');
  const [assigningOffice, setAssigningOffice] = useState<string | null>(null);
  const [selectedAdminForOffice, setSelectedAdminForOffice] = useState<string>('');

  const handleAdd = useCallback(async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      addToast(language === 'en' ? 'Enter a valid email.' : 'वैध इमेल प्रविष्ट गर्नुहोस्।', undefined, 'warning');
      return;
    }
    try {
      const adminEmail = email.trim().toLowerCase();
      const office = getOfficeByEmail(adminEmail);
      const adminId = adminEmail;
      await setDoc(doc(db, 'users', adminId), {
        email: adminEmail,
        role,
        createdAt: new Date().toISOString(),
        office,
      }, { merge: true });
      await setDoc(doc(db, 'admins', adminId), {
        email: adminEmail,
        role,
        createdAt: new Date().toISOString(),
        office,
      }, { merge: true });
      addToast(language === 'en' ? 'User added successfully.' : 'प्रयोगकर्ता सफलतापूर्वक थपियो।', undefined, 'success');
      setEmail('');
      await refreshAdmins();
    } catch {
      addToast(language === 'en' ? 'Failed to add user.' : 'प्रयोगकर्ता थप्न सकिएन।', undefined, 'error');
    }
  }, [email, role, language, addToast, refreshAdmins]);

  const handleRemove = useCallback(async (uid: string, email: string) => {
    setRemoving(uid);
    try {
      await deleteDoc(doc(db, 'admins', uid));
      await deleteDoc(doc(db, 'users', email));
      addToast(language === 'en' ? 'User removed.' : 'प्रयोगकर्ता हटाइयो।', undefined, 'info');
      await refreshAdmins();
    } catch {
      addToast(language === 'en' ? 'Failed to remove user.' : 'प्रयोगकर्ता हटाउन सकिएन।', undefined, 'error');
    } finally {
      setRemoving(null);
    }
  }, [language, addToast, refreshAdmins]);

  const handleAssignOffice = useCallback(async (officeName: string) => {
    if (!selectedAdminForOffice) {
      addToast(language === 'en' ? 'Select an admin first.' : 'पहिले प्रशासक चयन गर्नुहोस्।', undefined, 'warning');
      return;
    }
    setAssigningOffice(officeName);
    try {
      const admin = adminsList.find(a => a.email === selectedAdminForOffice);
      if (!admin) return;
      const ref = doc(db, 'admins', admin.uid);
      await updateDoc(ref, { office: officeName });
      addToast(
        language === 'en' ? `Assigned ${selectedAdminForOffice} to office.` : `कार्यालयमा ${selectedAdminForOffice} मानिन्थ्यो।`,
        undefined,
        'success'
      );
      setSelectedAdminForOffice('');
      await refreshAdmins();
    } catch {
      addToast(language === 'en' ? 'Failed to assign office.' : 'कार्यालय मानिन सकिएन।', undefined, 'error');
    } finally {
      setAssigningOffice(null);
    }
  }, [selectedAdminForOffice, adminsList, language, addToast, refreshAdmins]);

  const handleUnassignOffice = useCallback(async (adminEmail: string) => {
    try {
      const admin = adminsList.find(a => a.email === adminEmail);
      if (!admin) return;
      const ref = doc(db, 'admins', admin.uid);
      await updateDoc(ref, { office: null });
      addToast(
        language === 'en' ? `Removed ${adminEmail} from office.` : `${adminEmail} लाई कार्यालयबाट हटाइयो।`,
        undefined,
        'info'
      );
      await refreshAdmins();
    } catch {
      addToast(language === 'en' ? 'Failed to unassign office.' : 'कार्यालय हटाउन सकिएन।', undefined, 'error');
    }
  }, [adminsList, language, addToast, refreshAdmins]);

  const roleLabel = (r: string) => {
    if (r === 'superadmin') return language === 'en' ? 'Superadmin' : 'सुपर एड्मिन';
    if (r === 'admin') return language === 'en' ? 'Admin' : 'एड्मिन';
    return language === 'en' ? 'Data Updater' : 'डाटा अपडेटर';
  };
  const roleBadge = (r: string) => {
    if (r === 'superadmin') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    if (r === 'admin') return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
    return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400';
  };

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
            className="w-full max-w-lg max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                  <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {language === 'en' ? 'User Management' : 'प्रयोगकर्ता व्यवस्थापन'}
                  </h3>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    {language === 'en' ? 'Manage access and roles' : 'पहुँच र भूमिका व्यवस्थापन गर्नुहोस्'}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <X size={16} />
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex border-b border-slate-100 dark:border-white/5">
              <button
                onClick={() => setActiveTab('users')}
                className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === 'users'
                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {language === 'en' ? 'Users' : 'प्रयोगकर्ताहरू'}
              </button>
              <button
                onClick={() => setActiveTab('offices')}
                className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === 'offices'
                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {language === 'en' ? 'Offices' : 'कार्यालयहरू'}
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {activeTab === 'users' && (
                <>
                  {isSuperadmin && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                        {language === 'en' ? 'Add New User' : 'नयाँ प्रयोगकर्ता थप्नुहोस्'}
                      </h4>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="user@example.com"
                          className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        />
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value as 'admin' | 'data_updater')}
                          className="px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                        >
                          <option value="admin">{language === 'en' ? 'Admin' : 'एड्मिन'}</option>
                          <option value="data_updater">{language === 'en' ? 'Data Updater' : 'डाटा अपडेटर'}</option>
                        </select>
                        <button
                          onClick={handleAdd}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm active:scale-95 transition-all"
                        >
                          <UserPlus size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      {language === 'en' ? 'Registered Users' : 'दर्ता प्रयोगकर्ताहरू'}
                    </h4>
                    {adminsList.length === 0 && (
                      <p className="text-[11px] text-slate-400 italic py-3 text-center">
                        {language === 'en' ? 'No users registered yet.' : 'अहिलेसम्म कुनै प्रयोगकर्ता दर्ता भएको छैन।'}
                      </p>
                    )}
                    {adminsList.map((u) => (
                      <div key={u.uid} className="flex items-center gap-2.5 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-xl px-3 py-2.5">
                        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center shrink-0">
                          {u.role === 'superadmin' ? (
                            <Crown className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Shield className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{u.email}</p>
                          <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${roleBadge(u.role)}`}>
                            {roleLabel(u.role)}
                          </span>
                          {u.office && (
                            <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 mt-0.5">
                              <Building2 size={9} className="shrink-0" />
                              {u.office}
                            </span>
                          )}
                        </div>
                        {u.role !== 'superadmin' && isSuperadmin && (
                          <button
                            onClick={() => handleRemove(u.uid, u.email)}
                            disabled={removing === u.uid}
                            className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all disabled:opacity-50"
                            title={language === 'en' ? 'Remove user' : 'प्रयोगकर्ता हटाउनुहोस्'}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeTab === 'offices' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2">
                      {language === 'en' ? 'Assign Admin to Office' : 'कार्यालयमा प्रशासक मानिनुहोस्'}
                    </h4>
                    <div className="flex gap-2">
                      <select
                        value={selectedAdminForOffice}
                        onChange={(e) => setSelectedAdminForOffice(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      >
                        <option value="">{language === 'en' ? 'Select admin...' : 'प्रशासक चयन गर्नुहोस्...'}</option>
                        {adminsList.filter(a => a.role !== 'superadmin').map(a => (
                          <option key={a.uid} value={a.email}>{a.email}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      value={officeSearch}
                      onChange={(e) => setOfficeSearch(e.target.value)}
                      placeholder={language === 'en' ? 'Search offices...' : 'कार्यालयहरू खोज्नुहोस्...'}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>

                  <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {DOR_OFFICES_LIST.filter(office =>
                      (language === 'en' ? office.name : office.name).toLowerCase().includes(officeSearch.toLowerCase())
                    ).map((office, idx) => {
                      const assignedAdmin = adminsList.find(a => a.office === office.name);
                      return (
                        <div key={idx} className="flex items-center gap-2.5 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-xl px-3 py-2.5">
                          <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center shrink-0">
                            <Building2 size={14} className="text-slate-500 dark:text-slate-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{office.name}</p>
                            {assignedAdmin ? (
                              <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 mt-0.5">
                                {assignedAdmin.email}
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-400 font-medium">
                                {language === 'en' ? 'Unassigned' : 'अननुसन्धान'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {assignedAdmin ? (
                              <button
                                onClick={() => handleUnassignOffice(assignedAdmin.email)}
                                className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                                title={language === 'en' ? 'Remove admin' : 'प्रशासक हटाउनुहोस्'}
                              >
                                <Trash2 size={12} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAssignOffice(office.name)}
                                disabled={!selectedAdminForOffice || assigningOffice === office.name}
                                className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all disabled:opacity-50"
                                title={language === 'en' ? 'Assign admin' : 'प्रशासक मानिनुहोस्'}
                              >
                                <UserPlus size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

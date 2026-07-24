import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminUser } from '../types';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Shield, Trash2, UserPlus, CheckCircle, AlertCircle, Building2 } from 'lucide-react';
import { getOfficeByEmail } from '../utils/officeDetector';

export const AdminMgmt: React.FC = () => {
  const { adminsList, isSuperadmin, logActivity, refreshAdmins, user } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [newUid, setNewUid] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'superadmin'>('admin');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Promote action handler
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newUid) {
      setErrorMsg('Please enter both Email and Firebase UID or temporary ID string.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const adminId = newUid.trim();
      const adminEmail = newEmail.trim().toLowerCase();
      
      await setDoc(doc(db, 'admins', adminId), {
        email: adminEmail,
        role: newRole,
        createdAt: serverTimestamp(),
      });

      await logActivity('role_change', `Upgraded ${adminEmail} to ${newRole}`);
      setSuccessMsg(`Successfully assigned role ${newRole} to ${adminEmail}!`);
      setNewEmail('');
      setNewUid('');
      await refreshAdmins();
    } catch (err) {
      console.error(err);
      setErrorMsg('Database update failed. Ensure you are signed in as Superadmin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Demote/Delete handler
  const handleDeleteAdmin = async (targetUid: string, targetEmail: string) => {
    if (targetEmail === 'banjays@gmail.com') {
      setErrorMsg('Cannot remove the root bootstrapped superadmin!');
      return;
    }
    if (targetUid === user?.uid) {
      setErrorMsg('Cannot remove your own admin status!');
      return;
    }

    if (!window.confirm(`Are you sure you want to revoke admin rights for ${targetEmail}?`)) {
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');

    try {
      await deleteDoc(doc(db, 'admins', targetUid));
      await logActivity('role_change', `Revoked access of ${targetEmail}`);
      setSuccessMsg(`Revoked admin permissions for ${targetEmail}.`);
      await refreshAdmins();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to delete administrator role.');
    }
  };

  if (!isSuperadmin) {
    return (
      <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200 text-amber-800 text-center space-y-2 mt-4">
        <AlertCircle className="mx-auto text-amber-600" size={32} />
        <h4 className="font-bold font-display">सुपरएडमिन पहुँच सीमित छ (Superadmin Restricted Area)</h4>
        <p className="text-xs max-w-sm mx-auto">
          Role-Based Access Controls permit only accounts designated as Superadmin to manage user registrations and roles.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4" id="admin-management-module">
      
      {/* ROLE ASSIGNMENT FORM */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm" id="role-invite-form">
        <div className="flex items-center gap-2 border-b border-slate-50 pb-3 mb-4">
          <UserPlus size={18} className="text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-800 font-display">नयाँ अनुमति जारी गर्नुहोस् (Grant Elevated Rights)</h3>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 p-2.5 rounded-lg text-xs font-sans mb-3 flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-2.5 rounded-lg text-xs font-sans mb-3 flex items-center gap-2">
            <CheckCircle size={14} className="shrink-0 animate-bounce" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleAddAdmin} className="space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">UID (Firebase Auth Uid)</label>
              <input
                type="text"
                placeholder="User's UID"
                value={newUid || ''}
                onChange={(e) => setNewUid(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">Email Address</label>
              <input
                type="email"
                placeholder="User email"
                value={newEmail || ''}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              <label className="text-[10px] sm:text-xs text-slate-500 font-sans mr-1 sm:mr-2 shrink-0">Role:</label>
              <label className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-slate-700 cursor-pointer shrink-0">
                <input
                  type="radio"
                  name="roleGroup"
                  checked={newRole === 'admin'}
                  onChange={() => setNewRole('admin')}
                  className="text-indigo-600"
                />
                Admin
              </label>
              <label className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-slate-700 cursor-pointer ml-3 shrink-0">
                <input
                  type="radio"
                  name="roleGroup"
                  checked={newRole === 'superadmin'}
                  onChange={() => setNewRole('superadmin')}
                  className="text-indigo-600"
                />
                Superadmin
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-[11px] sm:text-xs px-4 py-2.5 rounded-xl font-black transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 uppercase tracking-wider"
            >
              {isSubmitting ? 'Processing...' : 'Assign Permissions'}
            </button>
          </div>
        </form>
      </div>

      {/* CURRENT ADMINS DIRECTORY */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm" id="p-admins-list">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800 font-display">वर्तमान प्रशासकहरूको सूची (Authorizations Directory)</h3>
          </div>
          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
            {adminsList.length + 1} Accounts
          </span>
        </div>

        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100 bg-slate-50/20">
          {/* Root Bootstrapped row */}
          <div className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-xl text-indigo-700 shadow-xs border border-indigo-200">
                <Shield size={16} />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">banjays@gmail.com</span>
                <span className="text-[10px] text-slate-400 font-mono">ROOT_SUPERADMIN_SYSTEM</span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 mt-0.5">
                  <Building2 size={10} className="shrink-0" />
                  System Administration
                </span>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/50">
              superadmin
            </span>
          </div>

          {/* Dynamic entries */}
          {adminsList
            .filter(adm => adm.email !== 'banjays@gmail.com')
            .map((adm, idx) => (
              <div key={adm.uid || idx} className="flex items-center justify-between p-3 sm:p-3.5 hover:bg-slate-50 transition-colors gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className={`shrink-0 p-1.5 sm:p-2 rounded-xl ${adm.role === 'superadmin' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-600'} shadow-2xs`}>
                    <Shield size={14} className="sm:size-[16px]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] sm:text-xs font-bold text-slate-800 block truncate">{adm.email}</span>
                    <span className="text-[8px] sm:text-[9px] text-slate-400 font-mono truncate block">UID: {adm.uid}</span>
                    {adm.office && (
                      <span className="text-[8px] sm:text-[9px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 mt-0.5">
                        <Building2 size={9} className="shrink-0" />
                        {adm.office}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                  <span className={`text-[8px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 sm:px-2 py-0.5 rounded ${
                    adm.role === 'superadmin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-50 text-slate-600'
                  }`}>
                    {adm.role}
                  </span>
                  
                  <button
                    onClick={() => handleDeleteAdmin(adm.uid, adm.email)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Revoke status"
                  >
                    <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

    </div>
  );
};

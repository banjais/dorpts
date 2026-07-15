import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, where, getDocs as firestoreGetDocs } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { AdminUser, UserActivity, EmailOTPSession } from '../types';
import { validateSession, destroySession } from '../services/otpService';
import { getOfficeByEmail, detectUserOffice } from '../utils/officeDetector';
import { SUPERADMIN_EMAIL } from '../config/superadmin';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperadmin: boolean;
  isDataUpdater: boolean;
  role: 'superadmin' | 'admin' | 'data_updater' | 'viewer' | null;
  adminsList: AdminUser[];
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  logActivity: (actionType: UserActivity['actionType'], details: string) => Promise<void>;
  refreshAdmins: () => Promise<void>;
  accessToken: string | null;
  emailSession: EmailOTPSession | null;
  userAssignedOffice: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'superadmin' | 'admin' | 'data_updater' | 'viewer' | null>(null);
  const [adminsList, setAdminsList] = useState<AdminUser[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [emailSession, setEmailSession] = useState<EmailOTPSession | null>(null);
  const [userAssignedOffice, setUserAssignedOffice] = useState<string | null>(null);

  const isSuperadmin = role === 'superadmin';
  const isAdmin = role === 'superadmin' || role === 'admin';
  const isDataUpdater = role === 'superadmin' || role === 'admin' || role === 'data_updater';

  const logActivity = useCallback(async (actionType: UserActivity['actionType'], details: string) => {
    try {
      const uid = user?.uid || emailSession?.email || 'anonymous';
      const email = user?.email || emailSession?.email || 'anonymous';
      const actId = `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      await setDoc(doc(db, 'activities', actId), {
        id: actId,
        userId: uid,
        email,
        actionType,
        details,
        timestamp: serverTimestamp(),
      });
    } catch {
      // suppress
    }
  }, [user, emailSession]);

  const lookupEmailRole = useCallback(async (email: string): Promise<'superadmin' | 'admin' | 'data_updater' | 'viewer'> => {
    if (email === SUPERADMIN_EMAIL) return 'superadmin';
    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const snap = await firestoreGetDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        const r = data.role as 'superadmin' | 'admin' | 'data_updater' | 'viewer';
        if (r === 'superadmin' || r === 'admin' || r === 'data_updater' || r === 'viewer') return r;
      }
    } catch {
      // suppress
    }
    return 'viewer';
  }, []);

  const setRoleAndLoadAdmins = useCallback(async (newRole: 'superadmin' | 'admin' | 'data_updater' | 'viewer') => {
    setRole(newRole);
    if (newRole === 'superadmin' || newRole === 'admin') {
      try {
        const snap = await getDocs(collection(db, 'admins'));
        const list: AdminUser[] = [];
        snap.forEach(d => {
          const data = d.data();
          list.push({
            uid: d.id,
            email: data.email,
            role: data.role,
            createdAt: data.createdAt?.seconds
              ? new Date(data.createdAt.seconds * 1000).toISOString()
              : data.createdAt || new Date().toISOString(),
          });
        });
        setAdminsList(list);
      } catch {
        // suppress
      }
    }
  }, []);

  const loadUserAssignedOffice = useCallback(async (email: string): Promise<string | null> => {
    if (email === SUPERADMIN_EMAIL) return null;
    try {
      const q = query(collection(db, 'admins'), where('email', '==', email));
      const snap = await firestoreGetDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        const office = data.office as string | undefined;
        if (office && office.trim()) return office.trim();
      }
    } catch {
      // suppress
    }
    return null;
  }, []);

  // Check stored session on mount
  useEffect(() => {
    let cancelled = false;
    const checkSession = async () => {
      try {
        const token = sessionStorage.getItem('dor_session');
        if (token) {
          const session = await validateSession(token);
          if (session && !cancelled) {
            const userRole = await lookupEmailRole(session.email);
            setEmailSession(session);
            await setRoleAndLoadAdmins(userRole);
            const assignedOffice = await loadUserAssignedOffice(session.email);
            setUserAssignedOffice(assignedOffice);
            await logActivity('otp_login', `Email OTP login: ${session.email}`);
          } else {
            sessionStorage.removeItem('dor_session');
          }
        }
      } catch {
        // suppress
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    checkSession();
    return () => { cancelled = true; };
  }, [lookupEmailRole, setRoleAndLoadAdmins, logActivity]);

  // Google auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const adminRef = doc(db, 'admins', currentUser.uid);
          const adminSnap = await getDoc(adminRef);
          if (adminSnap.exists()) {
            const val = adminSnap.data();
            const detectedRole = val.role as 'superadmin' | 'admin' | 'data_updater' | 'viewer';
            await setRoleAndLoadAdmins(detectedRole);
          } else if (currentUser.email === SUPERADMIN_EMAIL) {
            await setDoc(adminRef, {
              email: SUPERADMIN_EMAIL,
              role: 'superadmin',
              createdAt: serverTimestamp(),
            });
            await setRoleAndLoadAdmins('superadmin');
            await logActivity('role_change', `Bootstrapped ${SUPERADMIN_EMAIL} as Initial Superadmin`);
          } else {
            await setRoleAndLoadAdmins('viewer');
          }
          const detected = await detectUserOffice(currentUser.email);
          if (detected.office) {
            await setDoc(adminRef, { office: detected.office, officeDetectionMethod: detected.method }, { merge: true });
          }
          const assignedOffice = await loadUserAssignedOffice(currentUser.email);
          setUserAssignedOffice(assignedOffice);
          await logActivity('login', `Google login: ${currentUser.email}`);
        } catch {
          await setRoleAndLoadAdmins('viewer');
        }
      } else {
        setUser(null);
        setRole(null);
        setAccessToken(null);
        setAdminsList([]);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [setRoleAndLoadAdmins, logActivity]);

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setAccessToken(credential.accessToken);
      }
    } catch (error) {
      console.error('Login action encountered error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (emailSession?.token) {
        await destroySession(emailSession.token);
        sessionStorage.removeItem('dor_session');
      }
      setEmailSession(null);
      await logActivity('login', `User logged out: ${user?.email || emailSession?.email}`);
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshAdmins = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const snap = await getDocs(collection(db, 'admins'));
      const list: AdminUser[] = [];
      snap.forEach(d => {
        const data = d.data();
        const email = data.email || '';
        list.push({
          uid: d.id,
          email,
          role: data.role,
          createdAt: data.createdAt?.seconds
            ? new Date(data.createdAt.seconds * 1000).toISOString()
            : data.createdAt || new Date().toISOString(),
          office: data.office || getOfficeByEmail(email),
        });
      });
      setAdminsList(list);
    } catch {
      // suppress
    }
  }, [isAdmin]);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAdmin,
      isSuperadmin,
      isDataUpdater,
      role,
      adminsList,
      loginWithGoogle,
      logout,
      logActivity,
      refreshAdmins,
      accessToken,
      emailSession,
      userAssignedOffice,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

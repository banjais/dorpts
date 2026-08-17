import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, onAuthStateChanged, signInWithRedirect, getRedirectResult, signOut, GoogleAuthProvider, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { AdminUser, UserActivity } from '../types';
import { getOfficeByEmail } from '../utils/officeDetector';
import { SUPERADMIN_EMAIL } from '../config/superadmin';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperadmin: boolean;
  isDataUpdater: boolean;
  role: 'superadmin' | 'system_admin' | 'office_admin' | 'viewer' | null;
  adminsList: AdminUser[];
  loginWithGoogle: (rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  logActivity: (actionType: UserActivity['actionType'], details: string) => Promise<void>;
  refreshAdmins: () => Promise<void>;
  accessToken: string | null;
  userAssignedOffice: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'superadmin' | 'system_admin' | 'office_admin' | 'viewer' | null>(null);
  const [adminsList, setAdminsList] = useState<AdminUser[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userAssignedOffice, setUserAssignedOffice] = useState<string | null>(null);

  const isSuperadmin = role === 'superadmin';
  const isAdmin = role === 'superadmin' || role === 'system_admin';
  const isDataUpdater = role === 'superadmin' || role === 'system_admin' || role === 'office_admin';

  const logActivity = useCallback(async (actionType: UserActivity['actionType'], details: string) => {
    try {
      const uid = user?.uid || 'anonymous';
      const email = user?.email || 'anonymous';
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
  }, [user]);

   const lookupEmailRole = useCallback(async (email: string): Promise<'superadmin' | 'system_admin' | 'office_admin' | 'viewer'> => {
      if (email === SUPERADMIN_EMAIL) return 'superadmin';
      try {
        const q = query(collection(db, 'users'), where('email', '==', email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs[0].data();
          const r = data.role as 'superadmin' | 'system_admin' | 'office_admin' | 'viewer';
          if (r === 'superadmin' || r === 'system_admin' || r === 'office_admin' || r === 'viewer') return r;
        }
      } catch {
        // suppress
      }
      try {
        const q = query(collection(db, 'admins'), where('email', '==', email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs[0].data();
          const r = data.role as 'superadmin' | 'system_admin' | 'office_admin' | 'viewer';
          if (r === 'superadmin' || r === 'system_admin' || r === 'office_admin' || r === 'viewer') return r;
        }
      } catch {
        // suppress
      }
      return 'viewer';
    }, []);

  const setRoleAndLoadAdmins = useCallback(async (newRole: 'superadmin' | 'system_admin' | 'office_admin' | 'viewer') => {
    setRole(newRole);
    if (newRole === 'superadmin' || newRole === 'system_admin') {
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
      const snap = await getDocs(q);
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
              const detectedRole = val.role as 'superadmin' | 'system_admin' | 'office_admin' | 'viewer';
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
             try {
               const q = query(collection(db, 'admins'), where('email', '==', currentUser.email));
               const emailSnap = await getDocs(q);
               if (!emailSnap.empty) {
                 const val = emailSnap.docs[0].data();
                  const detectedRole = val.role as 'superadmin' | 'system_admin' | 'office_admin' | 'viewer';
                  await setRoleAndLoadAdmins(detectedRole);
               } else {
                 await setRoleAndLoadAdmins('viewer');
               }
             } catch {
               await setRoleAndLoadAdmins('viewer');
             }
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
  }, [setRoleAndLoadAdmins, logActivity, loadUserAssignedOffice]);

  const loginWithGoogle = async (rememberMe = false) => {
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      console.error('Login action encountered error:', error);
      const message = error?.message || error?.code || String(error);
      const friendly = message.includes('redirect')
        ? 'Sign-in redirect failed.'
        : message.includes('auth/')
          ? message
          : 'Google sign-in failed.';
      throw new Error(friendly, { cause: error as Error });
    }
  };

  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          const credential = GoogleAuthProvider.credentialFromResult(result);
          if (credential?.accessToken) {
            setAccessToken(credential.accessToken);
          }
        }
      } catch (error) {
        console.error('Redirect result error:', error);
      }
    };
    handleRedirectResult();
  }, []);

  const logout = async () => {
    try {
      await logActivity('logout', `User logged out: ${user?.email || 'anonymous'}`);
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
      userAssignedOffice,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

const defaultAuthContext: AuthContextType = {
  user: null,
  loading: false,
  isAdmin: false,
  isSuperadmin: false,
  isDataUpdater: false,
  role: null,
  adminsList: [],
  loginWithGoogle: async (rememberMe?: boolean) => {},
  logout: async () => {},
  logActivity: async () => {},
  refreshAdmins: async () => {},
  accessToken: null,
  userAssignedOffice: null,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    return defaultAuthContext;
  }
  return context;
};

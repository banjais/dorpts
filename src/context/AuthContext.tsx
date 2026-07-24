import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
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
  role: 'superadmin' | 'admin' | 'data_updater' | 'viewer' | null;
  adminsList: AdminUser[];
  loginWithGoogle: () => Promise<void>;
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
  const [role, setRole] = useState<'superadmin' | 'admin' | 'data_updater' | 'viewer' | null>(null);
  const [adminsList, setAdminsList] = useState<AdminUser[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userAssignedOffice, setUserAssignedOffice] = useState<string | null>(null);

  const isSuperadmin = role === 'superadmin';
  const isAdmin = role === 'superadmin' || role === 'admin';
  const isDataUpdater = role === 'superadmin' || role === 'admin' || role === 'data_updater';

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

   const lookupEmailRole = useCallback(async (email: string): Promise<'superadmin' | 'admin' | 'data_updater' | 'viewer'> => {
     if (email === SUPERADMIN_EMAIL) return 'superadmin';
     try {
       const q = query(collection(db, 'users'), where('email', '==', email));
       const snap = await getDocs(q);
       if (!snap.empty) {
         const data = snap.docs[0].data();
         const r = data.role as 'superadmin' | 'admin' | 'data_updater' | 'viewer';
         if (r === 'superadmin' || r === 'admin' || r === 'data_updater' || r === 'viewer') return r;
       }
     } catch {
       // suppress
     }
     try {
       const q = query(collection(db, 'admins'), where('email', '==', email));
       const snap = await getDocs(q);
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
             try {
               const q = query(collection(db, 'admins'), where('email', '==', currentUser.email));
               const emailSnap = await getDocs(q);
               if (!emailSnap.empty) {
                 const val = emailSnap.docs[0].data();
                 const detectedRole = val.role as 'superadmin' | 'admin' | 'data_updater' | 'viewer';
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

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setAccessToken(credential.accessToken);
      }
    } catch (error: any) {
      console.error('Login action encountered error:', error);
      const message = error?.message || error?.code || String(error);
      const friendly = message.includes('popup')
        ? 'Popup blocked. Please allow popups for this site.'
        : message.includes('auth/')
          ? message
          : 'Google sign-in failed.';
      throw new Error(friendly);
    }
  };

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

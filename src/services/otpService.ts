import {
  doc, setDoc, getDoc, deleteDoc, serverTimestamp, Timestamp,
  query, collection, where, getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { EmailOTPSession } from '../types';

const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const API_BASE = typeof window !== 'undefined' ? (
  (window as any).__API_BASE__ || ''
) : '';

function hashEmail(email: string): string {
  return btoa(email.toLowerCase().trim()).replace(/[^a-zA-Z0-9]/g, '');
}

export async function requestEmailSend(email: string, otp: string): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'unknown' }));
      throw new Error(err.error || 'Failed to send OTP');
    }
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateAndStoreOTP(email: string): Promise<{ otp: string; otpId: string }> {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpId = `${hashEmail(email)}_${Date.now()}`;
  const ref = doc(db, 'otps', otpId);

  await setDoc(ref, {
    email: email.toLowerCase().trim(),
    otp,
    expiresAt: Timestamp.fromMillis(Date.now() + OTP_EXPIRY_MS),
    createdAt: serverTimestamp(),
    attempts: 0,
  });

  return { otp, otpId };
}

export async function verifyOTP(email: string, otp: string): Promise<boolean> {
  const emailLower = email.toLowerCase().trim();
  const q = query(collection(db, 'otps'), where('email', '==', emailLower), where('otp', '==', otp));
  const snap = await getDocs(q);

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    if (data.expiresAt?.toMillis && data.expiresAt.toMillis() < Date.now()) {
      await deleteDoc(docSnap.ref);
      continue;
    }
    if (data.otp === otp) {
      await deleteDoc(docSnap.ref);
      return true;
    }
  }

  return false;
}

export async function createSession(email: string): Promise<string> {
  const token = crypto.randomUUID();
  const ref = doc(db, 'sessions', token);

  await setDoc(ref, {
    email: email.toLowerCase().trim(),
    token,
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromMillis(Date.now() + SESSION_EXPIRY_MS),
  });

  return token;
}

export async function validateSession(token: string): Promise<EmailOTPSession | null> {
  if (!token) return null;
  const ref = doc(db, 'sessions', token);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const raw = snap.data() as Record<string, any>;
  let expiresAtMs = 0;
  if (raw.expiresAt && typeof raw.expiresAt.toMillis === 'function') {
    expiresAtMs = raw.expiresAt.toMillis();
  } else if (raw.expiresAt) {
    expiresAtMs = new Date(raw.expiresAt).getTime();
  }

  if (expiresAtMs > 0 && expiresAtMs < Date.now()) {
    await deleteDoc(ref);
    return null;
  }

  return {
    email: raw.email || '',
    role: raw.role || 'viewer',
    token: raw.token || token,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    expiresAt: expiresAtMs > 0 ? new Date(expiresAtMs).toISOString() : undefined,
    userAgent: raw.userAgent,
  };
}

export async function destroySession(token: string): Promise<void> {
  if (!token) return;
  await deleteDoc(doc(db, 'sessions', token));
}


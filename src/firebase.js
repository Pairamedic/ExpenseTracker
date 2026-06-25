import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, getToken } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'AIzaSyA2oIL-WXWvzt1Ct256JF0_590CUpdXd_o',
  authDomain: 'billtracker-256ef.firebaseapp.com',
  projectId: 'billtracker-256ef',
  storageBucket: 'billtracker-256ef.firebasestorage.app',
  messagingSenderId: '1031129338488',
  appId: '1:1031129338488:web:836df1828ba619e674938d',
  measurementId: 'G-YYX20TJ1ST',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// VAPID key: Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → Generate key pair
// Add VITE_FCM_VAPID_KEY to GitHub Actions secrets and .env.local
export const FCM_VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY || '';

let _messaging = null;
function getAppMessaging() {
  if (!_messaging) {
    try { _messaging = getMessaging(app); } catch { return null; }
  }
  return _messaging;
}

export async function getFcmToken() {
  if (!FCM_VAPID_KEY) return null;
  try {
    const m = getAppMessaging();
    if (!m) return null;
    return (await getToken(m, { vapidKey: FCM_VAPID_KEY })) || null;
  } catch (err) {
    console.warn('FCM token:', err.message);
    return null;
  }
}

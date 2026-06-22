import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

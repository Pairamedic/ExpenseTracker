import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

// Each user gets a single document: users/{uid}/data/app
// containing all their app data as one JSON blob.
// This keeps reads/writes minimal and avoids complex collection rules.

function userDocRef(uid) {
  return doc(db, 'users', uid, 'data', 'app');
}

export async function loadUserData(uid) {
  const snap = await getDoc(userDocRef(uid));
  return snap.exists() ? snap.data() : null;
}

export async function saveUserData(uid, data) {
  await setDoc(userDocRef(uid), data, { merge: true });
}

export function subscribeUserData(uid, callback) {
  return onSnapshot(userDocRef(uid), (snap) => {
    if (snap.exists()) callback(snap.data());
  });
}

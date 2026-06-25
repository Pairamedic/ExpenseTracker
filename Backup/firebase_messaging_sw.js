// public/firebase-messaging-sw.js
// FCM background message handler — must live at the root of the hosted path.
// For GitHub Pages with base /ExpenseTracker/, it belongs at public/firebase-messaging-sw.js
// and is accessed at /ExpenseTracker/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyA2oIL-WXWvzt1Ct256JF0_590CUpdXd_o',
  authDomain: 'billtracker-256ef.firebaseapp.com',
  projectId: 'billtracker-256ef',
  storageBucket: 'billtracker-256ef.firebasestorage.app',
  messagingSenderId: '1031129338488',
  appId: '1:1031129338488:web:836df1828ba619e674938d',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'Finance Manager';
  const body = payload.notification?.body || payload.data?.body || '';
  self.registration.showNotification(title, {
    body,
    icon: '/ExpenseTracker/app-icon.jpeg',
    badge: '/ExpenseTracker/app-icon.jpeg',
    tag: payload.data?.tag || 'finance-notification',
    data: payload.data,
  });
});

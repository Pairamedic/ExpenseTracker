importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyA2oIL-WXWvzt1Ct256JF0_590CUpdXd_o',
  authDomain: 'billtracker-256ef.firebaseapp.com',
  projectId: 'billtracker-256ef',
  storageBucket: 'billtracker-256ef.firebasestorage.app',
  messagingSenderId: '1031129338488',
  appId: '1:1031129338488:web:836df1828ba619e674938d',
});

const messaging = firebase.messaging();

// Handle messages received while the app is in the background
messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  self.registration.showNotification(notification.title || 'Finance Manager', {
    body: notification.body || '',
    icon: notification.icon || '/ExpenseTracker/app-icon.jpeg',
    badge: '/ExpenseTracker/app-icon.jpeg',
    data: payload.data || {},
  });
});

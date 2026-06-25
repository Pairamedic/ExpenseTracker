# ExpenseTracker — Backup Package

This folder contains everything needed to rebuild, hand off, or re-explain
the app to a new developer or AI tool.

## Contents

| File | Purpose |
|------|---------|
| `README.md` | This file — overview and index |
| `FIREBASE_SETUP.md` | Step-by-step Firebase console setup, security rules, FCM, Cloud Functions, and CI/CD |
| `AI_REBUILD_PROMPT.md` | Copy-paste prompt for AI tools (Claude, GPT-4, etc.) to fully understand and rebuild the app |
| `firestore.rules` | Exact Firestore security rules to paste into the Firebase console |
| `firebase_cloud_function.js` | The Cloud Function (`dailyNotifications`) — paste into `functions/index.js` |
| `firebase_messaging_sw.js` | FCM background service worker — lives in `public/` |

## Quick Reference

- **Live app:** `https://pairamedic.github.io/ExpenseTracker/`
- **Firebase project:** `billtracker-256ef`
- **GitHub repo:** `https://github.com/Pairamedic/ExpenseTracker`
- **Stack:** React 19 + Vite + Firebase (Auth + Firestore + FCM) + GitHub Pages
- **Auth:** Email/password via Firebase Auth
- **Data storage:** localStorage (primary, offline-first) + Firestore (cloud sync)
- **Push notifications:** Firebase Cloud Messaging (FCM) + Web Notifications API
- **PWA:** Full offline support via vite-plugin-pwa

## Architecture in 30 Seconds

```
Browser (React SPA)
  ├── src/context/AppContext.jsx  ← ALL state lives here
  ├── src/utils/firestoreSync.js  ← Firestore read/write
  ├── src/utils/notifications.js  ← FCM + Web Notifications
  └── src/utils/helpers.js        ← formatCurrency, date helpers, HTML export

Firebase
  ├── Auth          ← email/password login
  ├── Firestore     ← users/{uid}/data/app  (single blob per user)
  │                 └── shared/{token}       (read-only snapshots)
  └── Functions     ← dailyNotifications (runs at 8 AM Eastern daily)
```

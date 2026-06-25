# Firebase Setup Guide — ExpenseTracker

Complete instructions for setting up a fresh Firebase project for this app,
or re-configuring an existing one. All values shown are for the current
live project (`billtracker-256ef`).

---

## 1. Create (or Open) the Firebase Project

1. Go to https://console.firebase.google.com
2. Click **Add project** → name it (e.g. `billtracker`)
3. Disable Google Analytics (not needed) → **Create project**

> If using the existing project, go to **Project `billtracker-256ef`** directly.

---

## 2. Enable Authentication

1. In the Firebase console, open **Authentication** → **Get started**
2. Click the **Sign-in method** tab
3. Enable **Email/Password** → Save
4. (Optional) Enable **Google** if you want social login later

---

## 3. Create Firestore Database

1. Open **Firestore Database** → **Create database**
2. Choose **Production mode** (we'll paste the rules next)
3. Pick the region closest to your users (e.g. `us-central`)

### Paste Security Rules

1. Go to **Firestore → Rules** tab
2. Replace all content with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{rest=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /shared/{token} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

3. Click **Publish**

### Data Structure (for reference — the app creates this automatically)

```
users/
  {uid}/
    data/
      app     ← ONE Firestore document containing ALL user data as a JSON object

shared/
  {token}    ← Read-only snapshots for share links (no auth required to read)
```

---

## 4. Get Firebase Config Values

1. Open **Project Settings** (gear icon) → **General** tab
2. Scroll to **Your apps** → click the web app (`</>`)
3. Copy the `firebaseConfig` object:

```js
// src/firebase.js — paste your values here
const firebaseConfig = {
  apiKey: "...",
  authDomain: "....firebaseapp.com",
  projectId: "...",
  storageBucket: "....firebasestorage.app",
  messagingSenderId: "...",
  appId: "...",
};
```

**Current live values (billtracker-256ef):**
```js
const firebaseConfig = {
  apiKey: 'AIzaSyA2oIL-WXWvzt1Ct256JF0_590CUpdXd_o',
  authDomain: 'billtracker-256ef.firebaseapp.com',
  projectId: 'billtracker-256ef',
  storageBucket: 'billtracker-256ef.firebasestorage.app',
  messagingSenderId: '1031129338488',
  appId: '1:1031129338488:web:836df1828ba619e674938d',
};
```

---

## 5. Firebase Cloud Messaging (FCM) — Push Notifications

### 5a. Generate Web Push (VAPID) Key

1. Go to **Project Settings → Cloud Messaging** tab
2. Scroll to **Web configuration → Web Push certificates**
3. Click **Generate key pair** (or **Add certificate** if you have one)
4. Copy the **Key pair** string — this is the VAPID key

**Current VAPID key:**
```
bdUnK4mtP19w7NtBQniJNN39vroY5Q4lRHefPiSkc9M
```

5. Paste it into `src/utils/notifications.js`:
```js
const VAPID_KEY = 'YOUR_VAPID_KEY_HERE';
```

### 5b. Service Worker

The file `public/firebase-messaging-sw.js` must contain the Firebase config
(see `firebase_messaging_sw.js` in this Backup folder).
It handles push notifications when the app is in the background.

**Important:** This file must be served at `/ExpenseTracker/firebase-messaging-sw.js`
(the Vite base path prefix). It lives in `public/` so Vite copies it as-is to `dist/`.

---

## 6. Firebase Cloud Functions (Always-On Daily Notifications)

> **Requires Firebase Blaze (pay-as-you-go) plan.** The free Spark plan does not
> support Cloud Functions. Blaze has a generous free tier — you will not be charged
> for this app's usage.

### 6a. Upgrade to Blaze Plan

1. In the Firebase console, click **Upgrade** (bottom left)
2. Select **Blaze** → set a budget alert ($5/month is plenty)

### 6b. Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 6c. Deploy the Cloud Function

The function code is in `functions/index.js` (copy from `firebase_cloud_function.js`
in this Backup folder).

```bash
cd /path/to/ExpenseTracker
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 6d. What the Function Does

Runs daily at **8:00 AM Eastern** via Cloud Scheduler:
- Iterates all users in Firestore
- For each user with an FCM token stored:
  - Checks bills: sends **overdue** or **due tomorrow** push notifications
  - Checks commitments: sends **expiring in N days** notifications
  - Optionally sends **work shift log reminder**
- Cleans up stale/invalid FCM tokens automatically

### 6e. Verify It Deployed

1. Go to **Firebase console → Functions**
2. You should see `dailyNotifications` listed
3. In **Cloud Scheduler** (GCP console), verify the job is created

---

## 7. Firebase Hosting (Optional — App Uses GitHub Pages)

The app is currently deployed to **GitHub Pages**, not Firebase Hosting.
If you ever want to switch to Firebase Hosting:

```bash
firebase init hosting
# Set public directory to: dist
# Configure as SPA: Yes
# Overwrite index.html: No
firebase deploy --only hosting
```

Update `vite.config.js` base to `'/'` if hosting at root (no subdirectory).
Update `public/firebase-messaging-sw.js` icon paths to remove `/ExpenseTracker/` prefix.

---

## 8. GitHub Actions CI/CD

The workflow at `.github/workflows/deploy.yml` auto-deploys on push to `main`.

### Required GitHub Secrets

Go to your repo → **Settings → Secrets and variables → Actions** and add:

| Secret name | Where to get it |
|-------------|----------------|
| `FIREBASE_TOKEN` | Run `firebase login:ci` in terminal, copy the token |

> The Firebase config values (API key, etc.) are public and safe to hardcode
> in `src/firebase.js`. Firebase security is enforced by Firestore Rules and
> Auth — the API key alone cannot access user data.

---

## 9. Local Development

```bash
# Clone the repo
git clone https://github.com/Pairamedic/ExpenseTracker.git
cd ExpenseTracker

# Install dependencies
npm install

# Run dev server
npm run dev
# App is at http://localhost:5173/ExpenseTracker/

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 9b. Firebase Storage Setup (for file attachments)

The app stores bill receipts and income documents (W-2s, paystubs) in Firebase Storage.

1. In the Firebase console, open **Storage** → **Get started**
2. Start in **Production mode** → choose the same region as Firestore → Done
3. Deploy the storage security rules:
```bash
firebase deploy --only storage
```
The `storage.rules` file at the repo root contains the correct rules:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

File paths in storage:
- Bill receipts:  `users/{uid}/bills/{billId}/{fileId}.{ext}`
- Income docs:    `users/{uid}/income/{incomeId}/{fileId}.{ext}`

---

## 10. Firestore Indexes

No manual indexes required. The app uses a single-document-per-user pattern,
so all queries are reads of the entire `users/{uid}/data/app` document.
`firestore.indexes.json` remains empty.

---

## 11. Environment Variables

The app uses **no `.env` file** — all Firebase config is hardcoded in `src/firebase.js`
(the values are public client-side identifiers, not secrets).

The only exception is `VITE_FCM_VAPID_KEY` — if you prefer not to hardcode the VAPID key,
you can set it as a GitHub Actions secret and reference it in `vite.config.js`:
```js
define: { 'import.meta.env.VITE_FCM_VAPID_KEY': JSON.stringify(process.env.VITE_FCM_VAPID_KEY) }
```

---

## Quick Reference Card

```
Project ID:        billtracker-256ef
Auth method:       Email/Password
Firestore region:  us-central1
Functions runtime: Node 20
Deploy target:     GitHub Pages (branch: gh-pages)
Base path:         /ExpenseTracker/
Live URL:          https://pairamedic.github.io/ExpenseTracker/
Share URL pattern: https://pairamedic.github.io/ExpenseTracker/share/{token}
```

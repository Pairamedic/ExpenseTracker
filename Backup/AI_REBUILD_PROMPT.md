# AI Rebuild Prompt — ExpenseTracker

Copy and paste the section below as your **first message** to any AI coding assistant
(Claude, ChatGPT, Gemini, Copilot, etc.) when starting a new session on this codebase.
It gives the AI full context so you can jump straight into changes without back-and-forth.

---

## PASTE THIS BLOCK TO YOUR AI

```
You are helping me maintain and extend a personal finance PWA called "Finance Manager"
(repo: Pairamedic/ExpenseTracker, GitHub Pages at https://pairamedic.github.io/ExpenseTracker/).

=== TECH STACK ===
- React 19 + Vite 8, deployed to GitHub Pages
- React Router v7 (basename="/ExpenseTracker")
- Tailwind CSS 4 + custom CSS variables for theming (dark/light mode)
- Firebase: Auth (email/password), Firestore (data sync), FCM (push notifications)
- Recharts for charts, Lucide React for icons, vite-plugin-pwa for offline/PWA

=== FIREBASE PROJECT ===
Project ID: billtracker-256ef
Auth domain: billtracker-256ef.firebaseapp.com
Storage bucket: billtracker-256ef.firebasestorage.app
Messaging sender ID: 1031129338488
App ID: 1:1031129338488:web:836df1828ba619e674938d
VAPID key: bdUnK4mtP19w7NtBQniJNN39vroY5Q4lRHefPiSkc9M
FCM service worker path: /ExpenseTracker/firebase-messaging-sw.js
All config is in src/firebase.js (no .env needed for these public values).

=== DATA ARCHITECTURE ===
Offline-first: ALL state lives in localStorage. Firestore is a cloud backup/sync layer.
- User data: Firestore at  users/{uid}/data/app  (ONE document per user, full JSON blob)
- Shared views: Firestore at  shared/{token}  (public-read, auth-write snapshots)
- Sync: debounced 1500ms write after any state change (src/utils/firestoreSync.js)
- On login: load from Firestore → merge into localStorage → subscribe to live updates

=== FIRESTORE SECURITY RULES ===
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

=== GLOBAL STATE (src/context/AppContext.jsx) ===
ALL app state is managed in AppContext. Every page consumes it via useApp().
State arrays (each stored by localStorage key and synced to Firestore):

bills[]          - Recurring/one-time bills
  { id, name, amount, dueDay, category, isRecurring, isPermanent, person,
    paymentUrl, notes, statusMonths:{[mk]:'paid'|'skipped'|'unpaid'},
    paidMonths:{[mk]:true} }

income[]         - Income sources
  { id, source, amount, frequency ('weekly'|'biweekly'|'monthly'),
    isRecurring, startDate, endDate, person, notes, jobId, grossAmount }

debts[]          - Debt accounts
  { id, name, balance, minPayment, interestRate, person, notes }

savings[]        - Savings goals
  { id, name, balance, target, monthlyContribution, person, notes }

purchases[]      - Spending transactions
  { id, merchant, amount, category, date, person, notes, isRecurring,
    templateId, tags }

commitments[]    - Goals/to-dos with deadlines
  { id, description, amount, endDate, completed, person, notes }

plannedExpenses[] - Future expenses drawn from savings
  { id, name, amount, date, savingsId, notes }

jobs[]           - Job definitions for shift tracking
  { id, name, hourlyRate, defaultHours, color }

shifts[]         - Work time entries
  { id, jobId, date, startTime, endTime, hours, notes }

budgetCategories[] - Envelope budget categories
  { id, name, monthlyLimit, color, icon }

budgetSpends[]   - Spending within budget envelopes
  { id, categoryId, amount, month, description, date }

shoppingLists[]  - Grocery/to-do lists
  { id, name, type ('shopping'|'todo'), archived, createdAt, color,
    notes, dueDate, dueTime, notifEnabled }

shoppingItems[]  - Items within lists
  { id, listId, text, done, price, quantity, dueDate, dueTime,
    notifEnabled, priority }

agreements[]     - Partner/shared agreements
  { id, title, description, date, parties, signed, notes }

notes[]          - Freeform notes
  { id, title, body, pinned, dashboardPinned, reminder, billId, color }

planningSettings - Tax/retirement config object
  { filingStatus, state, iraContribution, rothContribution, k401Rate,
    employerMatch, ptoBalance, ptoDays, ptoHours ... }

recurringTemplates[] - Auto-purchase templates
  { id, merchant, amount, category, person, dayOfMonth, notes }

paycheckActuals[] - Recorded paycheck history
  { id, date, gross, net, jobId, notes }

notifPrefs       - Notification preferences
  { bills: { overdue, dayBefore, sameDay },
    commitments: { expiring, daysBefore },
    todos: { itemDue, morningEnabled, morningTime, afternoonEnabled, afternoonTime },
    lists: { notifEnabled },
    shifts: { reminder, reminderTime } }

settings         - User preferences
  { myName, spouseName, spouseEnabled, lightMode, currency,
    shareToken, shareEnabled, shareRefreshAt }

fcmToken         - Firebase Cloud Messaging device token (string|null)
cloudLoaded      - boolean: Firestore data has been loaded

Key helper: monthKey(date) → "YYYY-MM" string used everywhere as month identifier (mk).

=== MUTATION PATTERN ===
Every state array has: add{Entity}, update{Entity}, delete{Entity} functions
exported from AppContext and consumed via useApp().
Example: addBill(data), updateBill(id, data), deleteBill(id)
All mutations update localStorage immediately and trigger debounced Firestore write.

=== ROUTING (src/App.jsx) ===
BrowserRouter basename="/ExpenseTracker"
Public (no auth):  /share/:token  → SharedView
Protected (auth):
  /           → Dashboard
  /bills      → BillsDebts
  /income     → Income (tabs: Income | Planning | Work Time)
  /purchases  → Purchases
  /lists      → ShoppingLists
  /notes      → Notes
  /settings   → Settings
  /search     → SearchPage
  /work       → WorkTime (also embedded in Income page)
  /planning   → Planning (also embedded in Income page)
  /debts      → redirects to /bills

=== PAGES ===
Dashboard.jsx     - Home with income vs bills bar, available-to-spend, net worth,
                    envelope budget ring, spending trend chart, commitments list,
                    pinned notes, next paycheck card, quick-add buttons
BillsDebts.jsx    - Bills tab + Debts tab, monthly status (paid/skipped/unpaid),
                    filters, paymentUrl links, debt payoff calculator
Income.jsx        - Income source list with monthly totals, frequency badges;
                    embedded Planning tab and WorkTime tab
Purchases.jsx     - Transaction history by month, category summary, recurring
                    template manager, CSV export/import
ShoppingLists.jsx - Grocery + to-do lists, items with checkboxes, due dates,
                    per-item notifications, list archival
Notes.jsx         - Notes with pinning, dashboard pinning, reminder dates, bill links
WorkTime.jsx      - Shift log with custom pay periods, paycheck calculator,
                    tax/deduction breakdown, OT calculation
Planning.jsx      - Federal + Arkansas tax calc, 401k/IRA/Roth projections, PTO tracker
Settings.jsx      - Profile names, theme, notification prefs (with time pickers),
                    export (CSV/JSON/HTML), import, data backup, push notification setup,
                    share link manager
SharedView.jsx    - Read-only icon grid: 6 tile buttons (Income, Bills, Spending,
                    Savings, Debts, Lists), each opens a slide-up bottom drawer
                    with full data. Net worth summary bar at top.
Search.jsx        - Global search across purchases, bills, income, notes, debts

=== COMPONENTS ===
BillForm.jsx           - name, amount, dueDay, category, paymentUrl, person, recurring
IncomeForm.jsx         - source, amount, frequency, startDate, person, jobId, grossAmount
DebtForm.jsx           - name, balance, minPayment, interestRate, person
SavingsForm.jsx        - name, balance, target, monthlyContribution
PurchaseForm.jsx       - merchant, amount, category, date, person, notes
CommitmentForm.jsx     - description, amount, endDate, person
PlannedExpenseForm.jsx - name, amount, date, savingsId
Modal.jsx              - overlay wrapper with close button, title prop
BottomNav.jsx          - fixed nav bar: Home, Bills, Spending, Income, Lists, Search

=== NOTIFICATIONS (src/utils/notifications.js) ===
sendNotification(title, options)  - Web Notifications API (in-app)
requestNotificationPermission()   - prompt user
registerFCMToken()                - register with FCM, returns device token
onForegroundMessage(cb)           - FCM foreground listener

In-app schedulers (useEffect hooks in AppContext):
- Bill overdue: fires if bill.dueDay < today
- Bill day-before: fires if bill.dueDay === tomorrow
- Bill same-day: fires at 8 AM via setTimeout
- Commitment expiry: fires N days before endDate (configurable)
- To-do morning reminder: fires at notifPrefs.todos.morningTime (default 08:00)
- To-do afternoon reminder: fires at notifPrefs.todos.afternoonTime (default 16:00)
- Shift log reminder: fires at notifPrefs.shifts.reminderTime

Cloud (always-on) via Firebase Cloud Function (functions/index.js):
- Runs daily at 8 AM Eastern
- Checks bills and commitments for all users with fcmTokens
- Sends push via FCM Admin SDK

=== THEMING ===
CSS variables in src/index.css control all colors. Dark mode is default.
Light mode activated by adding class "light" to <html>.
Key variables:
  --bg, --surface, --surface2, --border
  --text, --muted, --subtle
  --accent, --accent-text
  --positive-text (green for income/positive)
  --danger (red for overdue/negative)

All UI uses inline styles with these variables — no Tailwind classes in component JSX
(Tailwind is used only for layout utilities like min-h-screen).

=== EXPORT SYSTEM (src/utils/helpers.js) ===
exportAsHTML({ bills, income, debts, savings, purchases, commitments,
               plannedExpenses, budgetCategories, budgetSpends,
               shoppingLists, shoppingItems, settings, mk, include })
Returns an HTML string with styled sections. `include` is an array of section keys
to include: 'bills','income','debts','savings','purchases','budget','lists'.
Settings.myName / Settings.spouseName replace "Me" / "Spouse" throughout.

=== SHARED VIEW ===
Share link: https://pairamedic.github.io/ExpenseTracker/share/{token}
Token stored in settings.shareToken, snapshot saved to Firestore shared/{token}.
Snapshot built by buildSnapshot() in AppContext — includes bills, income, purchases,
debts, savings, commitments, shoppingLists, shoppingItems.
SharedView.jsx reads the snapshot and renders read-only icon grid with drawers.
No auth required to view a share link.

=== KNOWN PATTERNS & GOTCHAS ===
1. monthKey format is "YYYY-MM". Always use the monthKey() helper, never roll your own.
2. Bill status: check statusMonths[mk] first, then paidMonths[mk] for legacy compat.
3. Income frequency multipliers: weekly=4.33, biweekly=2.17, monthly=1.
4. availableToSpend = monthlyIncome - totalBills - totalDebtMins
                     - activePlannedTotal - totalEnvelopeSpent.
   CRITICAL: totalEnvelopeSpent must be declared BEFORE availableToSpend to avoid
   a JavaScript temporal dead zone ReferenceError (learned from production bug).
5. getIncomeForMonth(income, mk) filters recurring items valid for the month AND
   non-recurring items that match the month exactly.
6. All forms use controlled React state with onSave(data) callback.
7. The Modal component wraps forms — use <Modal title="..." onClose={...}>.
8. Firestore writes are debounced: rapid state changes batch into one write.
9. For PWA service worker updates: vite-plugin-pwa with registerType:'autoUpdate'.
10. GitHub Actions deploys on push to main: builds with Vite, deploys to gh-pages branch.

=== DEPLOYMENT ===
GitHub Actions (.github/workflows/deploy.yml):
  1. npm ci
  2. npm run build  (outputs dist/)
  3. Deploy dist/ to gh-pages branch via peaceiris/actions-gh-pages
Firebase Functions:
  cd functions && npm install
  firebase deploy --only functions  (requires Blaze plan)
Firestore rules:
  firebase deploy --only firestore:rules

=== CURRENT USERS ===
Primary: configured as settings.myName (default "Me")
Partner: configured as settings.spouseName (default "Spouse"), enabled via settings.spouseEnabled
Items have a `person` field: 'me' | 'spouse' | 'joint'
```

---

## Additional Context Tips

When starting a session with the AI, also paste any of these as needed:

**If fixing a bug:** Describe which page, what the symptom is, and what data
is involved. Example: "On the Dashboard, availableToSpend shows NaN when
budgetCategories is empty."

**If adding a feature:** Name the page it belongs on, what data entities it
touches, and whether it needs to be persisted (and to which state array).

**If the AI seems confused about file structure:** Tell it to read
`src/context/AppContext.jsx` (the full source of truth for all state) and
the specific page file. Every state array, mutation, and setting is there.

**If there are merge conflicts:** The most common conflict point is
`src/context/AppContext.jsx` because it's edited frequently. Conflicts usually
happen in the `useApp()` destructure line or in the debounced sync `useEffect`.
Always resolve by merging both sets of additions — never drop either side.

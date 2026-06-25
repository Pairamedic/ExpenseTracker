const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { onSchedule } = require('firebase-functions/v2/scheduler');

initializeApp();

const db = getFirestore();
const messaging = getMessaging();

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getBillStatus(bill, mk) {
  if (bill.statusMonths?.[mk]) return bill.statusMonths[mk];
  if (bill.paidMonths?.[mk]) return 'paid';
  if (bill.isPermanent) return 'paid';
  return 'unpaid';
}

// Runs every morning at 8 AM Eastern — checks all users' bills and sends push notifications
exports.billReminders = onSchedule(
  { schedule: 'every day 08:00', timeZone: 'America/New_York' },
  async () => {
    const today = new Date();
    const todayDay = today.getDate();
    const mk = monthKey(today);

    const userRefs = await db.collection('users').listDocuments();

    await Promise.all(
      userRefs.map(async (userRef) => {
        try {
          const snap = await userRef.collection('data').doc('app').get();
          if (!snap.exists) return;

          const data = snap.data();
          const token = data.fcmToken;
          if (!token) return;

          const bills = data.bills || [];
          const dueSoon = bills.filter((b) => {
            if (!b.dueDay) return false;
            const isThisMonth = b.isRecurring || b.month === mk;
            if (!isThisMonth) return false;
            const status = getBillStatus(b, mk);
            if (status === 'paid') return false;
            const diff = b.dueDay - todayDay;
            return diff >= 0 && diff <= 3;
          });

          if (dueSoon.length === 0) return;

          await Promise.all(
            dueSoon.map((b) => {
              const diff = b.dueDay - todayDay;
              const when = diff === 0 ? 'today' : diff === 1 ? 'tomorrow' : `in ${diff} days`;
              return messaging.send({
                token,
                notification: {
                  title: 'Bill Due Soon',
                  body: `${b.name} — $${(b.amount || 0).toFixed(2)} due ${when}`,
                },
                webpush: {
                  notification: {
                    icon: 'https://pairamedic.github.io/ExpenseTracker/app-icon.jpeg',
                    badge: 'https://pairamedic.github.io/ExpenseTracker/app-icon.jpeg',
                  },
                },
              });
            })
          );
        } catch (err) {
          console.error(`Failed for user ${userRef.id}:`, err.message);
        }
      })
    );
  }
);

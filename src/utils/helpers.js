export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
}

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(key) {
  const [year, month] = key.split('-');
  return new Date(+year, +month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function currentMonthKey() {
  return monthKey(new Date());
}

export function getDueDateLabel(dayOfMonth) {
  if (!dayOfMonth) return '';
  const today = new Date().getDate();
  const diff = dayOfMonth - today;
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  return `Due in ${diff}d`;
}

export function getDueDateColor(dayOfMonth, isPaid) {
  if (isPaid) return 'text-emerald-400';
  const today = new Date().getDate();
  const diff = dayOfMonth - today;
  if (diff < 0) return 'text-red-400';
  if (diff <= 3) return 'text-amber-400';
  return 'text-slate-400';
}

// New 3-state bill status helpers
export function getBillStatus(bill, mk) {
  if (bill.statusMonths?.[mk]) return bill.statusMonths[mk];
  // Backward compat with old paidMonths boolean
  if (bill.paidMonths?.[mk]) return 'paid';
  return 'unpaid';
}

export function nextBillStatus(current) {
  if (current === 'unpaid') return 'pending';
  if (current === 'pending') return 'paid';
  return 'unpaid';
}

export function getBillStatusColor(status, dueDay) {
  if (status === 'paid') return 'text-emerald-400';
  if (status === 'pending') return 'text-amber-400';
  if (dueDay) {
    const today = new Date().getDate();
    const diff = dueDay - today;
    if (diff < 0) return 'text-red-400';
    if (diff <= 3) return 'text-orange-400';
  }
  return 'text-slate-400';
}

export function isBillOverdueUnpaid(bill, mk) {
  const status = getBillStatus(bill, mk);
  if (status === 'paid') return false;
  if (!bill.dueDay) return false;
  const today = new Date();
  const currentMk = monthKey(today);
  if (mk !== currentMk) return false;
  return bill.dueDay < today.getDate();
}

export function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getBillsForMonth(allBills, mk) {
  return allBills.filter((b) => b.isRecurring || b.month === mk);
}

export function getIncomeForMonth(allIncome, mk) {
  return allIncome.filter((i) => i.isRecurring || i.month === mk);
}

export function getPayDatesForMonth(item, mk) {
  if (!item.startDate || item.frequency === 'monthly') return [];
  const [year, month] = mk.split('-').map(Number);
  const intervalDays = item.frequency === 'weekly' ? 7 : 14;
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const start = new Date(item.startDate + 'T12:00:00');
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);

  const daysToMonthStart = (monthStart - start) / MS_PER_DAY;
  let n = daysToMonthStart <= 0 ? 0 : Math.ceil(daysToMonthStart / intervalDays);

  const dates = [];
  let candidate = new Date(start.getTime() + n * intervalDays * MS_PER_DAY);
  while (candidate <= monthEnd) {
    if (candidate >= monthStart) dates.push(new Date(candidate));
    n++;
    candidate = new Date(start.getTime() + n * intervalDays * MS_PER_DAY);
  }
  return dates;
}

export function getNextPayDate(item) {
  if (!item.startDate || item.frequency === 'monthly') return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const intervalDays = item.frequency === 'weekly' ? 7 : 14;
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const start = new Date(item.startDate + 'T12:00:00');

  const daysFromStart = Math.floor((today - start) / MS_PER_DAY);
  const n = Math.max(0, Math.floor(daysFromStart / intervalDays));

  for (let i = 0; i <= 1; i++) {
    const candidate = new Date(start.getTime() + (n + i) * intervalDays * MS_PER_DAY);
    candidate.setHours(0, 0, 0, 0);
    if (candidate >= today) {
      return { date: candidate, daysUntil: Math.round((candidate - today) / MS_PER_DAY) };
    }
  }

  const next = new Date(start.getTime() + (n + 1) * intervalDays * MS_PER_DAY);
  next.setHours(0, 0, 0, 0);
  return { date: next, daysUntil: Math.round((next - today) / MS_PER_DAY) };
}

export function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function isReminderOverdue(reminderDate) {
  if (!reminderDate) return false;
  return new Date(reminderDate + 'T23:59:59') < new Date();
}

export function isReminderSoon(reminderDate) {
  if (!reminderDate) return false;
  const d = new Date(reminderDate + 'T23:59:59');
  const now = new Date();
  const diff = (d - now) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 3;
}

// ── CSV Export ──
export function exportToCSV(data, filename) {
  const rows = [Object.keys(data[0])];
  data.forEach((row) => rows.push(Object.values(row).map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)));
  const csv = rows.map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function exportAllData({ bills, income, debts, savings, purchases }) {
  const ts = new Date().toISOString().slice(0, 10);
  if (bills.length) exportToCSV(bills.map((b) => ({ name: b.name, amount: b.amount, category: b.category, owner: b.owner, dueDay: b.dueDay || '', isRecurring: b.isRecurring })), `bills-${ts}.csv`);
  if (income.length) exportToCSV(income.map((i) => ({ name: i.name, amount: i.amount, frequency: i.frequency, owner: i.owner || '' })), `income-${ts}.csv`);
  if (debts.length) exportToCSV(debts.map((d) => ({ name: d.name, balance: d.balance, minPayment: d.minPayment, interestRate: d.interestRate || '', owner: d.owner })), `debts-${ts}.csv`);
  if (savings.length) exportToCSV(savings.map((s) => ({ name: s.name, balance: s.balance, goal: s.goal || '' })), `savings-${ts}.csv`);
  if (purchases.length) exportToCSV(purchases.map((p) => ({ date: p.date, merchant: p.merchant, amount: p.amount, category: p.category, person: p.person, notes: p.notes || '' })), `spending-${ts}.csv`);
}

// ── Debt payoff calculator ──
export function calcDebtPayoff(balance, annualRate, monthlyPayment) {
  if (!balance || !monthlyPayment) return null;
  const rate = (annualRate || 0) / 100 / 12;
  if (monthlyPayment <= balance * rate) return null; // payment too low to payoff
  let bal = balance;
  let months = 0;
  let totalInterest = 0;
  while (bal > 0 && months < 600) {
    const interest = bal * rate;
    totalInterest += interest;
    bal = bal + interest - monthlyPayment;
    months++;
    if (bal < 0) bal = 0;
  }
  const payoffDate = new Date();
  payoffDate.setMonth(payoffDate.getMonth() + months);
  return { months, totalInterest, payoffDate };
}

// ── Spending per month (last N months) ──
export function getSpendingHistory(purchases, months = 6) {
  const result = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const mk = monthKey(d);
    const total = purchases.filter((p) => p.date?.startsWith(mk)).reduce((s, p) => s + p.amount, 0);
    result.push({ month: d.toLocaleDateString('en-US', { month: 'short' }), amount: total, mk });
  }
  return result;
}

// ── Category totals for a month ──
export function getCategoryTotals(purchases, mk) {
  const map = {};
  purchases.filter((p) => p.date?.startsWith(mk)).forEach((p) => {
    map[p.category] = (map[p.category] || 0) + p.amount;
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => ({ cat, amt }));
}

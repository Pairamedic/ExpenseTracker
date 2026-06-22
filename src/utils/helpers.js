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
  if (bill.isPermanent) return 'paid';
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

export function exportAsHTML({ bills, income, debts, savings, purchases, commitments = [], plannedExpenses = [], include = null }) {
  const ts = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const fmt = (n) => '$' + (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const inc = (key) => !include || include.includes(key);

  const table = (headers, rows) => `
    <table>
      <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;

  const section = (title, content) => `
    <section>
      <h2>${title}</h2>
      ${content}
    </section>`;

  const ownerLabel = (o) => o === 'mine' ? 'Aaron' : o === 'partner' ? 'Cameron' : o ? o.charAt(0).toUpperCase() + o.slice(1) : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Expense Tracker Export — ${ts}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #111; background: #fff; padding: 2rem; }
  h1 { font-size: 1.75rem; font-weight: 800; margin-bottom: 0.25rem; }
  .subtitle { color: #666; font-size: 0.875rem; margin-bottom: 2rem; }
  section { margin-bottom: 2.5rem; page-break-inside: avoid; }
  h2 { font-size: 1rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #444; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; margin-bottom: 1rem; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; padding: 0.5rem 0.75rem; background: #f3f4f6; font-weight: 700; color: #374151; border: 1px solid #e5e7eb; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
  td { padding: 0.5rem 0.75rem; border: 1px solid #e5e7eb; color: #111; vertical-align: top; }
  tr:nth-child(even) td { background: #f9fafb; }
  .badge { display: inline-block; padding: 0.1rem 0.5rem; border-radius: 0.375rem; font-size: 11px; font-weight: 700; }
  .badge-paid { background: #d1fae5; color: #065f46; }
  .badge-pending { background: #fef3c7; color: #92400e; }
  .badge-unpaid { background: #fee2e2; color: #991b1b; }
  .badge-aaron { background: #e0e7ff; color: #3730a3; }
  .badge-cameron { background: #ede9fe; color: #5b21b6; }
  .badge-joint { background: #d1fae5; color: #065f46; }
  .amount { font-weight: 700; font-variant-numeric: tabular-nums; }
  .amount-neg { color: #dc2626; }
  .amount-pos { color: #059669; }
  @media print {
    body { padding: 1rem; }
    section { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<h1>Expense Tracker</h1>
<p class="subtitle">Exported on ${ts}</p>

${inc('bills') && bills.length ? section('Bills', table(
  ['Name', 'Amount', 'Category', 'Owner', 'Due Day', 'Recurring'],
  bills.map((b) => [
    b.name,
    `<span class="amount">${fmt(b.amount)}</span>`,
    b.category || '—',
    `<span class="badge badge-${(b.owner === 'mine' ? 'aaron' : b.owner === 'partner' ? 'cameron' : b.owner) || 'aaron'}">${ownerLabel(b.owner)}</span>`,
    b.dueDay ? `Day ${b.dueDay}` : '—',
    b.isRecurring ? 'Yes' : 'No',
  ])
) : ''}

${inc('income') && income.length ? section('Income', table(
  ['Name', 'Amount', 'Frequency', 'Person'],
  income.map((i) => [
    i.name,
    `<span class="amount amount-pos">${fmt(i.amount)}</span>`,
    i.frequency || '—',
    i.person === 'spouse' ? 'Cameron' : 'Aaron',
  ])
) : ''}

${inc('debts') && debts.length ? section('Debts', table(
  ['Name', 'Balance', 'Min Payment', 'Interest Rate', 'Owner'],
  debts.map((d) => [
    d.name,
    `<span class="amount amount-neg">${fmt(d.balance)}</span>`,
    `<span class="amount">${fmt(d.minPayment)}/mo</span>`,
    d.interestRate != null ? `${d.interestRate}% APR` : '—',
    `<span class="badge badge-${(d.owner === 'mine' ? 'aaron' : d.owner === 'partner' ? 'cameron' : d.owner) || 'aaron'}">${ownerLabel(d.owner)}</span>`,
  ])
) : ''}

${inc('savings') && savings.length ? section('Savings', table(
  ['Name', 'Balance', 'Goal', 'Progress'],
  savings.map((s) => [
    s.name,
    `<span class="amount amount-pos">${fmt(s.balance)}</span>`,
    s.goal ? fmt(s.goal) : '—',
    s.goal ? `${Math.min(100, Math.round((s.balance / s.goal) * 100))}%` : '—',
  ])
) : ''}

${inc('commitments') && commitments.length ? section('Commitments', table(
  ['Description', 'Amount', 'Person', 'End Date', 'Status'],
  commitments.map((c) => [
    c.description,
    c.amount ? `<span class="amount">${fmt(c.amount)}</span>` : '—',
    c.person === 'me' ? 'Me' : c.person === 'partner' ? 'Cameron' : 'Both',
    c.endDate ? new Date(c.endDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
    c.completed ? '<span class="badge badge-paid">Done</span>' : '<span class="badge badge-unpaid">Open</span>',
  ])
) : ''}

${inc('planned') && plannedExpenses.length ? section('Planned Expenses', table(
  ['Name', 'Amount', 'Target Date', 'From Savings', 'Notes'],
  plannedExpenses.map((pe) => [
    pe.name,
    `<span class="amount amount-neg">${fmt(pe.amount)}</span>`,
    pe.targetDate ? new Date(pe.targetDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
    pe.fromSavingsId || '—',
    pe.notes || '',
  ])
) : ''}

${inc('purchases') && purchases.length ? section('Spending', table(
  ['Date', 'Merchant', 'Amount', 'Category', 'Person', 'Notes'],
  purchases.map((p) => [
    p.date || '—',
    p.merchant || '—',
    `<span class="amount amount-neg">${fmt(p.amount)}</span>`,
    p.category || '—',
    p.person === 'spouse' || p.person === 'cameron' ? 'Cameron' : 'Aaron',
    p.notes || '',
  ])
) : ''}

</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `expense-tracker-${new Date().toISOString().slice(0, 10)}.html`;
  a.click();
  URL.revokeObjectURL(url);
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

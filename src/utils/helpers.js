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

export function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getBillsForMonth(allBills, mk) {
  return allBills.filter((b) => b.isRecurring || b.month === mk);
}

export function getIncomeForMonth(allIncome, mk) {
  return allIncome.filter((i) => i.isRecurring || i.month === mk);
}

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

// Returns pay dates (Date objects) for a biweekly/weekly income item within a given month
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

// Returns { date, daysUntil } for the next upcoming pay date for an income item
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

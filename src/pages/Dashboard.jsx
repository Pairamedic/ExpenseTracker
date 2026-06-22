import { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, TrendingUp, Receipt, CreditCard,
  CalendarDays, Plus, Pencil, Trash2, CheckSquare, Square,
  MoreVertical, Bell, LayoutDashboard, Link, Plane, AlertTriangle,
  Wallet, PiggyBank, Settings, BarChart2, Users, LayoutGrid,
} from 'lucide-react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useApp } from '../context/AppContext';
import {
  formatCurrency, monthKey, monthLabel, getBillsForMonth, getIncomeForMonth,
  getPayDatesForMonth, getNextPayDate, getBillStatus, isBillOverdueUnpaid,
  isReminderOverdue, isReminderSoon, formatDate, getSpendingHistory, getCategoryTotals,
} from '../utils/helpers';
import Modal from '../components/Modal';
import SavingsForm from '../components/SavingsForm';
import CommitmentForm from '../components/CommitmentForm';
import PlannedExpenseForm from '../components/PlannedExpenseForm';

function monthOffset(mk, offset) {
  const [y, m] = mk.split('-').map(Number);
  return monthKey(new Date(y, m - 1 + offset, 1));
}

function monthlyAmount(item) {
  const mult = item.frequency === 'weekly' ? 4.33 : item.frequency === 'biweekly' ? 2.17 : 1;
  return item.amount * mult;
}

function formatDateShort(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function SectionLabel({ children }) {
  return <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--subtle)', marginBottom: '0.75rem' }}>{children}</p>;
}

function SavingCard({ saving, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pct = saving.goal ? Math.min(100, (saving.balance / saving.goal) * 100) : null;

  return (
    <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: '700', color: 'var(--text)' }}>{saving.name}</p>
          {saving.notes && <p style={{ fontSize: '0.75rem', color: 'var(--subtle)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.125rem' }}>{saving.notes}</p>}
          {pct !== null ? (
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--subtle)', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: '600', color: 'var(--text)' }}>{formatCurrency(saving.balance)}</span>
                <span>Goal: {formatCurrency(saving.goal)}</span>
              </div>
              <div style={{ height: '0.5rem', backgroundColor: 'var(--surface2)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', backgroundColor: 'var(--positive-text)', borderRadius: '9999px', width: `${pct}%`, transition: 'width 0.3s' }} />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--subtle)', marginTop: '0.25rem' }}>{pct.toFixed(0)}% of goal</p>
            </div>
          ) : (
            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--positive-text)', marginTop: '0.25rem' }}>{formatCurrency(saving.balance)}</p>
          )}
          {saving.monthlyContribution && (
            <p style={{ fontSize: '0.75rem', color: 'var(--subtle)', marginTop: '0.25rem' }}>+{formatCurrency(saving.monthlyContribution)}/mo</p>
          )}
        </div>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ padding: '0.375rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '0.5rem' }}>
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setMenuOpen(false)} />
              <div style={{ position: 'absolute', right: 0, zIndex: 50, backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', overflow: 'hidden', minWidth: '9rem', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                <button onClick={() => { onEdit(saving); setMenuOpen(false); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.875rem 1rem', fontSize: '0.875rem', color: 'var(--text)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <Pencil size={14} /> Edit
                </button>
                <button onClick={() => { onDelete(saving.id); setMenuOpen(false); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.875rem 1rem', fontSize: '0.875rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CommitmentRow({ commitment, onToggle, onEdit, onDelete, myLabel, partnerLabel }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const personLabel = commitment.person === 'me' ? myLabel : commitment.person === 'partner' ? partnerLabel : 'Both';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', opacity: commitment.completed ? 0.5 : 1 }}>
      <button onClick={() => onToggle(commitment.id)}
        style={{ flexShrink: 0, color: commitment.completed ? 'var(--positive-text)' : 'var(--subtle)', background: 'none', border: 'none', cursor: 'pointer' }}>
        {commitment.completed ? <CheckSquare size={22} /> : <Square size={22} />}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.875rem', fontWeight: '600', color: commitment.completed ? 'var(--subtle)' : 'var(--text)', textDecoration: commitment.completed ? 'line-through' : 'none' }}>{commitment.description}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.125rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--subtle)' }}>{personLabel}</span>
          {commitment.amount && <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{formatCurrency(commitment.amount)}</span>}
          {commitment.endDate && (
            <span style={{ fontSize: '0.75rem', color: 'var(--subtle)' }}>
              · by {new Date(commitment.endDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </div>
      </div>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button onClick={() => setMenuOpen(!menuOpen)} style={{ padding: '0.375rem', color: 'var(--subtle)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <MoreVertical size={16} />
        </button>
        {menuOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setMenuOpen(false)} />
            <div style={{ position: 'absolute', right: 0, zIndex: 50, backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', overflow: 'hidden', minWidth: '9rem', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
              <button onClick={() => { onEdit(commitment); setMenuOpen(false); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.875rem 1rem', fontSize: '0.875rem', color: 'var(--text)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <Pencil size={14} /> Edit
              </button>
              <button onClick={() => { onDelete(commitment.id); setMenuOpen(false); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.875rem 1rem', fontSize: '0.875rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PinnedNoteCard({ note, billName }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = note.content.length > 120;
  const overdue = isReminderOverdue(note.reminderDate);
  const soon = !overdue && isReminderSoon(note.reminderDate);

  const borderColor = overdue ? 'var(--danger)' : soon ? 'var(--warn)' : 'var(--border)';
  const bgColor = overdue ? 'rgba(239,68,68,0.05)' : soon ? 'rgba(245,158,11,0.05)' : 'var(--surface)';

  return (
    <div style={{ borderRadius: '0.75rem', border: `1px solid ${borderColor}`, padding: '0.875rem', backgroundColor: bgColor }}>
      {note.reminderDate && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', marginBottom: '0.5rem', color: overdue ? 'var(--danger)' : soon ? 'var(--warn)' : 'var(--subtle)' }}>
          <Bell size={11} /> {overdue ? 'Overdue: ' : soon ? 'Due soon: ' : ''}{formatDate(note.reminderDate)}
        </div>
      )}
      {note.title && <p style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--text)', marginBottom: '0.25rem' }}>{note.title}</p>}
      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', lineHeight: '1.5', whiteSpace: 'pre-wrap', wordBreak: 'break-words' }}>
        {isLong && !expanded ? note.content.slice(0, 120) + '…' : note.content}
      </p>
      {isLong && (
        <button onClick={() => setExpanded(!expanded)} style={{ fontSize: '0.75rem', color: 'var(--accent-text)', background: 'none', border: 'none', cursor: 'pointer', marginTop: '0.25rem' }}>
          {expanded ? 'less' : 'more'}
        </button>
      )}
      {billName && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--subtle)' }}>
          <Link size={10} /> {billName}
        </div>
      )}
    </div>
  );
}

function PlannedExpenseCard({ pe, savings, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const fromSavings = savings.find((s) => s.id === pe.fromSavingsId);
  const targetLabel = pe.targetDate
    ? new Date(pe.targetDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)' }}>
      <div style={{ marginTop: '0.125rem', width: '2rem', height: '2rem', borderRadius: '0.75rem', backgroundColor: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Plane size={14} style={{ color: 'var(--accent-text)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--text)' }}>{pe.name}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.125rem', flexWrap: 'wrap' }}>
          {targetLabel && <span style={{ fontSize: '0.75rem', color: 'var(--subtle)' }}>{targetLabel}</span>}
          {fromSavings && (
            <span style={{ fontSize: '0.75rem', color: 'var(--positive-text)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <PiggyBank size={10} /> {fromSavings.name}
            </span>
          )}
        </div>
        {pe.notes && <p style={{ fontSize: '0.75rem', color: 'var(--subtle)', marginTop: '0.125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pe.notes}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        <p style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text)' }}>{formatCurrency(pe.amount)}</p>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ padding: '0.25rem', color: 'var(--subtle)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '0.5rem' }}>
            <MoreVertical size={15} />
          </button>
          {menuOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setMenuOpen(false)} />
              <div style={{ position: 'absolute', right: 0, zIndex: 50, backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', overflow: 'hidden', minWidth: '9rem', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                <button onClick={() => { onEdit(pe); setMenuOpen(false); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.875rem 1rem', fontSize: '0.875rem', color: 'var(--text)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <Pencil size={13} /> Edit
                </button>
                <button onClick={() => { onDelete(pe.id); setMenuOpen(false); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.875rem 1rem', fontSize: '0.875rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const {
    bills, income, budget, setBudgetForMonth, debts, savings, addSaving, updateSaving, deleteSaving,
    commitments, addCommitment, updateCommitment, deleteCommitment, toggleCommitment,
    plannedExpenses, addPlannedExpense, updatePlannedExpense, deletePlannedExpense,
    notes, settings, purchases,
  } = useApp();

  const [mk, setMk] = useState(() => monthKey(new Date()));
  const [showAddSaving, setShowAddSaving] = useState(false);
  const [editSaving, setEditSaving] = useState(null);
  const [showAddCommitment, setShowAddCommitment] = useState(false);
  const [editCommitment, setEditCommitment] = useState(null);
  const [showDoneCommitments, setShowDoneCommitments] = useState(false);
  const [showAddPlanned, setShowAddPlanned] = useState(false);
  const [editPlanned, setEditPlanned] = useState(null);
  const [viewMode, setViewMode] = useState('joint'); // 'primary' | 'secondary' | 'joint'
  const [showCustomize, setShowCustomize] = useState(false);

  // Section visibility helpers — default true if key not set
  const sectionPrefs = settings.dashboardSections || {};
  const sec = (key) => sectionPrefs[key] !== false;
  const toggleSec = (key) => setSettings({ ...settings, dashboardSections: { ...sectionPrefs, [key]: !sec(key) } });
  const navigate = useNavigate();

  const { spouseName, myName, monthlySpendingBudget, monthlySavingsTarget } = settings;
  const partnerLabel = spouseName || 'Cameron';
  const aaronLabel = myName || 'Aaron';

  const allMonthBills = getBillsForMonth(bills, mk);
  const monthIncome = getIncomeForMonth(income, mk);

  // Normalize owner to canonical key
  const normOwner = (b) => {
    const o = b.owner;
    if (o === 'mine' || o === 'aaron') return 'primary';
    if (o === 'partner' || o === 'cameron') return 'secondary';
    return 'joint';
  };

  // Filter bills and income by viewMode
  const monthBills = viewMode === 'primary'
    ? allMonthBills.filter((b) => normOwner(b) === 'primary')
    : viewMode === 'secondary'
      ? allMonthBills.filter((b) => normOwner(b) === 'secondary')
      : allMonthBills;

  const viewIncome = (viewMode === 'primary'
    ? monthIncome.filter((i) => i.person !== 'spouse')
    : viewMode === 'secondary'
      ? monthIncome.filter((i) => i.person === 'spouse')
      : monthIncome
  ).filter((i) => i.includeInAvailability !== false);

  const paidBills = monthBills.filter((b) => getBillStatus(b, mk) === 'paid');
  const unpaidBills = monthBills.filter((b) => getBillStatus(b, mk) === 'unpaid');
  const pendingBills = monthBills.filter((b) => getBillStatus(b, mk) === 'pending');
  const overdueBills = allMonthBills.filter((b) => isBillOverdueUnpaid(b, mk));

  const totalBills = monthBills.reduce((s, b) => s + b.amount, 0);
  const paidTotal = paidBills.reduce((s, b) => s + b.amount, 0);
  const unpaidTotal = unpaidBills.reduce((s, b) => s + b.amount, 0);

  const myIncome = monthIncome.filter((i) => i.person !== 'spouse').reduce((s, i) => s + monthlyAmount(i), 0);
  const partnerIncome = monthIncome.filter((i) => i.person === 'spouse').reduce((s, i) => s + monthlyAmount(i), 0);
  const monthlyIncome = viewIncome.reduce((s, i) => s + monthlyAmount(i), 0);

  const totalDebtMins = viewMode === 'primary'
    ? debts.filter((d) => normOwner(d) === 'primary').reduce((s, d) => s + d.minPayment, 0)
    : viewMode === 'secondary'
      ? debts.filter((d) => normOwner(d) === 'secondary').reduce((s, d) => s + d.minPayment, 0)
      : debts.reduce((s, d) => s + d.minPayment, 0);

  const activePlannedTotal = plannedExpenses
    .filter((pe) => pe.status !== 'completed')
    .reduce((s, pe) => s + pe.amount, 0);

  const availableToSpend = monthlyIncome - totalBills - totalDebtMins - activePlannedTotal;

  const spendingBudget = monthlySpendingBudget || 0;
  const savingsTarget = monthlySavingsTarget || 0;
  const unallocated = availableToSpend - spendingBudget - savingsTarget;

  const isCurrentMonth = mk === monthKey(new Date());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const payDates = monthIncome
    .filter((i) => i.startDate && i.frequency !== 'monthly')
    .flatMap((i) => getPayDatesForMonth(i, mk).map((d) => ({ date: d, source: i.source, amount: i.amount, past: d < today })))
    .sort((a, b) => a.date - b.date);

  const nextPaychecks = isCurrentMonth
    ? monthIncome
        .filter((i) => i.startDate && i.frequency !== 'monthly')
        .map((i) => ({ ...getNextPayDate(i), source: i.source, amount: i.amount }))
        .filter(Boolean)
        .sort((a, b) => a.daysUntil - b.daysUntil)
    : [];

  const openCommitments = commitments.filter((c) => !c.completed);
  const doneCommitments = commitments.filter((c) => c.completed);
  const totalSavings = savings.reduce((s, a) => s + a.balance, 0);

  const pinnedNotes = notes.filter((n) => n.pinnedToDashboard);

  const monthPurchases = purchases.filter((p) => p.date && p.date.startsWith(mk));
  const monthSpent = monthPurchases.reduce((s, p) => s + p.amount, 0);

  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
  const netWorth = totalSavings - totalDebt;

  const spendingHistory = getSpendingHistory(purchases, 6);
  const categoryTotals = getCategoryTotals(purchases, mk);

  const aaronSpent = monthPurchases.filter((p) => p.person === 'aaron' || p.person === 'me').reduce((s, p) => s + p.amount, 0);
  const cameronSpent = monthPurchases.filter((p) => p.person === 'cameron' || p.person === 'partner').reduce((s, p) => s + p.amount, 0);

  // Bill reminders — request notification permission and alert on due-soon bills
  useEffect(() => {
    if (!('Notification' in window)) return;
    const lastCheck = localStorage.getItem('lastBillReminderCheck');
    const today = new Date().toDateString();
    if (lastCheck === today) return;
    const dueSoon = bills.filter((b) => {
      if (!b.dueDay || getBillStatus(b, monthKey()) !== 'unpaid') return false;
      const diff = b.dueDay - new Date().getDate();
      return diff >= 0 && diff <= 3;
    });
    if (dueSoon.length === 0) return;
    const show = () => {
      localStorage.setItem('lastBillReminderCheck', today);
      dueSoon.forEach((b) => {
        const diff = b.dueDay - new Date().getDate();
        new Notification('Bill Due Soon', {
          body: `${b.name} — ${formatCurrency(b.amount)} due ${diff === 0 ? 'today' : `in ${diff} day${diff > 1 ? 's' : ''}`}`,
          icon: '/ExpenseTracker/pwa-192x192.png',
        });
      });
    };
    if (Notification.permission === 'granted') {
      show();
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then((p) => { if (p === 'granted') show(); });
    }
  }, [bills]);

  const sectionCard = { backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', overflow: 'hidden', marginBottom: '0' };
  const sectionWrap = { marginBottom: '1.25rem' };

  return (
    <div className="app-page">
      <div className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <h1 style={{ fontSize: '1.625rem', fontWeight: '900', color: 'var(--text)', letterSpacing: '-0.02em' }}>Budget Tracker</h1>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={() => setShowCustomize(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.75rem', backgroundColor: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer' }}>
              <LayoutGrid size={15} />
            </button>
            <RouterLink to="/settings"
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', backgroundColor: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: '700', textDecoration: 'none' }}>
              <Settings size={15} />
            </RouterLink>
          </div>
        </div>
        {/* View mode toggle */}
        <div style={{ display: 'flex', backgroundColor: 'var(--surface2)', borderRadius: '0.875rem', padding: '0.25rem', gap: '0.25rem', marginBottom: '0.75rem' }}>
          {[['primary', aaronLabel, 'var(--accent)', 'rgba(99,102,241,0.15)'], ['secondary', partnerLabel, '#a78bfa', 'rgba(167,139,250,0.15)'], ['joint', 'Joint', '#10b981', 'rgba(16,185,129,0.15)']].map(([mode, label, activeColor, inactiveBg]) => (
            <button key={mode} onClick={() => setViewMode(mode)}
              style={{ flex: 1, padding: '0.5rem 0', borderRadius: '0.625rem', fontSize: '0.875rem', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                backgroundColor: viewMode === mode ? activeColor : 'transparent',
                color: viewMode === mode ? '#fff' : 'var(--subtle)',
                boxShadow: viewMode === mode ? '0 1px 4px rgba(0,0,0,0.2)' : 'none' }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={() => setMk(monthOffset(mk, -1))} style={{ padding: '0.5rem', borderRadius: '0.75rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <ChevronLeft size={20} />
          </button>
          <span style={{ flex: 1, textAlign: 'center', fontWeight: '700', fontSize: '1rem', color: 'var(--text)' }}>{monthLabel(mk)}</span>
          <button onClick={() => setMk(monthOffset(mk, 1))} style={{ padding: '0.5rem', borderRadius: '0.75rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div style={{ padding: '0 1rem' }}>

        {/* Overdue bills alert */}
        {overdueBills.length > 0 && isCurrentMonth && (
          <div style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid var(--danger)', borderRadius: '1rem', padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <AlertTriangle size={15} style={{ color: 'var(--danger)' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--danger)' }}>Overdue Bills</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {overdueBills.slice(0, 3).map((b) => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--danger)' }}>{b.name}</span>
                  <span style={{ color: 'var(--danger)', fontWeight: '700' }}>{formatCurrency(b.amount)}</span>
                </div>
              ))}
              {overdueBills.length > 3 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>+{overdueBills.length - 3} more overdue</p>
              )}
            </div>
          </div>
        )}

        {/* Pinned notes */}
        {sec('pinnedNotes') && pinnedNotes.length > 0 && (
          <div style={sectionWrap}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.75rem' }}>
              <LayoutDashboard size={13} style={{ color: 'var(--accent-text)' }} />
              <SectionLabel>Pinned Notes</SectionLabel>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {pinnedNotes.map((note) => {
                const billName = note.linkedBillId ? bills.find((b) => b.id === note.linkedBillId)?.name : null;
                return <PinnedNoteCard key={note.id} note={note} billName={billName} />;
              })}
            </div>
          </div>
        )}

        {/* Hero summary card — Available at top, compact 2-col grid below */}
        <div style={{ ...sectionCard, borderRadius: '1.25rem', padding: '1.25rem', marginBottom: '1.25rem' }}>
          {/* Available — prominent at top */}
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--subtle)', marginBottom: '0.25rem' }}>Available</p>
            <p style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-0.02em', color: availableToSpend >= 0 ? 'var(--text)' : 'var(--danger)' }}>
              {formatCurrency(availableToSpend)}
            </p>
          </div>
          {/* 2-column breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: (spendingBudget > 0 || savingsTarget > 0) ? '0.75rem' : 0 }}>
            <div style={{ backgroundColor: 'var(--surface2)', borderRadius: '0.75rem', padding: '0.625rem 0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                <TrendingUp size={11} style={{ color: 'var(--positive-text)' }} />
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--subtle)' }}>Income</span>
              </div>
              <p style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text)' }}>{formatCurrency(monthlyIncome)}</p>
              {viewMode === 'joint' && partnerIncome > 0 && (
                <p style={{ fontSize: '0.65rem', color: 'var(--subtle)', marginTop: '0.1rem' }}>{aaronLabel} + {partnerLabel}</p>
              )}
            </div>
            <div style={{ backgroundColor: 'var(--surface2)', borderRadius: '0.75rem', padding: '0.625rem 0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                <Receipt size={11} style={{ color: 'var(--danger)' }} />
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--subtle)' }}>Bills</span>
              </div>
              <p style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text)' }}>− {formatCurrency(totalBills)}</p>
            </div>
            {totalDebtMins > 0 && (
              <div style={{ backgroundColor: 'var(--surface2)', borderRadius: '0.75rem', padding: '0.625rem 0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                  <CreditCard size={11} style={{ color: 'var(--warn)' }} />
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--subtle)' }}>Debt Mins</span>
                </div>
                <p style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text)' }}>− {formatCurrency(totalDebtMins)}</p>
              </div>
            )}
            {activePlannedTotal > 0 && (
              <div style={{ backgroundColor: 'var(--surface2)', borderRadius: '0.75rem', padding: '0.625rem 0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                  <Plane size={11} style={{ color: 'var(--accent-text)' }} />
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--subtle)' }}>Planned</span>
                </div>
                <p style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text)' }}>− {formatCurrency(activePlannedTotal)}</p>
              </div>
            )}
          </div>
          {/* Budget targets */}
          {(spendingBudget > 0 || savingsTarget > 0) && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.625rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {spendingBudget > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Wallet size={12} style={{ color: 'var(--accent-text)' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--subtle)' }}>Spending budget</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-text)' }}>{formatCurrency(spendingBudget)}</span>
                </div>
              )}
              {savingsTarget > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <PiggyBank size={12} style={{ color: 'var(--positive-text)' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--subtle)' }}>Savings target</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--positive-text)' }}>{formatCurrency(savingsTarget)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--subtle)' }}>Unallocated</span>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: unallocated >= 0 ? 'var(--text)' : 'var(--danger)' }}>{formatCurrency(unallocated)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Savings — quick access near top */}
        {sec('savings') && <div style={sectionWrap}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <SectionLabel>Savings</SectionLabel>
              {savings.length > 0 && <span style={{ fontSize: '0.875rem', color: 'var(--positive-text)', fontWeight: '700', marginBottom: '0.75rem' }}>{formatCurrency(totalSavings)}</span>}
            </div>
            <button onClick={() => setShowAddSaving(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'var(--accent-text)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
              <Plus size={14} /> Add
            </button>
          </div>
          {savings.length === 0 ? (
            <div style={{ backgroundColor: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '1rem', padding: '1.25rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>No savings accounts yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {savings.map((s) => (
                <SavingCard key={s.id} saving={s} onEdit={setEditSaving} onDelete={deleteSaving} />
              ))}
            </div>
          )}
        </div>}

        {/* Commitments — quick access near top */}
        {sec('commitments') && <div style={sectionWrap}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <SectionLabel>Commitments</SectionLabel>
            <button onClick={() => setShowAddCommitment(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'var(--accent-text)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
              <Plus size={14} /> Add
            </button>
          </div>
          {commitments.length === 0 ? (
            <div style={{ backgroundColor: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '1rem', padding: '1.25rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>No commitments — add financial to-dos.</p>
            </div>
          ) : (
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', overflow: 'hidden' }}>
              {openCommitments.map((c, i) => (
                <div key={c.id} style={{ borderBottom: i < openCommitments.length - 1 || doneCommitments.length > 0 ? '1px solid var(--border)' : 'none' }}>
                  <CommitmentRow commitment={c} onToggle={toggleCommitment}
                    onEdit={setEditCommitment} onDelete={deleteCommitment} myLabel={aaronLabel} partnerLabel={partnerLabel} />
                </div>
              ))}
              {doneCommitments.length > 0 && (
                <button onClick={() => setShowDoneCommitments(!showDoneCommitments)}
                  style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--subtle)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: showDoneCommitments ? '1px solid var(--border)' : 'none' }}>
                  {showDoneCommitments ? '▾' : '▸'} {doneCommitments.length} completed
                </button>
              )}
              {showDoneCommitments && doneCommitments.map((c, i) => (
                <div key={c.id} style={{ borderBottom: i < doneCommitments.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <CommitmentRow commitment={c} onToggle={toggleCommitment}
                    onEdit={setEditCommitment} onDelete={deleteCommitment} myLabel={aaronLabel} partnerLabel={partnerLabel} />
                </div>
              ))}
            </div>
          )}
        </div>}

        {/* Bills status */}
        {sec('billsStatus') && <div style={sectionWrap}>
          <SectionLabel>Bills Status</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            {[
              { label: 'Unpaid', color: 'var(--danger)', amount: unpaidTotal, count: unpaidBills.length, status: 'unpaid' },
              { label: 'Pending', color: 'var(--warn)', amount: pendingBills.reduce((s, b) => s + b.amount, 0), count: pendingBills.length, status: 'pending' },
              { label: 'Paid', color: 'var(--positive-text)', amount: paidTotal, count: paidBills.length, status: 'paid' },
            ].map(({ label, color, amount, count, status }) => (
              <button key={status} onClick={() => navigate(`/bills?status=${status}`)}
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.75rem', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = color}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--subtle)', marginBottom: '0.25rem' }}>{label}</p>
                <p style={{ fontSize: '1rem', fontWeight: '700', color }}>{formatCurrency(amount)}</p>
                <p style={{ fontSize: '0.625rem', color: 'var(--subtle)' }}>{count} bill{count !== 1 ? 's' : ''}</p>
              </button>
            ))}
          </div>
        </div>}

        {/* Spending vs budget */}
        {sec('spending') && spendingBudget > 0 && (
          <div style={sectionWrap}>
            <SectionLabel>Spending This Month</SectionLabel>
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
                <div>
                  <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--subtle)', marginBottom: '0.125rem' }}>Spent</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: monthSpent > spendingBudget ? 'var(--danger)' : 'var(--text)' }}>{formatCurrency(monthSpent)}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--subtle)', marginBottom: '0.125rem' }}>Budget</p>
                  <p style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--accent-text)' }}>{formatCurrency(spendingBudget)}</p>
                </div>
              </div>
              <div style={{ height: '0.5rem', backgroundColor: 'var(--surface2)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '9999px', transition: 'width 0.3s',
                  backgroundColor: monthSpent > spendingBudget ? 'var(--danger)' : monthSpent > spendingBudget * 0.8 ? 'var(--warn)' : 'var(--accent)',
                  width: `${Math.min(100, (monthSpent / spendingBudget) * 100)}%`,
                }} />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--subtle)', marginTop: '0.375rem' }}>
                {formatCurrency(Math.max(0, spendingBudget - monthSpent))} remaining
              </p>
            </div>
          </div>
        )}

        {/* Next paycheck banner */}
        {sec('nextPaycheck') && isCurrentMonth && nextPaychecks.length > 0 && nextPaychecks[0].daysUntil <= 7 && (
          <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--accent)', borderRadius: '1rem', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <CalendarDays size={18} style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--accent-text)' }}>
                {nextPaychecks[0].daysUntil === 0
                  ? `Payday today — ${nextPaychecks[0].source}`
                  : `Payday in ${nextPaychecks[0].daysUntil}d — ${nextPaychecks[0].source}`}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.125rem' }}>{formatCurrency(nextPaychecks[0].amount)} per paycheck</p>
            </div>
          </div>
        )}

        {/* Pay schedule */}
        {sec('payDates') && payDates.length > 0 && (
          <div style={sectionWrap}>
            <SectionLabel>Pay Dates — {monthLabel(mk)}</SectionLabel>
            <div style={{ ...sectionCard }}>
              {payDates.map((pd, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', opacity: pd.past ? 0.4 : 1, borderBottom: i < payDates.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <CalendarDays size={14} style={{ color: 'var(--accent-text)' }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text)' }}>{pd.source}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text)' }}>{formatDateShort(pd.date)}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--subtle)' }}>{formatCurrency(pd.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Planned expenses */}
        {sec('plannedExpenses') && <div style={sectionWrap}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <SectionLabel>Planned Expenses</SectionLabel>
            <button onClick={() => setShowAddPlanned(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'var(--accent-text)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
              <Plus size={14} /> Add
            </button>
          </div>
          {plannedExpenses.filter((pe) => pe.status !== 'completed').length === 0 ? (
            <div style={{ backgroundColor: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '1rem', padding: '1.25rem', textAlign: 'center' }}>
              <Plane size={28} style={{ margin: '0 auto 0.5rem', display: 'block', color: 'var(--subtle)' }} />
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>No planned expenses — add trips, purchases, or events from savings.</p>
            </div>
          ) : (
            <div style={{ ...sectionCard }}>
              {plannedExpenses.filter((pe) => pe.status !== 'completed').map((pe, i, arr) => (
                <div key={pe.id} style={i === arr.length - 1 ? { borderBottom: 'none' } : {}}>
                  <PlannedExpenseCard pe={pe} savings={savings} onEdit={setEditPlanned} onDelete={deletePlannedExpense} />
                </div>
              ))}
              <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--surface2)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: '600' }}>Total Planned</span>
                <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text)' }}>{formatCurrency(plannedExpenses.filter((pe) => pe.status !== 'completed').reduce((s, pe) => s + pe.amount, 0))}</span>
              </div>
            </div>
          )}
        </div>}

        {/* Net Worth */}
        {sec('netWorth') && <div style={sectionWrap}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.75rem' }}>
            <BarChart2 size={13} style={{ color: 'var(--positive-text)' }} />
            <SectionLabel>Net Worth</SectionLabel>
          </div>
          <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div>
                <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--subtle)', marginBottom: '0.25rem' }}>Savings</p>
                <p style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--positive-text)' }}>{formatCurrency(totalSavings)}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--subtle)', marginBottom: '0.25rem' }}>Debt</p>
                <p style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--danger)' }}>− {formatCurrency(totalDebt)}</p>
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', fontWeight: '600' }}>Net Worth</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '900', color: netWorth >= 0 ? 'var(--positive-text)' : 'var(--danger)' }}>{formatCurrency(netWorth)}</p>
            </div>
          </div>
        </div>}

        {/* 6-month spending chart */}
        {sec('spendingTrend') && spendingHistory.some((m) => m.amount > 0) && (
          <div style={sectionWrap}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.75rem' }}>
              <TrendingUp size={13} style={{ color: 'var(--accent-text)' }} />
              <SectionLabel>Spending Trend</SectionLabel>
            </div>
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1rem' }}>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={spendingHistory} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fill: 'var(--subtle)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--subtle)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(99,102,241,0.08)' }}
                    contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', fontSize: '0.8125rem', color: 'var(--text)' }}
                    formatter={(v) => [formatCurrency(v), 'Spent']}
                  />
                  <Bar dataKey="amount" radius={[5, 5, 0, 0]}>
                    {spendingHistory.map((entry) => (
                      <Cell key={entry.mk} fill={entry.mk === mk ? 'var(--accent)' : 'var(--surface2)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Category breakdown */}
        {sec('topCategories') && categoryTotals.length > 0 && (
          <div style={sectionWrap}>
            <SectionLabel>Top Categories — {monthLabel(mk)}</SectionLabel>
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {categoryTotals.slice(0, 5).map(({ cat, amt }) => {
                const pct = monthSpent > 0 ? (amt / monthSpent) * 100 : 0;
                return (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text)', fontWeight: '600' }}>{cat}</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--muted)', fontWeight: '700' }}>{formatCurrency(amt)}</span>
                    </div>
                    <div style={{ height: '0.375rem', backgroundColor: 'var(--surface2)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', backgroundColor: 'var(--accent)', borderRadius: '9999px', width: `${pct}%`, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Partner view */}
        {sec('spendingByPerson') && (aaronSpent > 0 || cameronSpent > 0) && (
          <div style={sectionWrap}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.75rem' }}>
              <Users size={13} style={{ color: 'var(--accent-text)' }} />
              <SectionLabel>Spending by Person — {monthLabel(mk)}</SectionLabel>
            </div>
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1rem' }}>
              {[
                { label: aaronLabel, amt: aaronSpent, color: 'var(--accent)' },
                { label: partnerLabel, amt: cameronSpent, color: '#a78bfa' },
              ].map(({ label, amt, color }) => {
                const pct = monthSpent > 0 ? (amt / monthSpent) * 100 : 0;
                return (
                  <div key={label} style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '0.9375rem', fontWeight: '700', color: 'var(--text)' }}>{label}</span>
                      <span style={{ fontSize: '0.9375rem', fontWeight: '800', color: 'var(--text)' }}>{formatCurrency(amt)}</span>
                    </div>
                    <div style={{ height: '0.5rem', backgroundColor: 'var(--surface2)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', backgroundColor: color, borderRadius: '9999px', width: `${pct}%`, transition: 'width 0.3s' }} />
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--subtle)', marginTop: '0.2rem' }}>{pct.toFixed(0)}% of month total</p>
                  </div>
                );
              })}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--muted)', fontWeight: '600' }}>Combined</span>
                <span style={{ fontSize: '0.9375rem', fontWeight: '800', color: 'var(--text)' }}>{formatCurrency(monthSpent)}</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Modals */}
      {showAddSaving && (
        <Modal title="Add Savings Account" onClose={() => setShowAddSaving(false)}>
          <SavingsForm onSave={(d) => { addSaving(d); setShowAddSaving(false); }} onCancel={() => setShowAddSaving(false)} />
        </Modal>
      )}
      {editSaving && (
        <Modal title="Edit Savings Account" onClose={() => setEditSaving(null)}>
          <SavingsForm initial={editSaving} onSave={(d) => { updateSaving(editSaving.id, d); setEditSaving(null); }} onCancel={() => setEditSaving(null)} />
        </Modal>
      )}
      {showAddCommitment && (
        <Modal title="Add Commitment" onClose={() => setShowAddCommitment(false)}>
          <CommitmentForm onSave={(d) => { addCommitment(d); setShowAddCommitment(false); }} onCancel={() => setShowAddCommitment(false)} spouseName={spouseName} />
        </Modal>
      )}
      {editCommitment && (
        <Modal title="Edit Commitment" onClose={() => setEditCommitment(null)}>
          <CommitmentForm initial={editCommitment} onSave={(d) => { updateCommitment(editCommitment.id, d); setEditCommitment(null); }} onCancel={() => setEditCommitment(null)} spouseName={spouseName} />
        </Modal>
      )}
      {showAddPlanned && (
        <Modal title="Add Planned Expense" onClose={() => setShowAddPlanned(false)}>
          <PlannedExpenseForm
            onSave={(d) => { addPlannedExpense(d); setShowAddPlanned(false); }}
            onCancel={() => setShowAddPlanned(false)}
            savings={savings}
          />
        </Modal>
      )}
      {editPlanned && (
        <Modal title="Edit Planned Expense" onClose={() => setEditPlanned(null)}>
          <PlannedExpenseForm
            initial={editPlanned}
            onSave={(d) => { updatePlannedExpense(editPlanned.id, d); setEditPlanned(null); }}
            onCancel={() => setEditPlanned(null)}
            savings={savings}
          />
        </Modal>
      )}

      {/* Dashboard Customize modal */}
      {showCustomize && (
        <Modal title="Customize Dashboard" onClose={() => setShowCustomize(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--subtle)', marginBottom: '0.75rem' }}>
              Toggle sections on or off to simplify your dashboard.
            </p>
            {[
              ['savings',         'Savings'],
              ['commitments',     'Commitments'],
              ['billsStatus',     'Bills Status'],
              ['spending',        'Spending This Month'],
              ['nextPaycheck',    'Next Paycheck Banner'],
              ['payDates',        'Pay Dates'],
              ['plannedExpenses', 'Planned Expenses'],
              ['netWorth',        'Net Worth'],
              ['spendingTrend',   'Spending Trend'],
              ['topCategories',   'Top Categories'],
              ['spendingByPerson','Spending by Person'],
              ['pinnedNotes',     'Pinned Notes'],
            ].map(([key, label]) => {
              const on = sec(key);
              return (
                <button key={key} onClick={() => toggleSec(key)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', borderRadius: '0.875rem', border: '1px solid var(--border)', backgroundColor: 'var(--surface2)', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: on ? 'var(--text)' : 'var(--subtle)' }}>{label}</span>
                  <div style={{ width: '2.75rem', height: '1.5rem', borderRadius: '9999px', position: 'relative', flexShrink: 0, transition: 'background 0.2s',
                    backgroundColor: on ? 'var(--accent)' : 'var(--border2)' }}>
                    <span style={{ position: 'absolute', top: '2px', width: '1.125rem', height: '1.125rem', borderRadius: '9999px', backgroundColor: '#fff', transition: 'left 0.2s',
                      left: on ? 'calc(100% - 1.25rem)' : '2px' }} />
                  </div>
                </button>
              );
            })}
            <button onClick={() => setShowCustomize(false)} className="app-btn-primary" style={{ marginTop: '0.5rem' }}>Done</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

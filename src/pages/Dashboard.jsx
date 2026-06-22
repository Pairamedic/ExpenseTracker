import { useState } from 'react';
import {
  ChevronLeft, ChevronRight, TrendingUp, Receipt, CreditCard,
  CheckCircle, AlertCircle, PencilLine, CalendarDays, Plus,
  Pencil, Trash2, CheckSquare, Square, MoreVertical, Bell,
  LayoutDashboard, Link, Plane, AlertTriangle, Wallet,
  ShoppingBag, PiggyBank,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatCurrency, monthKey, monthLabel, getBillsForMonth, getIncomeForMonth,
  getPayDatesForMonth, getNextPayDate, getBillStatus, isBillOverdueUnpaid,
  isReminderOverdue, isReminderSoon, formatDate, timeAgo,
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
  return <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1 mb-3">{children}</p>;
}

function SavingCard({ saving, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pct = saving.goal ? Math.min(100, (saving.balance / saving.goal) * 100) : null;

  return (
    <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white">{saving.name}</p>
          {saving.notes && <p className="text-xs text-slate-500 truncate mt-0.5">{saving.notes}</p>}
          {pct !== null ? (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span className="font-medium text-white">{formatCurrency(saving.balance)}</span>
                <span>Goal: {formatCurrency(saving.goal)}</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-slate-500 mt-1">{pct.toFixed(0)}% of goal</p>
            </div>
          ) : (
            <p className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(saving.balance)}</p>
          )}
          {saving.monthlyContribution && (
            <p className="text-xs text-slate-500 mt-1">+{formatCurrency(saving.monthlyContribution)}/mo</p>
          )}
        </div>
        <div className="relative flex-shrink-0">
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700/60 rounded-lg transition-colors">
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden min-w-[130px]">
                <button onClick={() => { onEdit(saving); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
                  <Pencil size={14} /> Edit
                </button>
                <button onClick={() => { onDelete(saving.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-rose-400 hover:bg-slate-700 transition-colors">
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

function CommitmentRow({ commitment, onToggle, onEdit, onDelete, partnerLabel }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const personLabel = commitment.person === 'me' ? 'Me' : commitment.person === 'partner' ? partnerLabel : 'Both';

  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${commitment.completed ? 'opacity-50' : ''}`}>
      <button onClick={() => onToggle(commitment.id)}
        className={`flex-shrink-0 transition-colors ${commitment.completed ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400'}`}>
        {commitment.completed ? <CheckSquare size={22} /> : <Square size={22} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${commitment.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>{commitment.description}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-600">{personLabel}</span>
          {commitment.amount && <span className="text-xs text-slate-500">{formatCurrency(commitment.amount)}</span>}
        </div>
      </div>
      <div className="relative flex-shrink-0">
        <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 text-slate-600 hover:text-slate-400 transition-colors">
          <MoreVertical size={16} />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden min-w-[130px]">
              <button onClick={() => { onEdit(commitment); setMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
                <Pencil size={14} /> Edit
              </button>
              <button onClick={() => { onDelete(commitment.id); setMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-rose-400 hover:bg-slate-700 transition-colors">
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

  return (
    <div className={`rounded-xl border p-3.5 ${overdue ? 'bg-red-950/20 border-red-900/40' : soon ? 'bg-amber-950/20 border-amber-900/40' : 'bg-slate-800/60 border-slate-700/50'}`}>
      {note.reminderDate && (
        <div className={`flex items-center gap-1 text-xs mb-2 ${overdue ? 'text-red-400' : soon ? 'text-amber-400' : 'text-slate-500'}`}>
          <Bell size={11} /> {overdue ? 'Overdue: ' : soon ? 'Due soon: ' : ''}{formatDate(note.reminderDate)}
        </div>
      )}
      {note.title && <p className="font-semibold text-sm text-white mb-1">{note.title}</p>}
      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
        {isLong && !expanded ? note.content.slice(0, 120) + '…' : note.content}
      </p>
      {isLong && (
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-indigo-400 mt-1">{expanded ? 'less' : 'more'}</button>
      )}
      {billName && (
        <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
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
    <div className="flex items-start gap-3 px-4 py-3.5 border-b border-slate-700/30 last:border-0">
      <div className="mt-0.5 w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
        <Plane size={14} className="text-indigo-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-white">{pe.name}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {targetLabel && <span className="text-xs text-slate-500">{targetLabel}</span>}
          {fromSavings && (
            <span className="text-xs text-emerald-400 flex items-center gap-0.5">
              <PiggyBank size={10} /> {fromSavings.name}
            </span>
          )}
        </div>
        {pe.notes && <p className="text-xs text-slate-600 mt-0.5 truncate">{pe.notes}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <p className="text-base font-bold text-white">{formatCurrency(pe.amount)}</p>
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 text-slate-600 hover:text-slate-400 transition-colors rounded-lg">
            <MoreVertical size={15} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden min-w-[130px]">
                <button onClick={() => { onEdit(pe); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors"><Pencil size={13} /> Edit</button>
                <button onClick={() => { onDelete(pe.id); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-rose-400 hover:bg-slate-700 transition-colors"><Trash2 size={13} /> Delete</button>
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

  const { spouseName, myName, monthlySpendingBudget, monthlySavingsTarget } = settings;
  const partnerLabel = spouseName || 'Cameron';
  const aaronLabel = myName || 'Aaron';

  const monthBills = getBillsForMonth(bills, mk);
  const monthIncome = getIncomeForMonth(income, mk);

  const paidBills = monthBills.filter((b) => getBillStatus(b, mk) === 'paid');
  const unpaidBills = monthBills.filter((b) => getBillStatus(b, mk) === 'unpaid');
  const pendingBills = monthBills.filter((b) => getBillStatus(b, mk) === 'pending');
  const overdueBills = monthBills.filter((b) => isBillOverdueUnpaid(b, mk));

  const totalBills = monthBills.reduce((s, b) => s + b.amount, 0);
  const paidTotal = paidBills.reduce((s, b) => s + b.amount, 0);
  const unpaidTotal = unpaidBills.reduce((s, b) => s + b.amount, 0);

  const myIncome = monthIncome.filter((i) => i.person !== 'spouse').reduce((s, i) => s + monthlyAmount(i), 0);
  const partnerIncome = monthIncome.filter((i) => i.person === 'spouse').reduce((s, i) => s + monthlyAmount(i), 0);
  const monthlyIncome = myIncome + partnerIncome;

  const totalDebtMins = debts.reduce((s, d) => s + d.minPayment, 0);
  const availableToSpend = monthlyIncome - totalBills - totalDebtMins;

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

  // Pinned notes for dashboard
  const pinnedNotes = notes.filter((n) => n.pinnedToDashboard);

  // This month's purchases total
  const monthPurchases = purchases.filter((p) => p.date && p.date.startsWith(mk));
  const monthSpent = monthPurchases.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="px-4 pt-5 pb-2">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-black text-white tracking-tight">Budget Tracker</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMk(monthOffset(mk, -1))} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="text-base text-slate-200 font-semibold flex-1 text-center">{monthLabel(mk)}</span>
          <button onClick={() => setMk(monthOffset(mk, 1))} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Overdue bills alert */}
      {overdueBills.length > 0 && isCurrentMonth && (
        <div className="px-4 mb-4">
          <div className="bg-red-950/40 border border-red-900/50 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={15} className="text-red-400" />
              <span className="text-sm font-semibold text-red-300">Overdue Bills</span>
            </div>
            <div className="space-y-1">
              {overdueBills.slice(0, 3).map((b) => (
                <div key={b.id} className="flex justify-between text-sm">
                  <span className="text-red-200">{b.name}</span>
                  <span className="text-red-300 font-semibold">{formatCurrency(b.amount)}</span>
                </div>
              ))}
              {overdueBills.length > 3 && (
                <p className="text-xs text-red-400">+{overdueBills.length - 3} more overdue</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pinned notes */}
      {pinnedNotes.length > 0 && (
        <div className="px-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <LayoutDashboard size={13} className="text-indigo-400" />
            <SectionLabel>Pinned Notes</SectionLabel>
          </div>
          <div className="space-y-2">
            {pinnedNotes.map((note) => {
              const billName = note.linkedBillId ? bills.find((b) => b.id === note.linkedBillId)?.name : null;
              return <PinnedNoteCard key={note.id} note={note} billName={billName} />;
            })}
          </div>
        </div>
      )}

      {/* Hero summary card */}
      <div className="px-4 mb-5">
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/60 rounded-3xl border border-slate-700/50 overflow-hidden shadow-xl shadow-black/20">
          <div className="px-5 pt-5 pb-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <TrendingUp size={15} />
                <span className="text-sm font-medium">Income</span>
              </div>
              <span className="text-lg font-bold text-white">{formatCurrency(monthlyIncome)}</span>
            </div>
            {partnerIncome > 0 && (
              <div className="ml-5 space-y-1 bg-slate-700/30 rounded-xl px-3 py-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{aaronLabel}</span>
                  <span className="text-slate-300 font-medium">{formatCurrency(myIncome)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{partnerLabel}</span>
                  <span className="text-slate-300 font-medium">{formatCurrency(partnerIncome)}</span>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400">
                <Receipt size={15} />
                <span className="text-sm font-medium">Bills</span>
              </div>
              <span className="text-lg font-bold text-white">− {formatCurrency(totalBills)}</span>
            </div>
            {totalDebtMins > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400">
                  <CreditCard size={15} />
                  <span className="text-sm font-medium">Debt minimums</span>
                </div>
                <span className="text-lg font-bold text-white">− {formatCurrency(totalDebtMins)}</span>
              </div>
            )}

            <div className={`border-t ${availableToSpend >= 0 ? 'border-slate-700/50' : 'border-rose-500/30'} pt-4 mt-1`}>
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Available</p>
              <p className={`text-4xl font-black tracking-tight ${availableToSpend >= 0 ? 'text-white' : 'text-rose-400'}`}>
                {formatCurrency(availableToSpend)}
              </p>
            </div>

            {/* Budget breakdown */}
            {(spendingBudget > 0 || savingsTarget > 0) && (
              <div className="space-y-2 pt-1">
                {spendingBudget > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-400">
                      <Wallet size={13} />
                      <span className="text-xs font-medium">Spending budget</span>
                    </div>
                    <span className="text-sm font-bold text-indigo-300">{formatCurrency(spendingBudget)}</span>
                  </div>
                )}
                {savingsTarget > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <PiggyBank size={13} />
                      <span className="text-xs font-medium">Savings target</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-300">{formatCurrency(savingsTarget)}</span>
                  </div>
                )}
                {(spendingBudget > 0 || savingsTarget > 0) && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-700/40">
                    <span className="text-xs text-slate-500">Unallocated</span>
                    <span className={`text-sm font-bold ${unallocated >= 0 ? 'text-slate-300' : 'text-rose-400'}`}>{formatCurrency(unallocated)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* This month's spending vs budget */}
      {spendingBudget > 0 && monthPurchases.length > 0 && (
        <div className="px-4 mb-5">
          <SectionLabel>Spending This Month</SectionLabel>
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-4">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Spent</p>
                <p className={`text-2xl font-bold ${monthSpent > spendingBudget ? 'text-red-400' : 'text-white'}`}>{formatCurrency(monthSpent)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 mb-0.5">Budget</p>
                <p className="text-lg font-bold text-indigo-300">{formatCurrency(spendingBudget)}</p>
              </div>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${monthSpent > spendingBudget ? 'bg-red-500' : monthSpent > spendingBudget * 0.8 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                style={{ width: `${Math.min(100, (monthSpent / spendingBudget) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              {formatCurrency(Math.max(0, spendingBudget - monthSpent))} remaining
            </p>
          </div>
        </div>
      )}

      {/* Next paycheck banner */}
      {isCurrentMonth && nextPaychecks.length > 0 && nextPaychecks[0].daysUntil <= 7 && (
        <div className="px-4 mb-4">
          <div className="bg-indigo-900/30 border border-indigo-700/30 rounded-2xl px-4 py-3 flex items-center gap-3">
            <CalendarDays size={18} className="text-indigo-400 flex-shrink-0" />
            <div>
              {nextPaychecks[0].daysUntil === 0
                ? <p className="text-sm text-indigo-300 font-semibold">Payday today — {nextPaychecks[0].source}</p>
                : <p className="text-sm text-indigo-300 font-semibold">Payday in {nextPaychecks[0].daysUntil}d — {nextPaychecks[0].source}</p>
              }
              <p className="text-xs text-slate-400 mt-0.5">{formatCurrency(nextPaychecks[0].amount)} per paycheck</p>
            </div>
          </div>
        </div>
      )}

      {/* Pay schedule */}
      {payDates.length > 0 && (
        <div className="px-4 mb-5">
          <SectionLabel>Pay Dates — {monthLabel(mk)}</SectionLabel>
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 divide-y divide-slate-700/30">
            {payDates.map((pd, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-3 ${pd.past ? 'opacity-40' : ''}`}>
                <div className="flex items-center gap-2.5">
                  <CalendarDays size={14} className="text-indigo-400" />
                  <span className="text-sm font-medium text-slate-300">{pd.source}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{formatDateShort(pd.date)}</p>
                  <p className="text-xs text-slate-500">{formatCurrency(pd.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bills paid / unpaid summary */}
      <div className="px-4 mb-5">
        <SectionLabel>Bills Status</SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/40 p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">Unpaid</p>
            <p className="text-base font-bold text-red-400">{formatCurrency(unpaidTotal)}</p>
            <p className="text-xs text-slate-600">{unpaidBills.length} bills</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/40 p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">Pending</p>
            <p className="text-base font-bold text-amber-400">{formatCurrency(pendingBills.reduce((s, b) => s + b.amount, 0))}</p>
            <p className="text-xs text-slate-600">{pendingBills.length} bills</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/40 p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">Paid</p>
            <p className="text-base font-bold text-emerald-400">{formatCurrency(paidTotal)}</p>
            <p className="text-xs text-slate-600">{paidBills.length} bills</p>
          </div>
        </div>
      </div>

      {/* Planned expenses */}
      <div className="px-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Planned Expenses</SectionLabel>
          <button onClick={() => setShowAddPlanned(true)}
            className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
            <Plus size={14} /> Add
          </button>
        </div>
        {plannedExpenses.filter((pe) => pe.status !== 'completed').length === 0 ? (
          <div className="bg-slate-800/40 rounded-2xl border border-dashed border-slate-700/50 px-4 py-5 text-center">
            <Plane size={28} className="mx-auto mb-2 text-slate-600" />
            <p className="text-sm text-slate-500">No planned expenses — add trips,<br />purchases, or events from savings.</p>
          </div>
        ) : (
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden">
            {plannedExpenses.filter((pe) => pe.status !== 'completed').map((pe) => (
              <PlannedExpenseCard key={pe.id} pe={pe} savings={savings}
                onEdit={setEditPlanned} onDelete={deletePlannedExpense} />
            ))}
            <div className="px-4 py-3 bg-slate-800/30 flex justify-between">
              <span className="text-xs text-slate-500 font-medium">Total Planned</span>
              <span className="text-sm font-bold text-white">{formatCurrency(plannedExpenses.filter((pe) => pe.status !== 'completed').reduce((s, pe) => s + pe.amount, 0))}</span>
            </div>
          </div>
        )}
      </div>

      {/* Savings */}
      <div className="px-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <SectionLabel>Savings</SectionLabel>
            {savings.length > 0 && <span className="text-sm text-emerald-400 font-bold mb-3">{formatCurrency(totalSavings)}</span>}
          </div>
          <button onClick={() => setShowAddSaving(true)}
            className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
            <Plus size={14} /> Add
          </button>
        </div>
        {savings.length === 0 ? (
          <div className="bg-slate-800/40 rounded-2xl border border-dashed border-slate-700/50 px-4 py-5 text-center">
            <p className="text-sm text-slate-500">No savings accounts yet.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {savings.map((s) => (
              <SavingCard key={s.id} saving={s} onEdit={setEditSaving} onDelete={deleteSaving} />
            ))}
          </div>
        )}
      </div>

      {/* Commitments */}
      <div className="px-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Commitments</SectionLabel>
          <button onClick={() => setShowAddCommitment(true)}
            className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
            <Plus size={14} /> Add
          </button>
        </div>
        {commitments.length === 0 ? (
          <div className="bg-slate-800/40 rounded-2xl border border-dashed border-slate-700/50 px-4 py-5 text-center">
            <p className="text-sm text-slate-500">No commitments — add financial to-dos.</p>
          </div>
        ) : (
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 divide-y divide-slate-700/30">
            {openCommitments.map((c) => (
              <CommitmentRow key={c.id} commitment={c} onToggle={toggleCommitment}
                onEdit={setEditCommitment} onDelete={deleteCommitment} partnerLabel={partnerLabel} />
            ))}
            {doneCommitments.length > 0 && (
              <button onClick={() => setShowDoneCommitments(!showDoneCommitments)}
                className="w-full px-4 py-3 text-xs text-slate-500 hover:text-slate-400 transition-colors text-left">
                {showDoneCommitments ? '▾' : '▸'} {doneCommitments.length} completed
              </button>
            )}
            {showDoneCommitments && doneCommitments.map((c) => (
              <CommitmentRow key={c.id} commitment={c} onToggle={toggleCommitment}
                onEdit={setEditCommitment} onDelete={deleteCommitment} partnerLabel={partnerLabel} />
            ))}
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
    </div>
  );
}

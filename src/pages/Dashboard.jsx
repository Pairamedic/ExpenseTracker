import { useState } from 'react';
import {
  ChevronLeft, ChevronRight, Wallet, TrendingUp, Receipt, CreditCard,
  CheckCircle, AlertCircle, PencilLine, CalendarDays, Plus,
  Pencil, Trash2, CheckSquare, Square, MoreVertical
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatCurrency, monthKey, monthLabel, getBillsForMonth, getIncomeForMonth,
  getPayDatesForMonth, getNextPayDate
} from '../utils/helpers';
import Modal from '../components/Modal';
import SavingsForm from '../components/SavingsForm';
import CommitmentForm from '../components/CommitmentForm';

function monthOffset(mk, offset) {
  const [y, m] = mk.split('-').map(Number);
  return monthKey(new Date(y, m - 1 + offset, 1));
}

function monthlyAmount(item) {
  const mult = item.frequency === 'weekly' ? 4.33 : item.frequency === 'biweekly' ? 2.17 : 1;
  return item.amount * mult;
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
                <span>{formatCurrency(saving.balance)}</span>
                <span>Goal: {formatCurrency(saving.goal)}</span>
              </div>
              <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
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
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-colors">
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden min-w-[130px]">
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

export default function Dashboard() {
  const { bills, income, budget, setBudgetForMonth, debts, savings, addSaving, updateSaving, deleteSaving,
    commitments, addCommitment, updateCommitment, deleteCommitment, toggleCommitment, settings } = useApp();
  const [mk, setMk] = useState(() => monthKey(new Date()));
  const [editBudget, setEditBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [showAddSaving, setShowAddSaving] = useState(false);
  const [editSaving, setEditSaving] = useState(null);
  const [showAddCommitment, setShowAddCommitment] = useState(false);
  const [editCommitment, setEditCommitment] = useState(null);
  const [showDoneCommitments, setShowDoneCommitments] = useState(false);

  const { spouseEnabled, spouseName, myName } = settings;
  const partnerLabel = spouseName || 'Partner';

  const monthBills = getBillsForMonth(bills, mk);
  const monthIncome = getIncomeForMonth(income, mk);
  const paidBills = monthBills.filter((b) => (b.paidMonths || {})[mk]);
  const unpaidBills = monthBills.filter((b) => !(b.paidMonths || {})[mk]);

  const totalBills = monthBills.reduce((s, b) => s + b.amount, 0);
  const paidTotal = paidBills.reduce((s, b) => s + b.amount, 0);
  const unpaidTotal = unpaidBills.reduce((s, b) => s + b.amount, 0);

  const myIncome = monthIncome.filter((i) => i.person !== 'spouse').reduce((s, i) => s + monthlyAmount(i), 0);
  const partnerIncome = monthIncome.filter((i) => i.person === 'spouse').reduce((s, i) => s + monthlyAmount(i), 0);
  const monthlyIncome = myIncome + partnerIncome;

  const totalDebtMins = debts.reduce((s, d) => s + d.minPayment, 0);
  const budgetAmount = budget[mk] || 0;
  const availableToSpend = monthlyIncome - totalBills - totalDebtMins;

  const saveBudget = () => {
    setBudgetForMonth(mk, parseFloat(budgetInput) || 0);
    setEditBudget(false);
  };

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

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="px-5 pt-5 pb-2">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-3xl font-black text-white tracking-tight">Budget Tracker</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMk(monthOffset(mk, -1))} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="text-base text-slate-300 font-semibold flex-1 text-center">{monthLabel(mk)}</span>
          <button onClick={() => setMk(monthOffset(mk, 1))} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Hero summary card */}
      <div className="px-5 mb-5">
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/70 rounded-3xl border border-slate-700/50 overflow-hidden shadow-xl shadow-black/20">
          <div className="px-5 pt-5 pb-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <TrendingUp size={16} />
                <span className="text-sm font-medium">Income</span>
              </div>
              <span className="text-lg font-bold text-white">{formatCurrency(monthlyIncome)}</span>
            </div>
            {spouseEnabled && partnerIncome > 0 && (
              <div className="ml-6 space-y-1 bg-slate-700/30 rounded-xl px-3 py-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{myName || 'Me'}</span>
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
                <Receipt size={16} />
                <span className="text-sm font-medium">Bills</span>
              </div>
              <span className="text-lg font-bold text-white">− {formatCurrency(totalBills)}</span>
            </div>
            {totalDebtMins > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400">
                  <CreditCard size={16} />
                  <span className="text-sm font-medium">Debt minimums</span>
                </div>
                <span className="text-lg font-bold text-white">− {formatCurrency(totalDebtMins)}</span>
              </div>
            )}
            <div className={`border-t ${availableToSpend >= 0 ? 'border-indigo-500/30' : 'border-rose-500/30'} pt-4 mt-1`}>
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Available to spend</p>
              <p className={`text-5xl font-black tracking-tight ${availableToSpend >= 0 ? 'text-white' : 'text-rose-400'}`}>
                {formatCurrency(availableToSpend)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Next paycheck banner */}
      {isCurrentMonth && nextPaychecks.length > 0 && nextPaychecks[0].daysUntil <= 7 && (
        <div className="px-5 mb-4">
          <div className="bg-indigo-900/40 border border-indigo-700/40 rounded-2xl px-4 py-3.5 flex items-center gap-3">
            <CalendarDays size={20} className="text-indigo-400 flex-shrink-0" />
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
        <div className="px-5 mb-5">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-3 px-1">Pay dates — {monthLabel(mk)}</p>
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 divide-y divide-slate-700/40">
            {payDates.map((pd, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-3.5 ${pd.past ? 'opacity-40' : ''}`}>
                <div className="flex items-center gap-2.5">
                  <CalendarDays size={15} className="text-indigo-400" />
                  <span className="text-sm font-medium text-slate-300">{pd.source}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{formatDate(pd.date)}</p>
                  <p className="text-xs text-slate-500">{formatCurrency(pd.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Commitments */}
      <div className="px-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-500 uppercase tracking-widest px-1">Commitments</p>
          <button onClick={() => setShowAddCommitment(true)} className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
            <Plus size={15} /> Add
          </button>
        </div>
        {commitments.length === 0 ? (
          <div className="bg-slate-800/40 rounded-2xl border border-dashed border-slate-700/50 px-4 py-6 text-center">
            <p className="text-sm text-slate-500">No commitments yet — add financial to-dos you need to act on.</p>
          </div>
        ) : (
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 divide-y divide-slate-700/40">
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

      {/* Savings */}
      <div className="px-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 px-1">
            <p className="text-xs text-slate-500 uppercase tracking-widest">Savings</p>
            {savings.length > 0 && <span className="text-sm text-emerald-400 font-bold">{formatCurrency(totalSavings)}</span>}
          </div>
          <button onClick={() => setShowAddSaving(true)} className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
            <Plus size={15} /> Add
          </button>
        </div>
        {savings.length === 0 ? (
          <div className="bg-slate-800/40 rounded-2xl border border-dashed border-slate-700/50 px-4 py-6 text-center">
            <p className="text-sm text-slate-500">No savings accounts yet — add your joint savings or emergency fund.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savings.map((s) => (
              <SavingCard key={s.id} saving={s} onEdit={setEditSaving} onDelete={deleteSaving} />
            ))}
          </div>
        )}
      </div>

      {/* Discretionary budget */}
      <div className="px-5 mb-5">
        <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Discretionary Budget</p>
            <p className="text-3xl font-bold text-white">{formatCurrency(budgetAmount)}</p>
          </div>
          <button onClick={() => { setBudgetInput(budgetAmount || ''); setEditBudget(true); }}
            className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
            <PencilLine size={16} /> Edit
          </button>
        </div>
      </div>

      {/* Bills paid / unpaid */}
      <div className="px-5 space-y-3">
        <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle size={22} className="text-emerald-400" />
            <div>
              <p className="text-base font-semibold text-emerald-300">Bills Paid</p>
              <p className="text-xs text-slate-500">{paidBills.length} bill{paidBills.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(paidTotal)}</p>
        </div>
        <div className="bg-amber-900/20 border border-amber-800/40 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={22} className="text-amber-400" />
            <div>
              <p className="text-base font-semibold text-amber-300">Bills Unpaid</p>
              <p className="text-xs text-slate-500">{unpaidBills.length} bill{unpaidBills.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-400">{formatCurrency(unpaidTotal)}</p>
        </div>
      </div>

      {/* Modals */}
      {editBudget && (
        <Modal title="Set Discretionary Budget" onClose={() => setEditBudget(false)}>
          <p className="text-sm text-slate-400 mb-4">How much spending money for {monthLabel(mk)} beyond bills?</p>
          <input type="number" min="0" step="0.01" autoFocus
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg mb-4 focus:outline-none focus:border-indigo-500"
            placeholder="0.00" value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)} />
          <div className="flex gap-3">
            <button onClick={() => setEditBudget(false)} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300">Cancel</button>
            <button onClick={saveBudget} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold">Save</button>
          </div>
        </Modal>
      )}
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
    </div>
  );
}

function CommitmentRow({ commitment, onToggle, onEdit, onDelete, partnerLabel }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const personLabel = commitment.person === 'me' ? 'Me' : commitment.person === 'partner' ? partnerLabel : 'Both';

  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${commitment.completed ? 'opacity-50' : ''}`}>
      <button onClick={() => onToggle(commitment.id)} className={`flex-shrink-0 transition-colors ${commitment.completed ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400'}`}>
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
            <div className="absolute right-0 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden min-w-[130px]">
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

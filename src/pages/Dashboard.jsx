import { useState } from 'react';
import { ChevronLeft, ChevronRight, Wallet, TrendingUp, Receipt, CreditCard, CheckCircle, AlertCircle, PencilLine, CalendarDays } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, monthKey, monthLabel, getBillsForMonth, getIncomeForMonth, getPayDatesForMonth, getNextPayDate } from '../utils/helpers';
import Modal from '../components/Modal';

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

export default function Dashboard() {
  const { bills, income, budget, setBudgetForMonth, debts } = useApp();
  const [mk, setMk] = useState(() => monthKey(new Date()));
  const [editBudget, setEditBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  const monthBills = getBillsForMonth(bills, mk);
  const monthIncome = getIncomeForMonth(income, mk);
  const paidBills = monthBills.filter((b) => (b.paidMonths || {})[mk]);
  const unpaidBills = monthBills.filter((b) => !(b.paidMonths || {})[mk]);

  const totalBills = monthBills.reduce((s, b) => s + b.amount, 0);
  const paidTotal = paidBills.reduce((s, b) => s + b.amount, 0);
  const unpaidTotal = unpaidBills.reduce((s, b) => s + b.amount, 0);
  const monthlyIncome = monthIncome.reduce((s, i) => s + monthlyAmount(i), 0);
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
    .flatMap((i) =>
      getPayDatesForMonth(i, mk).map((d) => ({
        date: d,
        source: i.source,
        amount: i.amount,
        past: d < today,
      }))
    )
    .sort((a, b) => a.date - b.date);

  const nextPaychecks = isCurrentMonth
    ? monthIncome
        .filter((i) => i.startDate && i.frequency !== 'monthly')
        .map((i) => ({ ...getNextPayDate(i), source: i.source, amount: i.amount }))
        .filter(Boolean)
        .sort((a, b) => a.daysUntil - b.daysUntil)
    : [];

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-white mb-1">Budget Tracker</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setMk(monthOffset(mk, -1))} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="text-slate-300 font-medium flex-1 text-center">{monthLabel(mk)}</span>
          <button onClick={() => setMk(monthOffset(mk, 1))} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Smarter summary */}
      <div className="px-5 mb-4">
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <TrendingUp size={15} />
                <span className="text-sm">Income</span>
              </div>
              <span className="font-semibold text-white">{formatCurrency(monthlyIncome)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400">
                <Receipt size={15} />
                <span className="text-sm">Bills</span>
              </div>
              <span className="font-semibold text-white">− {formatCurrency(totalBills)}</span>
            </div>
            {totalDebtMins > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400">
                  <CreditCard size={15} />
                  <span className="text-sm">Debt minimums</span>
                </div>
                <span className="font-semibold text-white">− {formatCurrency(totalDebtMins)}</span>
              </div>
            )}
            <div className="border-t border-slate-700 pt-3 flex items-center justify-between">
              <div className={`flex items-center gap-2 ${availableToSpend >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                <Wallet size={15} />
                <span className="text-sm font-medium">Available to spend</span>
              </div>
              <span className={`text-xl font-bold ${availableToSpend >= 0 ? 'text-white' : 'text-rose-400'}`}>
                {formatCurrency(availableToSpend)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Next paycheck banner */}
      {isCurrentMonth && nextPaychecks.length > 0 && nextPaychecks[0].daysUntil <= 7 && (
        <div className="px-5 mb-4">
          <div className="bg-indigo-900/30 border border-indigo-700/40 rounded-2xl px-4 py-3 flex items-center gap-3">
            <CalendarDays size={18} className="text-indigo-400 flex-shrink-0" />
            <div>
              {nextPaychecks[0].daysUntil === 0 ? (
                <p className="text-sm text-indigo-300 font-medium">Payday today — {nextPaychecks[0].source}</p>
              ) : (
                <p className="text-sm text-indigo-300 font-medium">
                  Payday in {nextPaychecks[0].daysUntil}d — {nextPaychecks[0].source}
                </p>
              )}
              <p className="text-xs text-slate-500">{formatCurrency(nextPaychecks[0].amount)} per paycheck</p>
            </div>
          </div>
        </div>
      )}

      {/* Pay schedule for month */}
      {payDates.length > 0 && (
        <div className="px-5 mb-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Pay dates — {monthLabel(mk)}</p>
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 divide-y divide-slate-700/50">
            {payDates.map((pd, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-3 ${pd.past ? 'opacity-40' : ''}`}>
                <div className="flex items-center gap-2">
                  <CalendarDays size={14} className="text-indigo-400" />
                  <span className="text-sm text-slate-300">{pd.source}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{formatDate(pd.date)}</p>
                  <p className="text-xs text-slate-500">{formatCurrency(pd.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discretionary budget */}
      <div className="px-5 mb-4">
        <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Discretionary Budget</p>
            <p className="text-xl font-bold text-white">{formatCurrency(budgetAmount)}</p>
          </div>
          <button
            onClick={() => { setBudgetInput(budgetAmount || ''); setEditBudget(true); }}
            className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <PencilLine size={15} /> Edit
          </button>
        </div>
      </div>

      {/* Bills status */}
      <div className="px-5 space-y-3">
        <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-emerald-300">Bills Paid</p>
              <p className="text-xs text-slate-500">{paidBills.length} bill{paidBills.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <p className="text-lg font-bold text-emerald-400">{formatCurrency(paidTotal)}</p>
        </div>

        <div className="bg-amber-900/20 border border-amber-800/40 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-amber-400" />
            <div>
              <p className="text-sm font-medium text-amber-300">Bills Unpaid</p>
              <p className="text-xs text-slate-500">{unpaidBills.length} bill{unpaidBills.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <p className="text-lg font-bold text-amber-400">{formatCurrency(unpaidTotal)}</p>
        </div>
      </div>

      {editBudget && (
        <Modal title="Set Discretionary Budget" onClose={() => setEditBudget(false)}>
          <p className="text-sm text-slate-400 mb-4">
            Set how much spending money you want available for {monthLabel(mk)} beyond your bills.
          </p>
          <input
            type="number"
            min="0"
            step="0.01"
            autoFocus
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg mb-4 focus:outline-none focus:border-indigo-500"
            placeholder="0.00"
            value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
          />
          <div className="flex gap-3">
            <button onClick={() => setEditBudget(false)} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">
              Cancel
            </button>
            <button onClick={saveBudget} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors">
              Save
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

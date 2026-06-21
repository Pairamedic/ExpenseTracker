import { useState } from 'react';
import { ChevronLeft, ChevronRight, Wallet, TrendingUp, Receipt, CheckCircle, AlertCircle, PencilLine } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, monthKey, monthLabel, getBillsForMonth, getIncomeForMonth } from '../utils/helpers';
import Modal from '../components/Modal';

function monthOffset(mk, offset) {
  const [y, m] = mk.split('-').map(Number);
  return monthKey(new Date(y, m - 1 + offset, 1));
}

function getMonthlyIncome(items) {
  return items.reduce((sum, item) => {
    const mult = item.frequency === 'weekly' ? 4.33 : item.frequency === 'biweekly' ? 2.17 : 1;
    return sum + item.amount * mult;
  }, 0);
}

export default function Dashboard() {
  const { bills, income, budget, setBudgetForMonth } = useApp();
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
  const monthlyIncome = getMonthlyIncome(monthIncome);
  const budgetAmount = budget[mk] || 0;
  const remaining = monthlyIncome - totalBills;

  const saveBudget = () => { setBudgetForMonth(mk, parseFloat(budgetInput) || 0); setEditBudget(false); };

  return (
    <div className="pb-24">
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-white mb-1">Budget Tracker</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setMk(monthOffset(mk, -1))} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"><ChevronLeft size={20} /></button>
          <span className="text-slate-300 font-medium flex-1 text-center">{monthLabel(mk)}</span>
          <button onClick={() => setMk(monthOffset(mk, 1))} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="px-5 grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-emerald-400 mb-2"><TrendingUp size={16} /><span className="text-xs font-medium uppercase tracking-wide">Income</span></div>
          <p className="text-2xl font-bold text-white">{formatCurrency(monthlyIncome)}</p>
          <p className="text-xs text-slate-500 mt-0.5">{monthIncome.length} source{monthIncome.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-rose-400 mb-2"><Receipt size={16} /><span className="text-xs font-medium uppercase tracking-wide">Bills</span></div>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalBills)}</p>
          <p className="text-xs text-slate-500 mt-0.5">{monthBills.length} bill{monthBills.length !== 1 ? 's' : ''}</p>
        </div>
        <div className={`col-span-2 rounded-2xl p-4 border ${remaining >= 0 ? 'bg-indigo-900/30 border-indigo-700/50' : 'bg-rose-900/30 border-rose-700/50'}`}>
          <div className={`flex items-center gap-2 mb-2 ${remaining >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}><Wallet size={16} /><span className="text-xs font-medium uppercase tracking-wide">Left after bills</span></div>
          <p className={`text-3xl font-bold ${remaining >= 0 ? 'text-white' : 'text-rose-400'}`}>{formatCurrency(remaining)}</p>
        </div>
      </div>

      <div className="px-5 mb-4">
        <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Discretionary Budget</p>
            <p className="text-xl font-bold text-white">{formatCurrency(budgetAmount)}</p>
          </div>
          <button onClick={() => { setBudgetInput(budgetAmount || ''); setEditBudget(true); }} className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
            <PencilLine size={15} /> Edit
          </button>
        </div>
      </div>

      <div className="px-5 space-y-3">
        <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-emerald-400" />
            <div><p className="text-sm font-medium text-emerald-300">Paid</p><p className="text-xs text-slate-500">{paidBills.length} bill{paidBills.length !== 1 ? 's' : ''}</p></div>
          </div>
          <p className="text-lg font-bold text-emerald-400">{formatCurrency(paidTotal)}</p>
        </div>
        <div className="bg-amber-900/20 border border-amber-800/40 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-amber-400" />
            <div><p className="text-sm font-medium text-amber-300">Unpaid</p><p className="text-xs text-slate-500">{unpaidBills.length} bill{unpaidBills.length !== 1 ? 's' : ''}</p></div>
          </div>
          <p className="text-lg font-bold text-amber-400">{formatCurrency(unpaidTotal)}</p>
        </div>
      </div>

      {editBudget && (
        <Modal title="Set Discretionary Budget" onClose={() => setEditBudget(false)}>
          <p className="text-sm text-slate-400 mb-4">Set how much spending money you want available for {monthLabel(mk)} beyond your bills.</p>
          <input type="number" min="0" step="0.01" autoFocus
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg mb-4 focus:outline-none focus:border-indigo-500"
            placeholder="0.00" value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)} />
          <div className="flex gap-3">
            <button onClick={() => setEditBudget(false)} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">Cancel</button>
            <button onClick={saveBudget} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors">Save</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

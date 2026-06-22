import { useState } from 'react';
import { User, Users, Trash2, AlertTriangle, Wallet, PiggyBank, DollarSign } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import { formatCurrency } from '../utils/helpers';

export default function Settings() {
  const { settings, setSettings, bills, income, debts, savings, commitments, purchases } = useApp();
  const [form, setForm] = useState({ ...settings });
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const save = () => { setSettings(form); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const clearAll = () => { localStorage.clear(); window.location.reload(); };

  return (
    <div className="pb-36">
      <div className="px-4 pt-5 pb-6">
        <h1 className="text-2xl font-black text-white tracking-tight mb-6">Settings</h1>

        {/* Profile */}
        <section className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <User size={15} className="text-indigo-400" />
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Profiles</h2>
          </div>
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-4 space-y-3">
            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">Primary user name</label>
              <input
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="e.g. Aaron"
                value={form.myName}
                onChange={(e) => set('myName', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">Partner name</label>
              <input
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="e.g. Cameron"
                value={form.spouseName}
                onChange={(e) => set('spouseName', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Spending & Savings Targets */}
        <section className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={15} className="text-emerald-400" />
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Monthly Budget Targets</h2>
          </div>
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-4 space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block flex items-center gap-1.5">
                <Wallet size={13} className="text-indigo-400" /> Spending money budget
              </label>
              <p className="text-xs text-slate-600 mb-2">How much of your available funds you plan to spend each month</p>
              <input
                type="number"
                min="0"
                step="1"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="0"
                value={form.monthlySpendingBudget || ''}
                onChange={(e) => set('monthlySpendingBudget', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block flex items-center gap-1.5">
                <PiggyBank size={13} className="text-emerald-400" /> Savings target
              </label>
              <p className="text-xs text-slate-600 mb-2">Amount you aim to move to savings each month</p>
              <input
                type="number"
                min="0"
                step="1"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="0"
                value={form.monthlySavingsTarget || ''}
                onChange={(e) => set('monthlySavingsTarget', parseFloat(e.target.value) || 0)}
              />
            </div>
            {(form.monthlySpendingBudget > 0 || form.monthlySavingsTarget > 0) && (
              <div className="bg-slate-700/30 rounded-xl px-3 py-2.5 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Spending budget</span>
                  <span className="text-indigo-300 font-semibold">{formatCurrency(form.monthlySpendingBudget || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Savings target</span>
                  <span className="text-emerald-300 font-semibold">{formatCurrency(form.monthlySavingsTarget || 0)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-600/40 pt-1.5">
                  <span className="text-slate-400">Total allocated</span>
                  <span className="text-white font-semibold">{formatCurrency((form.monthlySpendingBudget || 0) + (form.monthlySavingsTarget || 0))}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        <button onClick={save} className={`w-full py-4 rounded-2xl font-bold text-base transition-all mb-4 ${
          saved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
        }`}>
          {saved ? 'Saved!' : 'Save Settings'}
        </button>

        {/* Data summary */}
        <section className="mb-4 bg-slate-800/60 rounded-2xl border border-slate-700/50 p-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Data Summary</h2>
          <div className="grid grid-cols-2 gap-2 text-sm text-slate-400">
            <p>{bills.length} bill{bills.length !== 1 ? 's' : ''}</p>
            <p>{income.length} income source{income.length !== 1 ? 's' : ''}</p>
            <p>{debts.length} debt{debts.length !== 1 ? 's' : ''}</p>
            <p>{savings.length} savings account{savings.length !== 1 ? 's' : ''}</p>
            <p>{commitments.length} commitment{commitments.length !== 1 ? 's' : ''}</p>
            <p>{purchases.length} purchase{purchases.length !== 1 ? 's' : ''}</p>
          </div>
        </section>

        {/* Danger zone */}
        <section className="bg-rose-950/30 border border-rose-900/50 rounded-2xl p-4">
          <h2 className="text-xs font-semibold text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <AlertTriangle size={13} /> Danger Zone
          </h2>
          <p className="text-xs text-slate-500 mb-3">Permanently delete all data. This cannot be undone.</p>
          <button onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-2 text-sm text-rose-400 border border-rose-800/50 px-4 py-2.5 rounded-xl hover:bg-rose-900/30 transition-colors">
            <Trash2 size={14} /> Clear All Data
          </button>
        </section>
      </div>

      {showClearConfirm && (
        <Modal title="Clear All Data?" onClose={() => setShowClearConfirm(false)}>
          <p className="text-slate-400 text-sm mb-6">This will permanently delete all your bills, income, debts, savings, purchases, and settings. This cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">Cancel</button>
            <button onClick={clearAll} className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors">Delete Everything</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

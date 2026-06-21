import { useState } from 'react';

export default function DebtForm({ initial = {}, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    balance: '',
    minPayment: '',
    interestRate: '',
    notes: '',
    ...initial,
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.balance || !form.minPayment) return;
    onSave({
      ...form,
      balance: parseFloat(form.balance),
      minPayment: parseFloat(form.minPayment),
      interestRate: form.interestRate ? parseFloat(form.interestRate) : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-sm text-slate-400 mb-1 block">Debt Name *</label>
        <input
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          placeholder="e.g. Car Loan, Credit Card Visa"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-sm text-slate-400 mb-1 block">Current Balance *</label>
        <input
          type="number"
          min="0"
          step="0.01"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          placeholder="0.00"
          value={form.balance}
          onChange={(e) => set('balance', e.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-sm text-slate-400 mb-1 block">Min Monthly Payment *</label>
        <input
          type="number"
          min="0"
          step="0.01"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          placeholder="0.00"
          value={form.minPayment}
          onChange={(e) => set('minPayment', e.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-sm text-slate-400 mb-1 block">Interest Rate % <span className="text-slate-600">(optional)</span></label>
        <input
          type="number"
          min="0"
          max="100"
          step="0.01"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          placeholder="e.g. 24.99"
          value={form.interestRate}
          onChange={(e) => set('interestRate', e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm text-slate-400 mb-1 block">Notes <span className="text-slate-600">(optional)</span></label>
        <input
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          placeholder="Optional"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">
          Cancel
        </button>
        <button type="submit" className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors">
          Save
        </button>
      </div>
    </form>
  );
}

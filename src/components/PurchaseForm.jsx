import { useState } from 'react';

const CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Gas',
  'Shopping',
  'Entertainment',
  'Coffee & Drinks',
  'Health & Medical',
  'Personal Care',
  'Transportation',
  'Home & Garden',
  'Other',
];

export default function PurchaseForm({ initial = {}, onSave, onCancel, myName, spouseName }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    amount: '',
    merchant: '',
    category: 'Other',
    date: today,
    person: 'aaron',
    notes: '',
    ...initial,
    amount: initial.amount != null ? String(initial.amount) : '',
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || !form.merchant || !form.date) return;
    onSave({ ...form, amount: parseFloat(form.amount) });
  };

  const aaronLabel = myName || 'Aaron';
  const cameronLabel = spouseName || 'Cameron';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-slate-400 mb-1.5 block">Amount *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            autoFocus
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm text-slate-400 mb-1.5 block">Date *</label>
          <input
            type="date"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className="text-sm text-slate-400 mb-1.5 block">Where / Who *</label>
        <input
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          placeholder="e.g. Walmart, Amazon, Target"
          value={form.merchant}
          onChange={(e) => set('merchant', e.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-sm text-slate-400 mb-1.5 block">What for *</label>
        <select
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
          value={form.category}
          onChange={(e) => set('category', e.target.value)}
        >
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="text-sm text-slate-400 mb-1.5 block">Who spent it</label>
        <div className="flex gap-2">
          {[
            { val: 'aaron', label: aaronLabel, cls: 'bg-indigo-600 border-indigo-500' },
            { val: 'cameron', label: cameronLabel, cls: 'bg-violet-600 border-violet-500' },
          ].map(({ val, label, cls }) => (
            <button key={val} type="button" onClick={() => set('person', val)}
              className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                form.person === val ? `${cls} text-white` : 'border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm text-slate-400 mb-1.5 block">Notes <span className="text-slate-600">(optional)</span></label>
        <input
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          placeholder="Optional details..."
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">
          Cancel
        </button>
        <button type="submit" className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors">
          Save Purchase
        </button>
      </div>
    </form>
  );
}

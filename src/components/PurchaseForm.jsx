import { useState } from 'react';

// Quick-pick categories shown as chips for fast entry
const QUICK_CATEGORIES = [
  'Food & Dining', 'Groceries', 'Gas', 'Shopping',
  'Coffee & Drinks', 'Entertainment', 'Health & Medical', 'Other',
];

export default function PurchaseForm({ initial = {}, onSave, onCancel, myName, spouseName }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    amount: '',
    merchant: '',
    category: 'Food & Dining',
    date: today,
    person: 'aaron',
    notes: '',
    ...initial,
    amount: initial.amount != null ? String(initial.amount) : '',
    person: initial.person === 'me' ? 'aaron' : (initial.person || 'aaron'),
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || !form.merchant) return;
    onSave({ ...form, amount: parseFloat(form.amount), date: form.date || today });
  };

  const aaronLabel = myName || 'Aaron';
  const cameronLabel = spouseName || 'Cameron';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Big amount */}
      <div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-500">$</span>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            autoFocus
            className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-10 pr-4 py-4 text-white text-3xl font-bold placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            required
          />
        </div>
      </div>

      {/* Where */}
      <div>
        <input
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          placeholder="Where? (e.g. Walmart, Amazon)"
          value={form.merchant}
          onChange={(e) => set('merchant', e.target.value)}
          required
        />
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        {QUICK_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => set('category', cat)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              form.category === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Person + date row */}
      <div className="flex gap-3">
        <div className="flex gap-2 flex-1">
          {[['aaron', aaronLabel, 'bg-indigo-600 border-indigo-500'], ['cameron', cameronLabel, 'bg-violet-600 border-violet-500']].map(([val, label, cls]) => (
            <button key={val} type="button" onClick={() => set('person', val)}
              className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                form.person === val ? `${cls} text-white` : 'border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}>
              {label}
            </button>
          ))}
        </div>
        <input
          type="date"
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          value={form.date}
          onChange={(e) => set('date', e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">
          Cancel
        </button>
        <button type="submit" className="flex-[2] py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors">
          Save
        </button>
      </div>
    </form>
  );
}

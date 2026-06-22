import { useState } from 'react';

export default function DebtForm({ initial = {}, onSave, onCancel, myName, spouseName }) {
  const [form, setForm] = useState({
    name: '',
    balance: '',
    minPayment: '',
    interestRate: '',
    notes: '',
    owner: 'aaron',
    ...initial,
    balance: initial.balance != null ? String(initial.balance) : '',
    minPayment: initial.minPayment != null ? String(initial.minPayment) : '',
    interestRate: initial.interestRate != null ? String(initial.interestRate) : '',
    owner: initial.owner === 'mine' ? 'aaron' : initial.owner === 'partner' ? 'cameron' : (initial.owner || 'aaron'),
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

  const aaronLabel = myName || 'Aaron';
  const cameronLabel = spouseName || 'Cameron';

  const ownerOptions = [
    { val: 'aaron', label: aaronLabel, activeClass: 'bg-indigo-600 border-indigo-500 text-white' },
    { val: 'cameron', label: cameronLabel, activeClass: 'bg-violet-600 border-violet-500 text-white' },
    { val: 'joint', label: 'Joint', activeClass: 'bg-slate-600 border-slate-500 text-white' },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-sm text-slate-400 mb-1.5 block">Debt Name *</label>
        <input
          autoFocus
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          placeholder="e.g. Car Loan, Credit Card Visa"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-slate-400 mb-1.5 block">Current Balance *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            placeholder="0.00"
            value={form.balance}
            onChange={(e) => set('balance', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm text-slate-400 mb-1.5 block">Min Payment *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            placeholder="0.00"
            value={form.minPayment}
            onChange={(e) => set('minPayment', e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className="text-sm text-slate-400 mb-1.5 block">Interest Rate % <span className="text-slate-600">(optional)</span></label>
        <input
          type="number"
          min="0"
          max="100"
          step="0.01"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          placeholder="e.g. 24.99"
          value={form.interestRate}
          onChange={(e) => set('interestRate', e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm text-slate-400 mb-1.5 block">Belongs to</label>
        <div className="flex gap-2">
          {ownerOptions.map(({ val, label, activeClass }) => (
            <button
              key={val}
              type="button"
              onClick={() => set('owner', val)}
              className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                form.owner === val ? activeClass : 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm text-slate-400 mb-1.5 block">Notes <span className="text-slate-600">(optional)</span></label>
        <textarea
          rows={2}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
          placeholder="Account details, lender info..."
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-1">
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

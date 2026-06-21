import { useState } from 'react';

export default function CommitmentForm({ initial = {}, onSave, onCancel, spouseName }) {
  const [form, setForm] = useState({
    description: '',
    amount: '',
    person: 'both',
    ...initial,
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const partnerLabel = spouseName || 'Partner';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.description) return;
    onSave({ ...form, amount: form.amount ? parseFloat(form.amount) : null });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-sm text-slate-400 mb-1 block">What's the commitment? *</label>
        <input
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          placeholder="e.g. Transfer $300 to vacation fund"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          autoFocus
          required
        />
      </div>

      <div>
        <label className="text-sm text-slate-400 mb-1 block">Amount <span className="text-slate-600">(optional)</span></label>
        <input
          type="number"
          min="0"
          step="0.01"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          placeholder="0.00"
          value={form.amount}
          onChange={(e) => set('amount', e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm text-slate-400 mb-1 block">Who's responsible</label>
        <div className="flex gap-2">
          {[['me', 'Me'], ['partner', partnerLabel], ['both', 'Both']].map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => set('person', val)}
              className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                form.person === val ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
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

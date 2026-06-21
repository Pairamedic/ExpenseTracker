import { useState } from 'react';

const FREQUENCIES = ['monthly', 'biweekly', 'weekly'];

export default function IncomeForm({ initial = {}, onSave, onCancel, spouseEnabled, spouseName }) {
  const [form, setForm] = useState({
    source: '',
    amount: '',
    isRecurring: true,
    frequency: 'biweekly',
    person: 'me',
    notes: '',
    ...initial,
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.source || !form.amount) return;
    onSave({ ...form, amount: parseFloat(form.amount) });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-sm text-slate-400 mb-1 block">Source *</label>
        <input
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          placeholder="e.g. Paycheck, Freelance, Side job"
          value={form.source}
          onChange={(e) => set('source', e.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-sm text-slate-400 mb-1 block">Amount (per paycheck) *</label>
        <input
          type="number"
          min="0"
          step="0.01"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          placeholder="0.00"
          value={form.amount}
          onChange={(e) => set('amount', e.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-sm text-slate-400 mb-1 block">Frequency</label>
        <select
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
          value={form.frequency}
          onChange={(e) => set('frequency', e.target.value)}
        >
          {FREQUENCIES.map((f) => (
            <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
          ))}
        </select>
      </div>

      {spouseEnabled && (
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Person</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => set('person', 'me')}
              className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${form.person === 'me' ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
              Me
            </button>
            <button type="button" onClick={() => set('person', 'spouse')}
              className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${form.person === 'spouse' ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
              {spouseName || 'Spouse'}
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="text-sm text-slate-400 mb-1 block">Notes</label>
        <input
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          placeholder="Optional"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <div
          className={`w-11 h-6 rounded-full transition-colors relative ${form.isRecurring ? 'bg-indigo-500' : 'bg-slate-700'}`}
          onClick={() => set('isRecurring', !form.isRecurring)}
        >
          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isRecurring ? 'translate-x-5' : 'translate-x-0'}`} />
        </div>
        <span className="text-sm text-slate-300">Recurring income</span>
      </label>

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

import { useState } from 'react';

export default function SavingsForm({ initial = {}, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    balance: '',
    goal: '',
    monthlyContribution: '',
    notes: '',
    ...initial,
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.balance) return;
    onSave({
      ...form,
      balance: parseFloat(form.balance),
      goal: form.goal ? parseFloat(form.goal) : null,
      monthlyContribution: form.monthlyContribution ? parseFloat(form.monthlyContribution) : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-sm text-slate-400 mb-1 block">Account name *</label>
        <input
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          placeholder="e.g. Joint Savings, Emergency Fund"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-sm text-slate-400 mb-1 block">Current balance *</label>
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Goal <span className="text-slate-600">(optional)</span></label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            placeholder="0.00"
            value={form.goal}
            onChange={(e) => set('goal', e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Monthly add <span className="text-slate-600">(optional)</span></label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            placeholder="0.00"
            value={form.monthlyContribution}
            onChange={(e) => set('monthlyContribution', e.target.value)}
          />
        </div>
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

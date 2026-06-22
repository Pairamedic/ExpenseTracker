import { useState } from 'react';

export default function PlannedExpenseForm({ initial = {}, onSave, onCancel, savings = [] }) {
  const [form, setForm] = useState({
    name: '',
    amount: '',
    targetDate: '',
    fromSavingsId: '',
    notes: '',
    ...initial,
    amount: initial.amount != null ? String(initial.amount) : '',
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.amount) return;
    onSave({
      ...form,
      amount: parseFloat(form.amount),
      fromSavingsId: form.fromSavingsId || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-sm text-slate-400 mb-1.5 block">Name *</label>
        <input
          autoFocus
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          placeholder="e.g. Beach Trip, Christmas Gifts"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-slate-400 mb-1.5 block">Estimated Cost *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm text-slate-400 mb-1.5 block">Target Date</label>
          <input
            type="date"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            value={form.targetDate}
            onChange={(e) => set('targetDate', e.target.value)}
          />
        </div>
      </div>

      {savings.length > 0 && (
        <div>
          <label className="text-sm text-slate-400 mb-1.5 block">Fund from savings</label>
          <select
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            value={form.fromSavingsId}
            onChange={(e) => set('fromSavingsId', e.target.value)}
          >
            <option value="">— Not specified —</option>
            {savings.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="text-sm text-slate-400 mb-1.5 block">Notes <span className="text-slate-600">(optional)</span></label>
        <textarea
          rows={2}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
          placeholder="Details about this planned expense..."
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">
          Cancel
        </button>
        <button type="submit" className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors">
          Save Plan
        </button>
      </div>
    </form>
  );
}

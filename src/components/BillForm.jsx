import { useState } from 'react';
import { Link } from 'lucide-react';

const CATEGORIES = ['Housing', 'Utilities', 'Insurance', 'Subscriptions', 'Auto', 'Medical', 'Food', 'Entertainment', 'Other'];

export default function BillForm({ initial = {}, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    amount: '',
    dueDay: '',
    category: 'Other',
    isRecurring: true,
    paymentUrl: '',
    notes: '',
    ...initial,
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.amount) return;
    onSave({
      ...form,
      amount: parseFloat(form.amount),
      dueDay: form.dueDay ? parseInt(form.dueDay) : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-sm text-slate-400 mb-1 block">Bill name *</label>
        <input className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          placeholder="e.g. Netflix, Rent, Electric" value={form.name} onChange={(e) => set('name', e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Amount *</label>
          <input type="number" min="0" step="0.01"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            placeholder="0.00" value={form.amount} onChange={(e) => set('amount', e.target.value)} required />
        </div>
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Due day of month</label>
          <input type="number" min="1" max="31"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            placeholder="e.g. 15" value={form.dueDay} onChange={(e) => set('dueDay', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="text-sm text-slate-400 mb-1 block">Category</label>
        <select className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
          value={form.category} onChange={(e) => set('category', e.target.value)}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="text-sm text-slate-400 mb-1 flex items-center gap-1.5"><Link size={14} /> Payment URL</label>
        <input type="url"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          placeholder="https://..." value={form.paymentUrl} onChange={(e) => set('paymentUrl', e.target.value)} />
      </div>
      <div>
        <label className="text-sm text-slate-400 mb-1 block">Notes</label>
        <input className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          placeholder="Optional notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>
      <label className="flex items-center gap-3 cursor-pointer">
        <div className={`w-11 h-6 rounded-full transition-colors relative ${form.isRecurring ? 'bg-indigo-500' : 'bg-slate-700'}`}
          onClick={() => set('isRecurring', !form.isRecurring)}>
          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isRecurring ? 'translate-x-5' : 'translate-x-0'}`} />
        </div>
        <span className="text-sm text-slate-300">Recurring monthly bill</span>
      </label>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">Cancel</button>
        <button type="submit" className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors">Save Bill</button>
      </div>
    </form>
  );
}

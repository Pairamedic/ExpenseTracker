import { useState } from 'react';
import { Link, CalendarOff } from 'lucide-react';

const CATEGORIES = ['Housing', 'Utilities', 'Insurance', 'Subscriptions', 'Auto', 'Medical', 'Food', 'Entertainment', 'Other'];

export default function BillForm({ initial = {}, onSave, onCancel, myName, spouseName }) {
  const [form, setForm] = useState({
    name: '',
    amount: '',
    dueDay: '',
    category: 'Other',
    isRecurring: true,
    isPermanent: false,
    paymentUrl: '',
    notes: '',
    owner: 'aaron',
    ...initial,
    amount: initial.amount != null ? String(initial.amount) : '',
    dueDay: initial.dueDay != null ? String(initial.dueDay) : '',
    // Migrate old owner values
    owner: initial.owner === 'mine' ? 'aaron' : initial.owner === 'partner' ? 'cameron' : (initial.owner || 'aaron'),
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.amount) return;
    onSave({
      ...form,
      amount: parseFloat(form.amount),
      dueDay: form.isPermanent ? null : (form.dueDay ? parseInt(form.dueDay) : null),
      isRecurring: true,
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
        <label className="text-sm text-slate-400 mb-1.5 block">Bill name *</label>
        <input
          autoFocus
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          placeholder="e.g. Netflix, Rent, Electric"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-slate-400 mb-1.5 block">Amount *</label>
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
          <label className="text-sm text-slate-400 mb-1.5 block">Due day</label>
          <input
            type="number"
            min="1"
            max="31"
            disabled={form.isPermanent}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-40"
            placeholder={form.isPermanent ? 'None' : 'e.g. 15'}
            value={form.isPermanent ? '' : form.dueDay}
            onChange={(e) => set('dueDay', e.target.value)}
          />
        </div>
      </div>

      {/* Permanent toggle */}
      <label className="flex items-center gap-3 cursor-pointer bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700/50">
        <div
          className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${form.isPermanent ? 'bg-indigo-500' : 'bg-slate-700'}`}
          onClick={() => set('isPermanent', !form.isPermanent)}
        >
          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isPermanent ? 'translate-x-5' : 'translate-x-0'}`} />
        </div>
        <div>
          <p className="text-sm text-slate-300 font-medium flex items-center gap-1.5"><CalendarOff size={14} /> Permanent bill</p>
          <p className="text-xs text-slate-500">No specific due date — always recurring</p>
        </div>
      </label>

      <div>
        <label className="text-sm text-slate-400 mb-1.5 block">Category</label>
        <select
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
          value={form.category}
          onChange={(e) => set('category', e.target.value)}
        >
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="text-sm text-slate-400 mb-1.5 block">Paid by</label>
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
        <label className="text-sm text-slate-400 mb-1.5 flex items-center gap-1.5">
          <Link size={14} /> Payment URL <span className="text-slate-600">(optional)</span>
        </label>
        <input
          type="url"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          placeholder="https://..."
          value={form.paymentUrl}
          onChange={(e) => set('paymentUrl', e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm text-slate-400 mb-1.5 block">Notes <span className="text-slate-600">(optional)</span></label>
        <textarea
          rows={2}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
          placeholder="Account numbers, login info, reminders..."
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">
          Cancel
        </button>
        <button type="submit" className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors">
          Save Bill
        </button>
      </div>
    </form>
  );
}

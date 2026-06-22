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
    owner: initial.owner === 'mine' ? 'aaron' : initial.owner === 'partner' ? 'cameron' : (initial.owner || 'aaron'),
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.amount) return;
    onSave({
      ...form,
      amount: parseFloat(form.amount),
      dueDay: form.dueDay ? parseInt(form.dueDay) : null,
      isRecurring: true,
    });
  };

  const aaronLabel = myName || 'Aaron';
  const cameronLabel = spouseName || 'Cameron';
  const ownerOptions = [
    { val: 'aaron', label: aaronLabel },
    { val: 'cameron', label: cameronLabel },
    { val: 'joint', label: 'Joint' },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="app-label">Bill name *</label>
        <input autoFocus className="app-input" placeholder="e.g. Netflix, Rent, Electric"
          value={form.name} onChange={(e) => set('name', e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="app-label">Amount *</label>
          <input type="number" min="0" step="0.01" className="app-input" placeholder="0.00"
            value={form.amount} onChange={(e) => set('amount', e.target.value)} required />
        </div>
        <div>
          <label className="app-label">Due day</label>
          <input type="number" min="1" max="31" className="app-input"
            placeholder="e.g. 15"
            value={form.dueDay}
            onChange={(e) => set('dueDay', e.target.value)} />
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer rounded-xl px-4 py-3" style={{ backgroundColor: 'var(--surface2)', border: '1px solid var(--border)' }}>
        <div
          onClick={() => set('isPermanent', !form.isPermanent)}
          style={{
            width: '2.75rem', height: '1.5rem', borderRadius: '9999px',
            backgroundColor: form.isPermanent ? 'var(--accent)' : 'var(--surface)',
            border: '1px solid var(--border)', position: 'relative', flexShrink: 0, cursor: 'pointer', transition: 'background-color 0.2s',
          }}
        >
          <div style={{
            position: 'absolute', top: '2px', width: '1.125rem', height: '1.125rem',
            backgroundColor: '#fff', borderRadius: '9999px', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            transition: 'left 0.2s', left: form.isPermanent ? 'calc(100% - 1.25rem)' : '2px',
          }} />
        </div>
        <div>
          <p className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
            <CalendarOff size={14} /> Permanent bill
          </p>
          <p className="text-xs" style={{ color: 'var(--subtle)' }}>No specific due date — always recurring</p>
        </div>
      </label>

      <div>
        <label className="app-label">Category</label>
        <select className="app-input" value={form.category} onChange={(e) => set('category', e.target.value)}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="app-label">Paid by</label>
        <div className="flex gap-2">
          {ownerOptions.map(({ val, label }) => (
            <button key={val} type="button" onClick={() => set('owner', val)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{
                backgroundColor: form.owner === val ? 'var(--accent)' : 'var(--surface2)',
                color: form.owner === val ? '#fff' : 'var(--muted)',
                border: `1px solid ${form.owner === val ? 'var(--accent)' : 'var(--border)'}`,
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="app-label flex items-center gap-1.5">
          <Link size={14} /> Payment URL <span style={{ color: 'var(--subtle)', fontSize: '0.75rem' }}>(optional)</span>
        </label>
        <input type="url" className="app-input" placeholder="https://..."
          value={form.paymentUrl} onChange={(e) => set('paymentUrl', e.target.value)} />
      </div>

      <div>
        <label className="app-label">Notes <span style={{ color: 'var(--subtle)', fontSize: '0.75rem' }}>(optional)</span></label>
        <textarea rows={2} className="app-input" style={{ resize: 'none' }}
          placeholder="Account numbers, login info, reminders..."
          value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="app-btn-secondary flex-1">Cancel</button>
        <button type="submit" className="app-btn-primary flex-1">Save Bill</button>
      </div>
    </form>
  );
}

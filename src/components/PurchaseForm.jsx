import { useState } from 'react';

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
  const personOptions = [['aaron', aaronLabel], ['cameron', cameronLabel]];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold" style={{ color: 'var(--subtle)' }}>$</span>
        <input
          type="number" min="0" step="0.01" inputMode="decimal" autoFocus required
          className="app-input"
          style={{ paddingLeft: '2.5rem', fontSize: '1.875rem', fontWeight: 700, borderRadius: '1rem', paddingTop: '1rem', paddingBottom: '1rem' }}
          placeholder="0.00"
          value={form.amount}
          onChange={(e) => set('amount', e.target.value)}
        />
      </div>

      <input className="app-input" placeholder="Where? (e.g. Walmart, Amazon)"
        value={form.merchant} onChange={(e) => set('merchant', e.target.value)} required />

      <div className="flex flex-wrap gap-2">
        {QUICK_CATEGORIES.map((cat) => (
          <button key={cat} type="button" onClick={() => set('category', cat)}
            className="px-3 py-2 rounded-xl text-sm font-medium"
            style={{
              backgroundColor: form.category === cat ? 'var(--accent)' : 'var(--surface2)',
              color: form.category === cat ? '#fff' : 'var(--muted)',
              border: `1px solid ${form.category === cat ? 'var(--accent)' : 'var(--border)'}`,
            }}>
            {cat}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="flex gap-2 flex-1">
          {personOptions.map(([val, label]) => (
            <button key={val} type="button" onClick={() => set('person', val)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{
                backgroundColor: form.person === val ? 'var(--accent)' : 'var(--surface2)',
                color: form.person === val ? '#fff' : 'var(--muted)',
                border: `1px solid ${form.person === val ? 'var(--accent)' : 'var(--border)'}`,
              }}>
              {label}
            </button>
          ))}
        </div>
        <input type="date" className="app-input" style={{ width: 'auto' }}
          value={form.date} onChange={(e) => set('date', e.target.value)} />
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="app-btn-secondary flex-1">Cancel</button>
        <button type="submit" className="app-btn-primary" style={{ flex: 2 }}>Save</button>
      </div>
    </form>
  );
}

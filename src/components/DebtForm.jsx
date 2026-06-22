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

  const ownerOptions = [
    { val: 'aaron', label: myName || 'Aaron' },
    { val: 'cameron', label: spouseName || 'Cameron' },
    { val: 'joint', label: 'Joint' },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="app-label">Debt Name *</label>
        <input autoFocus className="app-input" placeholder="e.g. Car Loan, Credit Card Visa"
          value={form.name} onChange={(e) => set('name', e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="app-label">Current Balance *</label>
          <input type="number" min="0" step="0.01" className="app-input" placeholder="0.00"
            value={form.balance} onChange={(e) => set('balance', e.target.value)} required />
        </div>
        <div>
          <label className="app-label">Min Payment *</label>
          <input type="number" min="0" step="0.01" className="app-input" placeholder="0.00"
            value={form.minPayment} onChange={(e) => set('minPayment', e.target.value)} required />
        </div>
      </div>

      <div>
        <label className="app-label">Interest Rate % <span style={{ color: 'var(--subtle)', fontSize: '0.75rem' }}>(optional)</span></label>
        <input type="number" min="0" max="100" step="0.01" className="app-input" placeholder="e.g. 24.99"
          value={form.interestRate} onChange={(e) => set('interestRate', e.target.value)} />
      </div>

      <div>
        <label className="app-label">Belongs to</label>
        <div className="flex gap-2">
          {ownerOptions.map(({ val, label }) => (
            <button key={val} type="button" onClick={() => set('owner', val)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
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
        <label className="app-label">Notes <span style={{ color: 'var(--subtle)', fontSize: '0.75rem' }}>(optional)</span></label>
        <textarea rows={2} className="app-input" style={{ resize: 'none' }}
          placeholder="Account details, lender info..."
          value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="app-btn-secondary flex-1">Cancel</button>
        <button type="submit" className="app-btn-primary flex-1">Save</button>
      </div>
    </form>
  );
}

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
        <label className="app-label">Account name *</label>
        <input className="app-input" placeholder="e.g. Joint Savings, Emergency Fund"
          value={form.name} onChange={(e) => set('name', e.target.value)} required />
      </div>
      <div>
        <label className="app-label">Current balance *</label>
        <input type="number" min="0" step="0.01" className="app-input" placeholder="0.00"
          value={form.balance} onChange={(e) => set('balance', e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="app-label">Goal <span style={{ color: 'var(--subtle)', fontSize: '0.75rem' }}>(optional)</span></label>
          <input type="number" min="0" step="0.01" className="app-input" placeholder="0.00"
            value={form.goal} onChange={(e) => set('goal', e.target.value)} />
        </div>
        <div>
          <label className="app-label">Monthly add <span style={{ color: 'var(--subtle)', fontSize: '0.75rem' }}>(optional)</span></label>
          <input type="number" min="0" step="0.01" className="app-input" placeholder="0.00"
            value={form.monthlyContribution} onChange={(e) => set('monthlyContribution', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="app-label">Notes <span style={{ color: 'var(--subtle)', fontSize: '0.75rem' }}>(optional)</span></label>
        <input className="app-input" placeholder="Optional"
          value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="app-btn-secondary flex-1">Cancel</button>
        <button type="submit" className="app-btn-primary flex-1">Save</button>
      </div>
    </form>
  );
}

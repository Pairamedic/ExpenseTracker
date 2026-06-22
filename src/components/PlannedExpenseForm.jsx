import { useState } from 'react';

export default function PlannedExpenseForm({ initial = {}, onSave, onCancel, savings = [] }) {
  const [form, setForm] = useState({
    name: '', amount: '', targetDate: '', fromSavingsId: '', notes: '',
    ...initial,
    amount: initial.amount != null ? String(initial.amount) : '',
  });
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.amount) return;
    onSave({ ...form, amount: parseFloat(form.amount), fromSavingsId: form.fromSavingsId || null });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="app-label">Name *</label>
        <input autoFocus className="app-input" placeholder="e.g. Beach Trip, Christmas Gifts"
          value={form.name} onChange={(e) => set('name', e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="app-label">Estimated Cost *</label>
          <input type="number" min="0" step="0.01" className="app-input" placeholder="0.00"
            value={form.amount} onChange={(e) => set('amount', e.target.value)} required />
        </div>
        <div>
          <label className="app-label">Target Date</label>
          <input type="date" className="app-input"
            value={form.targetDate} onChange={(e) => set('targetDate', e.target.value)} />
        </div>
      </div>
      {savings.length > 0 && (
        <div>
          <label className="app-label">Fund from savings</label>
          <select className="app-input" value={form.fromSavingsId} onChange={(e) => set('fromSavingsId', e.target.value)}>
            <option value="">— Not specified —</option>
            {savings.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="app-label">Notes <span style={{ color: 'var(--subtle)', fontSize: '0.75rem' }}>(optional)</span></label>
        <textarea rows={2} className="app-input" style={{ resize: 'none' }}
          placeholder="Details about this planned expense..."
          value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="app-btn-secondary flex-1">Cancel</button>
        <button type="submit" className="app-btn-primary flex-1">Save Plan</button>
      </div>
    </form>
  );
}

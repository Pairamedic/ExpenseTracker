import { useState } from 'react';

export default function CommitmentForm({ initial = {}, onSave, onCancel, spouseName }) {
  const [form, setForm] = useState({ description: '', amount: '', person: 'both', ...initial });
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const partnerLabel = spouseName || 'Partner';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.description) return;
    onSave({ ...form, amount: form.amount ? parseFloat(form.amount) : null });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="app-label">What's the commitment? *</label>
        <input autoFocus className="app-input" placeholder="e.g. Transfer $300 to vacation fund"
          value={form.description} onChange={(e) => set('description', e.target.value)} required />
      </div>
      <div>
        <label className="app-label">Amount <span style={{ color: 'var(--subtle)', fontSize: '0.75rem' }}>(optional)</span></label>
        <input type="number" min="0" step="0.01" className="app-input" placeholder="0.00"
          value={form.amount} onChange={(e) => set('amount', e.target.value)} />
      </div>
      <div>
        <label className="app-label">Who's responsible</label>
        <div className="flex gap-2">
          {[['me', 'Me'], ['partner', partnerLabel], ['both', 'Both']].map(([val, label]) => (
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
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="app-btn-secondary flex-1">Cancel</button>
        <button type="submit" className="app-btn-primary flex-1">Save</button>
      </div>
    </form>
  );
}

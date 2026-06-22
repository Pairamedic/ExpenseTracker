import { useState } from 'react';

const FREQUENCIES = ['monthly', 'biweekly', 'weekly'];

export default function IncomeForm({ initial = {}, onSave, onCancel, spouseEnabled, spouseName, jobs = [] }) {
  const [form, setForm] = useState({
    source: '',
    amount: '',
    isRecurring: true,
    frequency: 'biweekly',
    startDate: '',
    person: 'me',
    notes: '',
    linkedJobId: '',
    includeInAvailability: true,
    ...initial,
    includeInAvailability: initial.includeInAvailability !== false,
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.source || !form.amount) return;
    onSave({ ...form, amount: parseFloat(form.amount), linkedJobId: form.linkedJobId || null, includeInAvailability: form.includeInAvailability });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="app-label">Source *</label>
        <input className="app-input" placeholder="e.g. Paycheck, Freelance, Side job"
          value={form.source} onChange={(e) => set('source', e.target.value)} required />
      </div>

      <div>
        <label className="app-label">Amount (per paycheck) *</label>
        <input type="number" min="0" step="0.01" className="app-input" placeholder="0.00"
          value={form.amount} onChange={(e) => set('amount', e.target.value)} required />
      </div>

      <div>
        <label className="app-label">Frequency</label>
        <select className="app-input" value={form.frequency} onChange={(e) => set('frequency', e.target.value)}>
          {FREQUENCIES.map((f) => (
            <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
          ))}
        </select>
      </div>

      {form.frequency !== 'monthly' && (
        <div>
          <label className="app-label">
            Next or most recent pay date
            <span className="ml-1 text-xs" style={{ color: 'var(--subtle)' }}>(used to calculate schedule)</span>
          </label>
          <input type="date" className="app-input" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
        </div>
      )}

      {spouseEnabled && (
        <div>
          <label className="app-label">Person</label>
          <div className="flex gap-2">
            {['me', 'spouse'].map((p) => (
              <button key={p} type="button" onClick={() => set('person', p)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{
                  backgroundColor: form.person === p ? 'var(--accent)' : 'var(--surface2)',
                  color: form.person === p ? '#fff' : 'var(--muted)',
                  border: `1px solid ${form.person === p ? 'var(--accent)' : 'var(--border)'}`,
                }}>
                {p === 'me' ? 'Me' : (spouseName || 'Spouse')}
              </button>
            ))}
          </div>
        </div>
      )}

      {jobs.length > 0 && (
        <div>
          <label className="app-label">
            Link to Job <span className="ml-1" style={{ color: 'var(--subtle)', fontSize: '0.75rem' }}>(enables hours toggle)</span>
          </label>
          <select className="app-input" value={form.linkedJobId || ''} onChange={(e) => set('linkedJobId', e.target.value)}>
            <option value="">None</option>
            {jobs.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="app-label">Notes</label>
        <input className="app-input" placeholder="Optional" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>

      <div style={{ backgroundColor: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '0.875rem', padding: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text)' }}>Factor into Availability</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--subtle)', marginTop: '0.125rem' }}>Include in the Dashboard available amount</p>
        </div>
        <button type="button" onClick={() => set('includeInAvailability', !form.includeInAvailability)}
          style={{ width: '2.75rem', height: '1.5rem', borderRadius: '9999px', border: 'none', cursor: 'pointer', transition: 'background 0.2s', position: 'relative', flexShrink: 0,
            backgroundColor: form.includeInAvailability ? 'var(--accent)' : 'var(--border2)' }}>
          <span style={{ position: 'absolute', top: '2px', width: '1.125rem', height: '1.125rem', borderRadius: '9999px', backgroundColor: '#fff', transition: 'left 0.2s',
            left: form.includeInAvailability ? 'calc(100% - 1.25rem)' : '2px' }} />
        </button>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <div
          onClick={() => set('isRecurring', !form.isRecurring)}
          style={{
            width: '2.75rem', height: '1.5rem', borderRadius: '9999px',
            backgroundColor: form.isRecurring ? 'var(--accent)' : 'var(--surface2)',
            border: '1px solid var(--border)',
            position: 'relative', flexShrink: 0, cursor: 'pointer', transition: 'background-color 0.2s',
          }}
        >
          <div style={{
            position: 'absolute', top: '2px', width: '1.125rem', height: '1.125rem',
            backgroundColor: '#fff', borderRadius: '9999px', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            transition: 'left 0.2s', left: form.isRecurring ? 'calc(100% - 1.25rem)' : '2px',
          }} />
        </div>
        <span className="text-sm" style={{ color: 'var(--muted)' }}>Recurring income</span>
      </label>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="app-btn-secondary flex-1">Cancel</button>
        <button type="submit" className="app-btn-primary flex-1">Save</button>
      </div>
    </form>
  );
}

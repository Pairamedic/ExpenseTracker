import { useState } from 'react';
import { User, Trash2, AlertTriangle, Wallet, PiggyBank, DollarSign, Sun, Moon, LogOut, Mail, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { formatCurrency, exportAllData, exportAsHTML } from '../utils/helpers';

const ALL_EXPORT_CATS = [
  { key: 'bills', label: 'Bills' },
  { key: 'income', label: 'Income' },
  { key: 'debts', label: 'Debts' },
  { key: 'savings', label: 'Savings' },
  { key: 'commitments', label: 'Commitments' },
  { key: 'planned', label: 'Planned Expenses' },
  { key: 'purchases', label: 'Spending' },
];

export default function Settings() {
  const { settings, setSettings, bills, income, debts, savings, commitments, plannedExpenses, purchases } = useApp();
  const { user, signOut } = useAuth();
  const [form, setForm] = useState({ ...settings });
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exportCats, setExportCats] = useState(() => ALL_EXPORT_CATS.map((c) => c.key));

  const toggleCat = (key) => setExportCats((prev) =>
    prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
  );

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const save = () => { setSettings(form); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const clearAll = () => { localStorage.clear(); window.location.reload(); };

  const sectionLabelStyle = { color: 'var(--muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' };
  const cardStyle = { backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1rem' };

  return (
    <div style={{ paddingBottom: '7rem', backgroundColor: 'var(--bg)', minHeight: '100svh' }}>
      <div className="px-4 pt-5 pb-6">
        <h1 className="text-2xl font-black tracking-tight mb-6" style={{ color: 'var(--text)' }}>Settings</h1>

        {/* Appearance */}
        <section className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Sun size={15} style={{ color: 'var(--accent-text)' }} />
            <span style={sectionLabelStyle}>Appearance</span>
          </div>
          <div style={cardStyle}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {form.lightMode ? <Sun size={18} style={{ color: 'var(--warn)' }} /> : <Moon size={18} style={{ color: 'var(--accent-text)' }} />}
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{form.lightMode ? 'Light Mode' : 'Dark Mode'}</p>
                  <p className="text-xs" style={{ color: 'var(--subtle)' }}>Toggle display theme</p>
                </div>
              </div>
              <button
                onClick={() => set('lightMode', !form.lightMode)}
                style={{
                  width: '3rem',
                  height: '1.75rem',
                  borderRadius: '9999px',
                  backgroundColor: form.lightMode ? 'var(--accent)' : 'var(--surface2)',
                  border: '1px solid var(--border)',
                  position: 'relative',
                  transition: 'background-color 0.2s',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  left: form.lightMode ? 'calc(100% - 1.375rem)' : '2px',
                  width: '1.25rem',
                  height: '1.25rem',
                  borderRadius: '9999px',
                  backgroundColor: '#fff',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </button>
            </div>
            <p className="text-xs mt-3" style={{ color: 'var(--subtle)' }}>
              Note: tap Save Settings below to apply theme change.
            </p>
          </div>
        </section>

        {/* Profile */}
        <section className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <User size={15} style={{ color: 'var(--accent-text)' }} />
            <span style={sectionLabelStyle}>Profiles</span>
          </div>
          <div style={cardStyle} className="space-y-3">
            <div>
              <label className="app-label">Primary user name</label>
              <input className="app-input" placeholder="e.g. Aaron" value={form.myName} onChange={(e) => set('myName', e.target.value)} />
            </div>
            <div>
              <label className="app-label">Partner name</label>
              <input className="app-input" placeholder="e.g. Cameron" value={form.spouseName} onChange={(e) => set('spouseName', e.target.value)} />
            </div>
          </div>
        </section>

        {/* Spending & Savings */}
        <section className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={15} style={{ color: 'var(--positive-text)' }} />
            <span style={sectionLabelStyle}>Monthly Budget Targets</span>
          </div>
          <div style={cardStyle} className="space-y-4">
            <div>
              <label className="app-label flex items-center gap-1.5">
                <Wallet size={13} /> Spending money budget
              </label>
              <p className="text-xs mb-2" style={{ color: 'var(--subtle)' }}>How much of your available funds you plan to spend each month</p>
              <input type="number" min="0" step="1" className="app-input" placeholder="0"
                value={form.monthlySpendingBudget || ''}
                onChange={(e) => set('monthlySpendingBudget', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="app-label flex items-center gap-1.5">
                <PiggyBank size={13} /> Savings target
              </label>
              <p className="text-xs mb-2" style={{ color: 'var(--subtle)' }}>Amount you aim to move to savings each month</p>
              <input type="number" min="0" step="1" className="app-input" placeholder="0"
                value={form.monthlySavingsTarget || ''}
                onChange={(e) => set('monthlySavingsTarget', parseFloat(e.target.value) || 0)} />
            </div>
            {(form.monthlySpendingBudget > 0 || form.monthlySavingsTarget > 0) && (
              <div style={{ backgroundColor: 'var(--surface2)', borderRadius: '0.75rem', padding: '0.75rem' }} className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--muted)' }}>Spending budget</span>
                  <span style={{ color: 'var(--accent-text)' }} className="font-semibold">{formatCurrency(form.monthlySpendingBudget || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--muted)' }}>Savings target</span>
                  <span style={{ color: 'var(--positive-text)' }} className="font-semibold">{formatCurrency(form.monthlySavingsTarget || 0)}</span>
                </div>
                <div className="flex justify-between pt-1.5" style={{ borderTop: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--muted)' }}>Total allocated</span>
                  <span style={{ color: 'var(--text)' }} className="font-semibold">{formatCurrency((form.monthlySpendingBudget || 0) + (form.monthlySavingsTarget || 0))}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        <button
          onClick={save}
          className="app-btn-primary mb-4"
          style={saved ? { backgroundColor: 'var(--positive)' } : {}}
        >
          {saved ? 'Saved!' : 'Save Settings'}
        </button>

        {/* Data summary */}
        <section className="mb-4" style={cardStyle}>
          <p className="mb-3" style={sectionLabelStyle}>Data Summary</p>
          <div className="grid grid-cols-2 gap-2 text-sm" style={{ color: 'var(--muted)' }}>
            <p>{bills.length} bill{bills.length !== 1 ? 's' : ''}</p>
            <p>{income.length} income source{income.length !== 1 ? 's' : ''}</p>
            <p>{debts.length} debt{debts.length !== 1 ? 's' : ''}</p>
            <p>{savings.length} savings account{savings.length !== 1 ? 's' : ''}</p>
            <p>{commitments.length} commitment{commitments.length !== 1 ? 's' : ''}</p>
            <p>{purchases.length} purchase{purchases.length !== 1 ? 's' : ''}</p>
          </div>
        </section>

        {/* Account */}
        <section className="mb-4" style={cardStyle}>
          <p className="mb-3" style={sectionLabelStyle}>Account</p>
          <div className="flex items-center gap-3 mb-3">
            <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.75rem', backgroundColor: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Mail size={16} style={{ color: 'var(--accent-text)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Email</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{user?.email || '—'}</p>
            </div>
          </div>
          <button onClick={signOut}
            className="flex items-center gap-2 text-sm font-semibold"
            style={{ color: 'var(--muted)', border: '1px solid var(--border)', padding: '0.625rem 1rem', borderRadius: '0.75rem', backgroundColor: 'transparent', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
            <LogOut size={15} /> Sign Out
          </button>
        </section>

        {/* Export */}
        <section className="mb-4" style={cardStyle}>
          <p className="mb-1" style={sectionLabelStyle}>Export Data</p>
          <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>Choose which sections to include, then export as a printable HTML report or CSV files.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            {ALL_EXPORT_CATS.map(({ key, label }) => {
              const on = exportCats.includes(key);
              return (
                <button key={key} onClick={() => toggleCat(key)}
                  style={{ padding: '0.375rem 0.75rem', borderRadius: '0.625rem', fontSize: '0.8125rem', fontWeight: 700, border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`, cursor: 'pointer', transition: 'all 0.15s',
                    backgroundColor: on ? 'var(--accent-soft)' : 'var(--surface2)',
                    color: on ? 'var(--accent-text)' : 'var(--muted)' }}>
                  {on ? '✓ ' : ''}{label}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <button
              onClick={() => exportAsHTML({ bills, income, debts, savings, purchases, commitments, plannedExpenses, include: exportCats })}
              className="flex items-center gap-2 text-sm font-semibold"
              style={{ color: '#fff', border: 'none', padding: '0.625rem 1rem', borderRadius: '0.75rem', backgroundColor: 'var(--accent)', cursor: 'pointer' }}>
              <Download size={14} /> Export to HTML (Printable)
            </button>
            <button
              onClick={() => exportAllData({ bills, income, debts, savings, purchases })}
              className="flex items-center gap-2 text-sm font-semibold"
              style={{ color: 'var(--accent-text)', border: '1px solid var(--accent)', padding: '0.625rem 1rem', borderRadius: '0.75rem', backgroundColor: 'transparent', cursor: 'pointer' }}>
              <Download size={14} /> Export to CSV
            </button>
          </div>
        </section>

        {/* Danger zone */}
        <section style={{ backgroundColor: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: '1rem', padding: '1rem', opacity: 0.85 }}>
          <p className="mb-3 flex items-center gap-2" style={{ ...sectionLabelStyle, color: 'var(--danger)' }}>
            <AlertTriangle size={13} /> Danger Zone
          </p>
          <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>Permanently delete all data. This cannot be undone.</p>
          <button onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-2 text-sm"
            style={{ color: 'var(--danger)', border: '1px solid var(--danger)', padding: '0.625rem 1rem', borderRadius: '0.75rem', backgroundColor: 'transparent', cursor: 'pointer' }}>
            <Trash2 size={14} /> Clear All Data
          </button>
        </section>
      </div>

      {showClearConfirm && (
        <Modal title="Clear All Data?" onClose={() => setShowClearConfirm(false)}>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>This will permanently delete all your bills, income, debts, savings, purchases, and settings. This cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setShowClearConfirm(false)} className="app-btn-secondary flex-1">Cancel</button>
            <button onClick={clearAll} className="flex-1 py-3 rounded-xl font-semibold text-white" style={{ backgroundColor: 'var(--danger)' }}>Delete Everything</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

import { useState, useMemo } from 'react';
import { ShoppingBag, Pencil, Trash2, MoreVertical, ChevronLeft, ChevronRight, Plus, RefreshCw, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, Calendar, Upload, X, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, monthKey, monthLabel } from '../utils/helpers';
import Modal from '../components/Modal';
import PurchaseForm from '../components/PurchaseForm';
import BillForm from '../components/BillForm';

const PURCHASE_CATEGORIES = [
  'Food & Dining', 'Groceries', 'Gas & Fuel', 'Shopping', 'Entertainment',
  'Health & Fitness', 'Travel', 'Subscriptions', 'Utilities', 'Personal Care',
  'Education', 'Other',
];

function RecurringTemplateForm({ initial = {}, onSave, onCancel, myName, spouseName }) {
  const [merchant, setMerchant] = useState(initial.merchant || '');
  const [amount, setAmount] = useState(initial.amount != null ? String(initial.amount) : '');
  const [category, setCategory] = useState(initial.category || 'Subscriptions');
  const [person, setPerson] = useState(initial.person || 'me');
  const [dayOfMonth, setDayOfMonth] = useState(initial.dayOfMonth != null ? String(initial.dayOfMonth) : '1');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!merchant.trim() || !amount) return;
    onSave({
      merchant: merchant.trim(),
      amount: parseFloat(amount),
      category,
      person,
      dayOfMonth: parseInt(dayOfMonth, 10) || 1,
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label className="app-label">Merchant / Name *</label>
        <input className="app-input" placeholder="e.g. Netflix, Gym, Spotify…" value={merchant} onChange={(e) => setMerchant(e.target.value)} autoFocus required />
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div style={{ flex: 1 }}>
          <label className="app-label">Amount *</label>
          <input className="app-input" type="number" step="0.01" min="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div style={{ flex: 1 }}>
          <label className="app-label">Day of Month</label>
          <input className="app-input" type="number" min="1" max="28" placeholder="1" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="app-label">Category</label>
        <select className="app-input" value={category} onChange={(e) => setCategory(e.target.value)}>
          {PURCHASE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="app-label">Person</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[['me', myName || 'Me'], ['partner', spouseName || 'Partner']].map(([val, label]) => (
            <button key={val} type="button" onClick={() => setPerson(val)} style={{ flex: 1, padding: '0.625rem', borderRadius: '0.75rem', border: `2px solid ${person === val ? 'var(--accent)' : 'var(--border)'}`, backgroundColor: person === val ? 'rgba(99,102,241,0.12)' : 'var(--surface2)', color: person === val ? 'var(--accent-text)' : 'var(--muted)', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' }}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
        <button type="button" onClick={onCancel} className="app-btn-secondary" style={{ flex: 1 }}>Cancel</button>
        <button type="submit" className="app-btn-primary" style={{ flex: 1 }}>Save</button>
      </div>
    </form>
  );
}

// ── Smart Purchase Parser ─────────────────────────────────────────────────────

const SKIP_PATTERNS = /^(date|bill|amount|totals?|total|joint\s*charges?|cost|#|\s*$)/i;

function parseMDY(str) {
  const m = str.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})$/);
  if (!m) return null;
  const y = m[3].length === 2 ? '20' + m[3] : m[3];
  return `${y}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
}

function parseISO(str) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) ? str : null;
}

function parseAmount(str) {
  const n = parseFloat(str.replace(/[$,\s]/g, ''));
  return isNaN(n) || n <= 0 ? null : Math.round(n * 100) / 100;
}

function parsePurchaseText(text) {
  const today = new Date().toISOString().slice(0, 10);
  const results = [];

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || SKIP_PATTERNS.test(line)) continue;

    let entry = null;

    // Try tab then comma delimiters
    for (const sep of ['\t', ',']) {
      if (!line.includes(sep)) continue;
      const parts = line.split(sep).map((s) => s.trim()).filter(Boolean);
      if (parts.length < 2) continue;

      // Date | Merchant | Amount
      if (parts.length >= 3) {
        const dateFirst = parseMDY(parts[0]) || parseISO(parts[0]);
        if (dateFirst) {
          const amt = parseAmount(parts[parts.length - 1]);
          if (amt) {
            const merchant = parts.slice(1, parts.length - 1).join(' ').trim();
            if (merchant && !SKIP_PATTERNS.test(merchant)) { entry = { date: dateFirst, merchant, amount: amt }; break; }
          }
        }
        // Merchant | Amount | Date
        const dateLast = parseMDY(parts[parts.length - 1]) || parseISO(parts[parts.length - 1]);
        if (dateLast) {
          const amt = parseAmount(parts[parts.length - 2]);
          if (amt) {
            const merchant = parts.slice(0, parts.length - 2).join(' ').trim();
            if (merchant && !SKIP_PATTERNS.test(merchant)) { entry = { date: dateLast, merchant, amount: amt }; break; }
          }
        }
      }

      // Merchant | Amount  (most common — no date)
      const lastAmt = parseAmount(parts[parts.length - 1]);
      if (lastAmt && !parseMDY(parts[parts.length - 1]) && !parseISO(parts[parts.length - 1])) {
        const merchant = parts.slice(0, parts.length - 1).join(' ').trim();
        if (merchant && !SKIP_PATTERNS.test(merchant)) { entry = { date: today, merchant, amount: lastAmt }; break; }
      }
    }

    // Fallback: whitespace-only (no tab/comma) — only runs when delimiter loop found nothing
    if (!entry) {
      const tokens = line.split(/\s+/);
      if (tokens.length >= 2) {
        const lastAmt = parseAmount(tokens[tokens.length - 1]);
        if (lastAmt && !parseMDY(tokens[tokens.length - 1])) {
          const merchant = tokens.slice(0, tokens.length - 1).join(' ').trim();
          if (merchant && !SKIP_PATTERNS.test(merchant)) entry = { date: today, merchant, amount: lastAmt };
        }
      }
    }

    if (entry) results.push(entry);
  }

  return results;
}

function ImportPurchasesModal({ onImport, onCancel, myName, spouseName }) {
  const [person, setPerson] = useState('me');
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState('');

  const handleParse = () => {
    const entries = parsePurchaseText(text);
    if (!entries.length) {
      setError('No purchases detected. Make sure each line has a merchant and amount.');
      return;
    }
    setError('');
    setParsed(entries);
  };

  const removeEntry = (idx) => setParsed((prev) => prev.filter((_, i) => i !== idx));

  const handleImport = () => {
    if (!parsed?.length) return;
    onImport(parsed.map((e) => ({ ...e, person, category: 'Other' })));
  };

  const personLabels = [['me', myName || 'Me'], ['cameron', spouseName || 'Partner']];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {!parsed ? (
        <>
          {/* Person selector */}
          <div>
            <label className="app-label">Purchases are for</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {personLabels.map(([val, label]) => (
                <button key={val} type="button" onClick={() => setPerson(val)}
                  style={{ flex: 1, padding: '0.625rem', borderRadius: '0.75rem', border: `2px solid ${person === val ? 'var(--accent)' : 'var(--border)'}`, backgroundColor: person === val ? 'rgba(99,102,241,0.12)' : 'var(--surface2)', color: person === val ? 'var(--accent-text)' : 'var(--muted)', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Text area */}
          <div>
            <label className="app-label">Paste from Excel or type entries</label>
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setError(''); }}
              placeholder={'Examples:\n01.15.2026\tWalmart\t45.23\n01.16.2026\tStarbucks\t8.50\nAmazon 23.99\n9.99 Spotify'}
              style={{ width: '100%', minHeight: '10rem', padding: '0.875rem', borderRadius: '0.875rem', border: '1px solid var(--border)', backgroundColor: 'var(--surface2)', color: 'var(--text)', fontSize: '0.8125rem', fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box' }}
            />
            <p style={{ fontSize: '0.7rem', color: 'var(--subtle)', marginTop: '0.375rem' }}>
              Accepts: Excel copy (MM.DD.YYYY tab Merchant tab Amount), comma-separated, or Merchant Amount per line
            </p>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(244,63,94,0.1)', border: '1px solid var(--danger)', borderRadius: '0.75rem', padding: '0.75rem' }}>
              <AlertCircle size={15} style={{ color: 'var(--danger)', flexShrink: 0 }} />
              <p style={{ fontSize: '0.8125rem', color: 'var(--danger)' }}>{error}</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" onClick={onCancel} className="app-btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="button" onClick={handleParse} className="app-btn-primary" style={{ flex: 2 }} disabled={!text.trim()}>
              Parse Entries →
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontWeight: '700', color: 'var(--text)' }}>{parsed.length} entr{parsed.length === 1 ? 'y' : 'ies'} found</p>
            <button onClick={() => setParsed(null)} style={{ fontSize: '0.8125rem', color: 'var(--accent-text)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>← Edit text</button>
          </div>

          <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.875rem', overflow: 'hidden', maxHeight: '16rem', overflowY: 'auto' }}>
            {parsed.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.875rem', borderBottom: i < parsed.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.merchant}</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--subtle)' }}>{e.date}</p>
                </div>
                <p style={{ fontSize: '0.9375rem', fontWeight: '700', color: 'var(--text)', flexShrink: 0 }}>${e.amount.toFixed(2)}</p>
                <button onClick={() => removeEntry(i)} style={{ padding: '0.25rem', color: 'var(--subtle)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          {parsed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>All entries removed.</p>
              <button onClick={() => setParsed(null)} style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--accent-text)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>← Edit text</button>
            </div>
          ) : (
            <button type="button" onClick={handleImport} className="app-btn-primary">
              Import {parsed.length} Purchase{parsed.length !== 1 ? 's' : ''}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function monthOffset(mk, offset) {
  const [y, m] = mk.split('-').map(Number);
  return monthKey(new Date(y, m - 1 + offset, 1));
}

function PurchaseRow({ purchase, onEdit, onDelete, myName, spouseName }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isAaron = purchase.person === 'aaron' || purchase.person === 'me';
  const personLabel = isAaron ? (myName || 'Aaron') : (spouseName || 'Cameron');
  const dateLabel = new Date(purchase.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.125rem' }}>
          <p style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{purchase.merchant}</p>
          <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)', padding: '0.125rem 0.5rem', borderRadius: '0.375rem', flexShrink: 0 }}>
            {purchase.category}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--subtle)' }}>
          <span>{dateLabel}</span>
          <span>·</span>
          <span style={{ color: 'var(--accent-text)' }}>{personLabel}</span>
          {purchase.notes && <span>· {purchase.notes}</span>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        <p style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text)' }}>{formatCurrency(purchase.amount)}</p>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ padding: '0.25rem', color: 'var(--subtle)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '0.5rem' }}>
            <MoreVertical size={15} />
          </button>
          {menuOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setMenuOpen(false)} />
              <div style={{ position: 'absolute', right: 0, zIndex: 50, backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', overflow: 'hidden', minWidth: '9rem', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                <button onClick={() => { onEdit(purchase); setMenuOpen(false); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.875rem 1rem', fontSize: '0.875rem', color: 'var(--text)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <Pencil size={13} /> Edit
                </button>
                <button onClick={() => { onDelete(purchase.id); setMenuOpen(false); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.875rem 1rem', fontSize: '0.875rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Purchases() {
  const { purchases, addPurchase, updatePurchase, deletePurchase, settings, setSettings, bills, addBill, recurringTemplates, addRecurringTemplate, updateRecurringTemplate, deleteRecurringTemplate } = useApp();
  const [mk, setMk] = useState(() => monthKey(new Date()));
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [personFilter, setPersonFilter] = useState('all');
  const [showRecurring, setShowRecurring] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);
  const [addRecurringBill, setAddRecurringBill] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [showLimitEdit, setShowLimitEdit] = useState(false);
  const [limitInput, setLimitInput] = useState('');

  const { myName, spouseName, monthlySpendingBudget, purchasesInAvailable } = settings;
  const spendingLimit = monthlySpendingBudget || 0;
  const aaronLabel = myName || 'Aaron';
  const cameronLabel = spouseName || 'Cameron';

  const monthPurchases = purchases.filter((p) => {
    if (!p.date) return false;
    return p.date.startsWith(mk);
  });

  const normalPerson = (p) => (p.person === 'me' ? 'aaron' : p.person);

  const filtered = personFilter === 'all'
    ? monthPurchases
    : monthPurchases.filter((p) => normalPerson(p) === personFilter);

  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt));

  const totalAll = monthPurchases.reduce((s, p) => s + p.amount, 0);

  const limitPct = spendingLimit > 0 ? Math.min(100, (totalAll / spendingLimit) * 100) : 0;
  const limitColor = limitPct >= 90 ? 'var(--danger)' : limitPct >= 70 ? 'var(--warn)' : 'var(--positive)';
  const limitBorderColor = limitPct >= 90 ? 'rgba(244,63,94,0.25)' : limitPct >= 70 ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.25)';
  const limitBg = limitPct >= 90 ? 'rgba(244,63,94,0.06)' : limitPct >= 70 ? 'rgba(245,158,11,0.06)' : 'rgba(16,185,129,0.06)';
  const totalAaron = monthPurchases.filter((p) => normalPerson(p) === 'aaron').reduce((s, p) => s + p.amount, 0);
  const totalCameron = monthPurchases.filter((p) => normalPerson(p) === 'cameron').reduce((s, p) => s + p.amount, 0);

  const byCategory = {};
  filtered.forEach((p) => {
    byCategory[p.category] = (byCategory[p.category] || 0) + p.amount;
  });
  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const filteredTotal = filtered.reduce((s, p) => s + p.amount, 0);

  const recurringCandidates = useMemo(() => {
    const byMerchant = {};
    purchases.forEach((p) => {
      if (!p.merchant || !p.date) return;
      const key = p.merchant.toLowerCase().trim();
      if (!byMerchant[key]) byMerchant[key] = { merchant: p.merchant, months: new Set(), amounts: [] };
      byMerchant[key].months.add(p.date.slice(0, 7));
      byMerchant[key].amounts.push(p.amount);
    });
    const billNames = new Set(bills.map((b) => b.name.toLowerCase().trim()));
    return Object.values(byMerchant)
      .filter((v) => v.months.size >= 2 && !billNames.has(v.merchant.toLowerCase().trim()))
      .map((v) => ({
        merchant: v.merchant,
        monthCount: v.months.size,
        avgAmount: Math.round((v.amounts.reduce((s, a) => s + a, 0) / v.amounts.length) * 100) / 100,
      }))
      .sort((a, b) => b.monthCount - a.monthCount)
      .slice(0, 10);
  }, [purchases, bills]);

  return (
    <div className="app-page">
      <div className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.625rem', fontWeight: '900', color: 'var(--text)', letterSpacing: '-0.02em' }}>Spending</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setShowImport(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.75rem', backgroundColor: 'var(--surface)', color: 'var(--accent-text)', border: '1px solid var(--accent)', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer' }}>
              <Upload size={15} /> Import
            </button>
            <button onClick={() => setShowAdd(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer' }}>
              <Plus size={16} /> Log
            </button>
          </div>
        </div>

        {/* Person filter — always at top */}
        <div style={{ display: 'flex', backgroundColor: 'var(--surface2)', borderRadius: '0.875rem', padding: '0.25rem', gap: '0.25rem', marginBottom: '1rem' }}>
          {[['all', 'All'], ['aaron', aaronLabel], ['cameron', cameronLabel]].map(([val, label]) => (
            <button key={val} onClick={() => setPersonFilter(val)}
              style={{ flex: 1, padding: '0.625rem 0', borderRadius: '0.625rem', fontSize: '0.875rem', fontWeight: '700', border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                backgroundColor: personFilter === val ? 'var(--surface)' : 'transparent',
                color: personFilter === val ? 'var(--text)' : 'var(--subtle)',
                boxShadow: personFilter === val ? '0 1px 4px rgba(0,0,0,0.15)' : 'none' }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <button onClick={() => setMk(monthOffset(mk, -1))} style={{ padding: '0.5rem', borderRadius: '0.75rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <ChevronLeft size={20} />
          </button>
          <span style={{ flex: 1, textAlign: 'center', fontWeight: '700', fontSize: '1rem', color: 'var(--text)' }}>{monthLabel(mk)}</span>
          <button onClick={() => setMk(monthOffset(mk, 1))} style={{ padding: '0.5rem', borderRadius: '0.75rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Spending limit card — always visible */}
        <div style={{ backgroundColor: spendingLimit > 0 ? limitBg : 'var(--surface)', border: `1px solid ${spendingLimit > 0 ? limitBorderColor : 'var(--border)'}`, borderRadius: '1.25rem', padding: '1rem 1.25rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spendingLimit > 0 ? '0.625rem' : 0 }}>
            <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: spendingLimit > 0 ? limitColor : 'var(--subtle)' }}>
              Monthly Spending Limit
            </p>
            <button onClick={() => { setLimitInput(spendingLimit > 0 ? String(spendingLimit) : ''); setShowLimitEdit(true); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--subtle)', padding: '0.25rem', display: 'flex', alignItems: 'center' }}>
              <Pencil size={12} />
            </button>
          </div>
          {spendingLimit > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                <p style={{ fontSize: '1.625rem', fontWeight: '900', letterSpacing: '-0.02em', color: limitColor }}>
                  {totalAll > spendingLimit ? '-' : ''}{formatCurrency(Math.abs(spendingLimit - totalAll))}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>of {formatCurrency(spendingLimit)} limit</p>
              </div>
              <div style={{ height: '0.375rem', backgroundColor: 'var(--surface2)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '0.625rem' }}>
                <div style={{ height: '100%', backgroundColor: limitColor, width: `${limitPct}%`, transition: 'width 0.3s ease', borderRadius: '9999px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--subtle)' }}>
                  {formatCurrency(totalAll)} spent · {Math.round(limitPct)}% used
                </p>
                <button onClick={() => setSettings({ ...settings, purchasesInAvailable: !purchasesInAvailable })}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <div style={{ width: '2rem', height: '1.125rem', borderRadius: '9999px', position: 'relative', flexShrink: 0, transition: 'background 0.2s',
                    backgroundColor: purchasesInAvailable ? 'var(--accent)' : 'var(--border2)' }}>
                    <span style={{ position: 'absolute', top: '2px', width: '0.75rem', height: '0.75rem', borderRadius: '9999px', backgroundColor: '#fff', transition: 'left 0.2s',
                      left: purchasesInAvailable ? 'calc(100% - 0.875rem)' : '2px' }} />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: purchasesInAvailable ? 'var(--accent-text)' : 'var(--subtle)' }}>Show in Available</span>
                </button>
              </div>
            </>
          ) : (
            <button onClick={() => { setLimitInput(''); setShowLimitEdit(true); }}
              style={{ fontSize: '0.875rem', color: 'var(--subtle)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.125rem 0', textAlign: 'left' }}>
              Tap to set a monthly spending limit →
            </button>
          )}
        </div>

        {monthPurchases.length > 0 && (
          <>
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1.25rem', padding: '1.25rem', marginBottom: '0.75rem' }}>
              <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--subtle)', marginBottom: '0.25rem' }}>Total Spent</p>
              <p style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--text)' }}>{formatCurrency(totalAll)}</p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}><span style={{ color: 'var(--accent-text)', fontWeight: '700' }}>{aaronLabel}:</span> {formatCurrency(totalAaron)}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}><span style={{ color: 'var(--accent-text)', fontWeight: '700' }}>{cameronLabel}:</span> {formatCurrency(totalCameron)}</span>
              </div>
            </div>

            {topCategories.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                {topCategories.map(([cat, amt]) => (
                  <div key={cat} style={{ flexShrink: 0, backgroundColor: 'var(--surface)', borderRadius: '0.75rem', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', textAlign: 'center', minWidth: '5rem' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--subtle)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat}</p>
                    <p style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text)', marginTop: '0.125rem' }}>{formatCurrency(amt)}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ padding: '0 1rem' }}>
        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <ShoppingBag size={48} style={{ margin: '0 auto 1rem', opacity: 0.2, color: 'var(--muted)', display: 'block' }} />
            <p style={{ fontWeight: '700', color: 'var(--text)', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
              {monthPurchases.length === 0 ? 'No purchases yet' : 'No purchases for this filter'}
            </p>
            {monthPurchases.length === 0 && (
              <p style={{ fontSize: '0.9375rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>Tap Add to log day-to-day spending.</p>
            )}
            {monthPurchases.length === 0 && (
              <button onClick={() => setShowAdd(true)} className="app-btn-primary" style={{ maxWidth: '14rem', margin: '0 auto' }}>
                <Plus size={18} /> Log Purchase
              </button>
            )}
          </div>
        ) : (
          <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', overflow: 'hidden' }}>
            {sorted.map((p, i) => (
              <div key={p.id} style={i === sorted.length - 1 ? { borderBottom: 'none' } : {}}>
                <PurchaseRow purchase={p} onEdit={setEditItem} onDelete={deletePurchase}
                  myName={myName} spouseName={spouseName} />
              </div>
            ))}
            {personFilter !== 'all' && (
              <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--surface2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: '600' }}>Total ({personFilter === 'aaron' ? aaronLabel : cameronLabel})</span>
                <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text)' }}>{formatCurrency(filteredTotal)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recurring Templates */}
      <div style={{ padding: '0 1rem', marginTop: '1rem' }}>
        <button onClick={() => setShowTemplates(!showTemplates)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', padding: '0 0 0.75rem 0' }}>
          {showTemplates ? <ChevronUp size={14} style={{ color: 'var(--subtle)', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: 'var(--subtle)', flexShrink: 0 }} />}
          <Calendar size={13} style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--subtle)' }}>Recurring Auto-Log ({recurringTemplates.length})</span>
        </button>
        {showTemplates && (
          <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', overflow: 'hidden', marginBottom: '0.25rem' }}>
            {recurringTemplates.length === 0 ? (
              <div style={{ padding: '1.25rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>Auto-log recurring expenses (subscriptions, gym, etc.) each month.</p>
                <button onClick={() => setShowAddTemplate(true)} className="app-btn-primary" style={{ maxWidth: '12rem', margin: '0 auto', fontSize: '0.8125rem' }}>
                  <Plus size={14} /> Add Template
                </button>
              </div>
            ) : (
              <>
                {recurringTemplates.map((t, i) => {
                  const currentMk = monthKey(new Date());
                  const logged = t.lastLoggedMonth === currentMk;
                  return (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: i < recurringTemplates.length - 1 ? '1px solid var(--border)' : 'none', opacity: t.active ? 1 : 0.55 }}>
                      <button onClick={() => updateRecurringTemplate(t.id, { active: !t.active })} style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: t.active ? 'var(--accent-text)' : 'var(--muted)', display: 'flex' }}>
                        {t.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text)' }}>{t.merchant}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--subtle)' }}>
                          {formatCurrency(t.amount)} · day {t.dayOfMonth} · {t.category}
                          {logged && <span style={{ color: 'var(--positive)', marginLeft: '0.375rem' }}>✓ logged</span>}
                        </p>
                      </div>
                      <button onClick={() => setEditTemplate(t)} style={{ flexShrink: 0, padding: '0.25rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deleteRecurringTemplate(t.id)} style={{ flexShrink: 0, padding: '0.25rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
                <div style={{ padding: '0.625rem 1rem', backgroundColor: 'var(--surface2)', borderTop: '1px solid var(--border)' }}>
                  <button onClick={() => setShowAddTemplate(true)} style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--accent-text)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Plus size={13} /> Add template
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Recurring suggestions */}
      {recurringCandidates.length > 0 && (
        <div style={{ padding: '0 1rem', marginTop: '1rem' }}>
          <button onClick={() => setShowRecurring(!showRecurring)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', padding: '0 0 0.75rem 0' }}>
            {showRecurring ? <ChevronUp size={14} style={{ color: 'var(--subtle)', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: 'var(--subtle)', flexShrink: 0 }} />}
            <RefreshCw size={13} style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--subtle)' }}>Likely Recurring ({recurringCandidates.length})</span>
          </button>
          {showRecurring && (
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', overflow: 'hidden' }}>
              {recurringCandidates.map((r, i) => (
                <div key={r.merchant} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: i < recurringCandidates.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text)' }}>{r.merchant}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--subtle)' }}>avg {formatCurrency(r.avgAmount)} · {r.monthCount} months</p>
                  </div>
                  <button onClick={() => setAddRecurringBill({ name: r.merchant, amount: r.avgAmount })}
                    style={{ fontSize: '0.75rem', fontWeight: '700', padding: '0.35rem 0.625rem', borderRadius: '0.5rem', backgroundColor: 'rgba(99,102,241,0.12)', color: 'var(--accent-text)', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                    + Bill
                  </button>
                </div>
              ))}
              <div style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--surface2)' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--subtle)' }}>These merchants appear in 2+ months and aren't in your bills list</p>
              </div>
            </div>
          )}
        </div>
      )}

      {showAdd && (
        <Modal title="Log Purchase" onClose={() => setShowAdd(false)}>
          <PurchaseForm
            onSave={(data) => { addPurchase(data); setShowAdd(false); }}
            onCancel={() => setShowAdd(false)}
            myName={myName}
            spouseName={spouseName}
          />
        </Modal>
      )}
      {editItem && (
        <Modal title="Edit Purchase" onClose={() => setEditItem(null)}>
          <PurchaseForm
            initial={editItem}
            onSave={(data) => { updatePurchase(editItem.id, data); setEditItem(null); }}
            onCancel={() => setEditItem(null)}
            myName={myName}
            spouseName={spouseName}
          />
        </Modal>
      )}
      {showAddTemplate && (
        <Modal title="New Recurring Template" onClose={() => setShowAddTemplate(false)}>
          <RecurringTemplateForm
            onSave={(data) => { addRecurringTemplate(data); setShowAddTemplate(false); }}
            onCancel={() => setShowAddTemplate(false)}
            myName={myName}
            spouseName={spouseName}
          />
        </Modal>
      )}
      {editTemplate && (
        <Modal title="Edit Template" onClose={() => setEditTemplate(null)}>
          <RecurringTemplateForm
            initial={editTemplate}
            onSave={(data) => { updateRecurringTemplate(editTemplate.id, data); setEditTemplate(null); }}
            onCancel={() => setEditTemplate(null)}
            myName={myName}
            spouseName={spouseName}
          />
        </Modal>
      )}
      {addRecurringBill && (
        <Modal title="Add as Bill" onClose={() => setAddRecurringBill(null)}>
          <BillForm
            initial={{ name: addRecurringBill.name, amount: addRecurringBill.amount, isRecurring: true }}
            onSave={(data) => { addBill(data); setAddRecurringBill(null); }}
            onCancel={() => setAddRecurringBill(null)}
            myName={myName}
            spouseName={spouseName}
          />
        </Modal>
      )}
      {showImport && (
        <Modal title="Import Purchases" onClose={() => setShowImport(false)}>
          <ImportPurchasesModal
            onImport={(entries) => {
              entries.forEach((e) => addPurchase(e));
              setShowImport(false);
            }}
            onCancel={() => setShowImport(false)}
            myName={myName}
            spouseName={spouseName}
          />
        </Modal>
      )}
      {showLimitEdit && (
        <Modal title="Monthly Spending Limit" onClose={() => setShowLimitEdit(false)}>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '1.25rem' }}>
              Set a cap on logged purchases for the month. The bar turns yellow at 70% and red at 90%.
            </p>
            <input
              type="number"
              inputMode="decimal"
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
              placeholder="e.g. 2000"
              autoFocus
              style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '0.875rem', border: '1px solid var(--border)', backgroundColor: 'var(--surface2)', color: 'var(--text)', fontSize: '1.125rem', fontWeight: '700', marginBottom: '0.75rem', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {spendingLimit > 0 && (
                <button onClick={() => { setSettings({ ...settings, monthlySpendingBudget: 0 }); setShowLimitEdit(false); }}
                  style={{ flex: 1, padding: '0.875rem', borderRadius: '0.875rem', border: '1px solid var(--border)', backgroundColor: 'var(--surface2)', color: 'var(--danger)', fontSize: '0.9375rem', fontWeight: '700', cursor: 'pointer' }}>
                  Remove Limit
                </button>
              )}
              <button onClick={() => { setSettings({ ...settings, monthlySpendingBudget: parseFloat(limitInput) || 0 }); setShowLimitEdit(false); }}
                className="app-btn-primary" style={{ flex: 2 }}>
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

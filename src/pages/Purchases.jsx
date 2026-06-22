import { useState } from 'react';
import { ShoppingBag, Pencil, Trash2, MoreVertical, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, monthKey, monthLabel } from '../utils/helpers';
import Modal from '../components/Modal';
import PurchaseForm from '../components/PurchaseForm';

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
  const { purchases, addPurchase, updatePurchase, deletePurchase, settings } = useApp();
  const [mk, setMk] = useState(() => monthKey(new Date()));
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [personFilter, setPersonFilter] = useState('all');

  const { myName, spouseName } = settings;
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

  return (
    <div className="app-page">
      <div className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.625rem', fontWeight: '900', color: 'var(--text)', letterSpacing: '-0.02em' }}>Spending</h1>
          <button onClick={() => setShowAdd(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer' }}>
            <Plus size={16} /> Log Purchase
          </button>
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

            <div style={{ display: 'flex', backgroundColor: 'var(--surface2)', borderRadius: '0.875rem', padding: '0.25rem', gap: '0.25rem' }}>
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
    </div>
  );
}

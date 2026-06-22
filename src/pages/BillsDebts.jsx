import { useState } from 'react';
import {
  ExternalLink, MoreVertical, Pencil, Trash2,
  ChevronLeft, ChevronRight, Receipt, Info, X,
  CalendarOff, AlertTriangle, CreditCard,
  CheckCircle2, Circle, Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatCurrency, monthKey, monthLabel, getDueDateLabel,
  getBillsForMonth, getBillStatus, getBillStatusColor, isBillOverdueUnpaid,
} from '../utils/helpers';
import Modal from '../components/Modal';
import BillForm from '../components/BillForm';
import DebtForm from '../components/DebtForm';

function monthOffset(mk, offset) {
  const [y, m] = mk.split('-').map(Number);
  return monthKey(new Date(y, m - 1 + offset, 1));
}

function normalizeOwner(owner) {
  if (owner === 'mine') return 'aaron';
  if (owner === 'partner') return 'cameron';
  return owner || 'aaron';
}

function OwnerBadge({ owner, myName, spouseName }) {
  const n = normalizeOwner(owner);
  const label = n === 'joint' ? 'Joint' : n === 'cameron' ? (spouseName || 'Cameron') : (myName || 'Aaron');
  const color = n === 'joint' ? 'var(--muted)' : n === 'cameron' ? '#a78bfa' : 'var(--accent-text)';
  return (
    <span style={{ fontSize: '0.6875rem', color, backgroundColor: 'var(--surface2)', border: '1px solid var(--border)', padding: '0.125rem 0.5rem', borderRadius: '0.375rem', fontWeight: 600 }}>
      {label}
    </span>
  );
}

const STATUS_CYCLE = { unpaid: 'pending', pending: 'paid', paid: 'unpaid' };
const STATUS_COLORS = { paid: 'var(--positive)', pending: 'var(--warn)', unpaid: 'var(--danger)' };
const STATUS_BG = { paid: 'var(--positive-soft)', pending: '#451a03', unpaid: 'var(--danger-soft)' };

function StatusControl({ status, onSet }) {
  return (
    <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'var(--surface2)', borderRadius: '0.75rem', padding: '0.25rem', marginTop: '0.75rem' }}>
      {['unpaid', 'pending', 'paid'].map((val) => (
        <button key={val} onClick={() => onSet(val)}
          style={{
            flex: 1, padding: '0.375rem 0', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700,
            border: 'none', cursor: 'pointer', transition: 'all 0.15s',
            backgroundColor: status === val ? STATUS_COLORS[val] : 'transparent',
            color: status === val ? '#fff' : 'var(--subtle)',
          }}>
          {val.charAt(0).toUpperCase() + val.slice(1)}
        </button>
      ))}
    </div>
  );
}

function BillCard({ bill, mk, onSetStatus, onEdit, onDelete, myName, spouseName }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const status = getBillStatus(bill, mk);
  const isPermanent = bill.isPermanent || (!bill.dueDay && bill.isRecurring);
  const dueDateLabel = !isPermanent && bill.dueDay ? getDueDateLabel(bill.dueDay) : null;
  const isPaid = status === 'paid';
  const overdue = isBillOverdueUnpaid(bill, mk);
  const accentColor = isPaid ? 'var(--positive)' : overdue ? 'var(--danger)' : status === 'pending' ? 'var(--warn)' : 'var(--border2)';

  return (
    <div style={{ position: 'relative', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', backgroundColor: accentColor }} />
      <div style={{ padding: '1rem', paddingLeft: '1.125rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <p style={{ fontWeight: 700, fontSize: '1rem', color: isPaid ? 'var(--subtle)' : 'var(--text)', textDecoration: isPaid ? 'line-through' : 'none' }}>{bill.name}</p>
              <OwnerBadge owner={bill.owner} myName={myName} spouseName={spouseName} />
              {isPermanent && (
                <span style={{ fontSize: '0.6875rem', color: 'var(--subtle)', backgroundColor: 'var(--surface2)', border: '1px solid var(--border)', padding: '0.125rem 0.5rem', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <CalendarOff size={9} /> Permanent
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--subtle)' }}>{bill.category}</span>
              {dueDateLabel && <span style={{ fontSize: '0.75rem', fontWeight: 600, color: overdue ? 'var(--danger)' : 'var(--muted)' }}>· {dueDateLabel}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.375rem', flexShrink: 0 }}>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: isPaid ? 'var(--positive-text)' : status === 'pending' ? 'var(--warn)' : 'var(--text)' }}>
              {formatCurrency(bill.amount)}
            </p>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ color: 'var(--subtle)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.125rem' }}>
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        {(bill.notes || (bill.paymentUrl && !isPaid)) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.625rem' }}>
            {bill.notes && (
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowNote(!showNote)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--muted)', backgroundColor: 'var(--surface2)', border: '1px solid var(--border)', padding: '0.375rem 0.625rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
                  <Info size={12} /> Note
                </button>
                {showNote && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowNote(false)} />
                    <div style={{ position: 'absolute', left: 0, top: '2.25rem', zIndex: 50, backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', padding: '0.75rem', minWidth: '14rem', maxWidth: '17rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{bill.name}</p>
                        <button onClick={() => setShowNote(false)} style={{ color: 'var(--subtle)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={13} /></button>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-words' }}>{bill.notes}</p>
                    </div>
                  </>
                )}
              </div>
            )}
            {bill.paymentUrl && !isPaid && (
              <a href={bill.paymentUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#fff', backgroundColor: 'var(--accent)', padding: '0.375rem 0.75rem', borderRadius: '0.5rem', textDecoration: 'none' }}>
                Pay <ExternalLink size={10} />
              </a>
            )}
          </div>
        )}

        <StatusControl status={status} onSet={(s) => onSetStatus(bill.id, mk, s)} />
      </div>

      {menuOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setMenuOpen(false)} />
          <div style={{ position: 'absolute', right: '0.75rem', top: '3rem', zIndex: 50, backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', overflow: 'hidden', minWidth: '9rem', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <button onClick={() => { onEdit(bill); setMenuOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.875rem 1rem', fontSize: '0.875rem', color: 'var(--text)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <Pencil size={14} /> Edit
            </button>
            <button onClick={() => { onDelete(bill.id); setMenuOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.875rem 1rem', fontSize: '0.875rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function DebtCard({ debt, month, onTogglePaid, onEdit, onDelete, myName, spouseName }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isPaid = (debt.paidMonths || {})[month];

  return (
    <div style={{ backgroundColor: isPaid ? 'var(--positive-soft)' : 'var(--surface)', border: `1px solid ${isPaid ? 'var(--positive)' : 'var(--border)'}`, borderRadius: '1rem', padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <button onClick={() => onTogglePaid(debt.id, month)} style={{ flexShrink: 0, marginTop: '0.125rem', color: isPaid ? 'var(--positive-text)' : 'var(--border2)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          {isPaid ? <CheckCircle2 size={24} /> : <Circle size={24} />}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
            <p style={{ fontWeight: 700, fontSize: '1rem', color: isPaid ? 'var(--subtle)' : 'var(--text)', textDecoration: isPaid ? 'line-through' : 'none' }}>{debt.name}</p>
            <OwnerBadge owner={debt.owner} myName={myName} spouseName={spouseName} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Balance: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{formatCurrency(debt.balance)}</span></span>
            {debt.interestRate != null && (
              <span style={{ fontSize: '0.75rem', color: 'var(--subtle)', backgroundColor: 'var(--surface2)', border: '1px solid var(--border)', padding: '0.125rem 0.5rem', borderRadius: '0.375rem' }}>{debt.interestRate}% APR</span>
            )}
          </div>
          {debt.notes && <p style={{ fontSize: '0.75rem', color: 'var(--subtle)', marginTop: '0.375rem', lineHeight: 1.5 }}>{debt.notes}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: isPaid ? 'var(--positive-text)' : 'var(--warn)' }}>{formatCurrency(debt.minPayment)}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--subtle)' }}>min/mo</p>
          </div>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ color: 'var(--subtle)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}>
              <MoreVertical size={18} />
            </button>
            {menuOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setMenuOpen(false)} />
                <div style={{ position: 'absolute', right: 0, zIndex: 50, backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', overflow: 'hidden', minWidth: '9rem', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                  <button onClick={() => { onEdit(debt); setMenuOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.875rem 1rem', fontSize: '0.875rem', color: 'var(--text)', background: 'none', border: 'none', cursor: 'pointer' }}><Pencil size={14} /> Edit</button>
                  <button onClick={() => { onDelete(debt.id); setMenuOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.875rem 1rem', fontSize: '0.875rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={14} /> Delete</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BillsDebts() {
  const { bills, addBill, updateBill, deleteBill, setBillStatusDirect, debts, addDebt, updateDebt, deleteDebt, toggleDebtPaid, settings } = useApp();
  const [tab, setTab] = useState('bills');
  const [mk, setMk] = useState(() => monthKey(new Date()));
  const [showAddBill, setShowAddBill] = useState(false);
  const [editBill, setEditBill] = useState(null);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [editDebt, setEditDebt] = useState(null);
  const [ownerFilter, setOwnerFilter] = useState(null);

  const { myName, spouseName } = settings;
  const aaronLabel = myName || 'Aaron';
  const cameronLabel = spouseName || 'Cameron';

  const monthBills = getBillsForMonth(bills, mk);
  const filteredBills = ownerFilter ? monthBills.filter((b) => normalizeOwner(b.owner) === ownerFilter) : monthBills;
  const sortedBills = [...filteredBills].sort((a, b) => {
    const order = { unpaid: 0, pending: 1, paid: 2 };
    const aS = getBillStatus(a, mk), bS = getBillStatus(b, mk);
    if (order[aS] !== order[bS]) return order[aS] - order[bS];
    if (isBillOverdueUnpaid(a, mk) !== isBillOverdueUnpaid(b, mk)) return isBillOverdueUnpaid(a, mk) ? -1 : 1;
    return (a.dueDay || 99) - (b.dueDay || 99);
  });

  const billTotals = {
    unpaid: monthBills.filter((b) => getBillStatus(b, mk) === 'unpaid').reduce((s, b) => s + b.amount, 0),
    pending: monthBills.filter((b) => getBillStatus(b, mk) === 'pending').reduce((s, b) => s + b.amount, 0),
    paid: monthBills.filter((b) => getBillStatus(b, mk) === 'paid').reduce((s, b) => s + b.amount, 0),
  };
  const overdueCount = monthBills.filter((b) => isBillOverdueUnpaid(b, mk)).length;

  const filteredDebts = ownerFilter ? debts.filter((d) => normalizeOwner(d.owner) === ownerFilter) : debts;
  const sortedDebts = [
    ...filteredDebts.filter((d) => !(d.paidMonths || {})[mk]).sort((a, b) => b.balance - a.balance),
    ...filteredDebts.filter((d) => (d.paidMonths || {})[mk]).sort((a, b) => b.balance - a.balance),
  ];

  const ownerGroups = ['aaron', 'cameron', 'joint'].map((o) => ({
    key: o, label: o === 'aaron' ? aaronLabel : o === 'cameron' ? cameronLabel : 'Joint',
    balance: debts.filter((d) => normalizeOwner(d.owner) === o).reduce((s, d) => s + d.balance, 0),
    count: debts.filter((d) => normalizeOwner(d.owner) === o).length,
  })).filter((g) => g.count > 0);

  const toggleOwner = (val) => setOwnerFilter((cur) => cur === val ? null : val);

  const sectionLabel = { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--subtle)' };

  return (
    <div className="app-page">
      <div className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em' }}>Bills & Debts</h1>
          <button
            onClick={() => tab === 'bills' ? setShowAddBill(true) : setShowAddDebt(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' }}>
            <Plus size={16} /> {tab === 'bills' ? 'Add Bill' : 'Add Debt'}
          </button>
        </div>

        {/* Segmented tabs */}
        <div style={{ display: 'flex', backgroundColor: 'var(--surface2)', borderRadius: '0.875rem', padding: '0.25rem', gap: '0.25rem', marginBottom: '1rem' }}>
          {[['bills', <Receipt size={15} />, 'Bills'], ['debts', <CreditCard size={15} />, 'Debts']].map(([t, icon, label]) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', padding: '0.625rem 0', borderRadius: '0.625rem', fontSize: '0.9375rem', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                backgroundColor: tab === t ? 'var(--surface)' : 'transparent',
                color: tab === t ? 'var(--text)' : 'var(--subtle)',
                boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.15)' : 'none' }}>
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={() => setMk(monthOffset(mk, -1))} style={{ padding: '0.5rem', borderRadius: '0.75rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}><ChevronLeft size={20} /></button>
          <span style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>{monthLabel(mk)}</span>
          <button onClick={() => setMk(monthOffset(mk, 1))} style={{ padding: '0.5rem', borderRadius: '0.75rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}><ChevronRight size={20} /></button>
        </div>
      </div>

      <div style={{ padding: '0 1rem' }}>
        {/* Owner filter */}
        {(tab === 'bills' ? monthBills : debts).length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            {[['aaron', aaronLabel], ['cameron', cameronLabel], ['joint', 'Joint']].map(([val, label]) => (
              <button key={val} onClick={() => toggleOwner(val)}
                style={{ flex: 1, padding: '0.5rem 0', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  backgroundColor: ownerFilter === val ? 'var(--accent)' : 'var(--surface2)',
                  color: ownerFilter === val ? '#fff' : 'var(--muted)' }}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* ── Bills ── */}
        {tab === 'bills' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {monthBills.length > 0 && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  {[['Unpaid', billTotals.unpaid, 'var(--danger)'], ['Pending', billTotals.pending, 'var(--warn)'], ['Paid', billTotals.paid, 'var(--positive-text)']].map(([lbl, val, col]) => (
                    <div key={lbl} style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.875rem', padding: '0.75rem', textAlign: 'center' }}>
                      <p style={{ ...sectionLabel, marginBottom: '0.25rem' }}>{lbl}</p>
                      <p style={{ fontSize: '1rem', fontWeight: 800, color: col }}>{formatCurrency(val)}</p>
                    </div>
                  ))}
                </div>
                {overdueCount > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', backgroundColor: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: '0.875rem', padding: '0.75rem 1rem' }}>
                    <AlertTriangle size={15} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                    <p style={{ fontSize: '0.875rem', color: 'var(--danger)', fontWeight: 600 }}>
                      {overdueCount} bill{overdueCount > 1 ? 's are' : ' is'} overdue
                    </p>
                  </div>
                )}
              </>
            )}

            {sortedBills.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <Receipt size={48} style={{ margin: '0 auto 1rem', opacity: 0.2, color: 'var(--muted)', display: 'block' }} />
                <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                  {monthBills.length === 0 ? 'No bills yet' : 'No bills for this filter'}
                </p>
                {monthBills.length === 0 && (
                  <>
                    <p style={{ fontSize: '0.9375rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>Track recurring bills and mark them paid each month</p>
                    <button onClick={() => setShowAddBill(true)} className="app-btn-primary" style={{ maxWidth: '14rem', margin: '0 auto' }}>
                      <Plus size={18} /> Add First Bill
                    </button>
                  </>
                )}
              </div>
            ) : sortedBills.map((bill) => (
              <BillCard key={bill.id} bill={bill} mk={mk} onSetStatus={setBillStatusDirect}
                onEdit={setEditBill} onDelete={deleteBill} myName={myName} spouseName={spouseName} />
            ))}
          </div>
        )}

        {/* ── Debts ── */}
        {tab === 'debts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {debts.length > 0 && (
              <>
                <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1.25rem', padding: '1.25rem', marginBottom: '0.25rem' }}>
                  <p style={{ ...sectionLabel, marginBottom: '0.25rem' }}>Combined Debt</p>
                  <p style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--danger)' }}>{formatCurrency(debts.reduce((s, d) => s + d.balance, 0))}</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--subtle)', marginTop: '0.25rem' }}>{debts.length} account{debts.length !== 1 ? 's' : ''} · mins: {formatCurrency(debts.reduce((s, d) => s + d.minPayment, 0))}/mo</p>
                </div>

                {ownerGroups.length > 1 && (
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${ownerGroups.length}, 1fr)`, gap: '0.5rem', marginBottom: '0.25rem' }}>
                    {ownerGroups.map((g) => (
                      <div key={g.key} style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.875rem', padding: '0.75rem', textAlign: 'center' }}>
                        <p style={{ ...sectionLabel, marginBottom: '0.25rem' }}>{g.label}</p>
                        <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text)' }}>{formatCurrency(g.balance)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {sortedDebts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <CreditCard size={48} style={{ margin: '0 auto 1rem', opacity: 0.2, color: 'var(--muted)', display: 'block' }} />
                <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                  {debts.length === 0 ? 'No debts added' : 'No debts for this filter'}
                </p>
                {debts.length === 0 && (
                  <>
                    <p style={{ fontSize: '0.9375rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>Track loans, credit cards, and minimum payments</p>
                    <button onClick={() => setShowAddDebt(true)} className="app-btn-primary" style={{ maxWidth: '14rem', margin: '0 auto' }}>
                      <Plus size={18} /> Add First Debt
                    </button>
                  </>
                )}
              </div>
            ) : sortedDebts.map((debt) => (
              <DebtCard key={debt.id} debt={debt} month={mk} onTogglePaid={toggleDebtPaid}
                onEdit={setEditDebt} onDelete={deleteDebt} myName={myName} spouseName={spouseName} />
            ))}
          </div>
        )}
      </div>

      {showAddBill && (
        <Modal title="Add Bill" onClose={() => setShowAddBill(false)}>
          <BillForm onSave={(data) => { addBill({ ...data, month: mk }); setShowAddBill(false); }} onCancel={() => setShowAddBill(false)} myName={myName} spouseName={spouseName} />
        </Modal>
      )}
      {editBill && (
        <Modal title="Edit Bill" onClose={() => setEditBill(null)}>
          <BillForm initial={editBill} onSave={(data) => { updateBill(editBill.id, data); setEditBill(null); }} onCancel={() => setEditBill(null)} myName={myName} spouseName={spouseName} />
        </Modal>
      )}
      {showAddDebt && (
        <Modal title="Add Debt" onClose={() => setShowAddDebt(false)}>
          <DebtForm onSave={(data) => { addDebt(data); setShowAddDebt(false); }} onCancel={() => setShowAddDebt(false)} myName={myName} spouseName={spouseName} />
        </Modal>
      )}
      {editDebt && (
        <Modal title="Edit Debt" onClose={() => setEditDebt(null)}>
          <DebtForm initial={editDebt} onSave={(data) => { updateDebt(editDebt.id, data); setEditDebt(null); }} onCancel={() => setEditDebt(null)} myName={myName} spouseName={spouseName} />
        </Modal>
      )}
    </div>
  );
}

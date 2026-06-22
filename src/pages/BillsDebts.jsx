import { useState } from 'react';
import {
  ExternalLink, MoreVertical, Pencil, Trash2,
  ChevronLeft, ChevronRight, Receipt, Info, X,
  CalendarOff, AlertTriangle, CreditCard,
  CheckCircle2, Circle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatCurrency, monthKey, monthLabel, getDueDateLabel,
  getBillsForMonth, getBillStatus, getBillStatusColor, isBillOverdueUnpaid,
} from '../utils/helpers';
import Modal from '../components/Modal';
import BillForm from '../components/BillForm';
import DebtForm from '../components/DebtForm';
import AddButton from '../components/AddButton';

function monthOffset(mk, offset) {
  const [y, m] = mk.split('-').map(Number);
  return monthKey(new Date(y, m - 1 + offset, 1));
}

function normalizeOwner(owner) {
  if (owner === 'mine') return 'aaron';
  if (owner === 'partner') return 'cameron';
  return owner || 'aaron';
}

function ownerBadge(owner, myName, spouseName) {
  const n = normalizeOwner(owner);
  if (n === 'joint') return <span className="text-[10px] bg-slate-700 text-slate-300 border border-slate-600 px-1.5 py-0.5 rounded-md font-medium">Joint</span>;
  if (n === 'cameron') return <span className="text-[10px] bg-violet-900/60 text-violet-300 border border-violet-700/40 px-1.5 py-0.5 rounded-md font-medium">{spouseName || 'Cameron'}</span>;
  return <span className="text-[10px] bg-indigo-900/60 text-indigo-300 border border-indigo-700/40 px-1.5 py-0.5 rounded-md font-medium">{myName || 'Aaron'}</span>;
}

// ── Bills ────────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { val: 'unpaid', label: 'Unpaid', active: 'bg-rose-500 text-white' },
  { val: 'pending', label: 'Pending', active: 'bg-amber-500 text-white' },
  { val: 'paid', label: 'Paid', active: 'bg-emerald-500 text-white' },
];

function StatusControl({ status, onSet }) {
  return (
    <div className="flex gap-1 bg-slate-900/50 p-1 rounded-xl mt-3">
      {STATUS_OPTIONS.map(({ val, label, active }) => (
        <button key={val} onClick={() => onSet(val)}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${status === val ? active : 'text-slate-400 hover:text-slate-200'}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

function statusAccent(status, overdue) {
  if (status === 'paid') return 'bg-emerald-500';
  if (status === 'pending') return 'bg-amber-500';
  if (overdue) return 'bg-red-500';
  return 'bg-slate-600';
}

function BillCard({ bill, mk, onSetStatus, onEdit, onDelete, myName, spouseName }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const status = getBillStatus(bill, mk);
  const statusColor = getBillStatusColor(status, bill.dueDay);
  const isPermanent = bill.isPermanent || (!bill.dueDay && bill.isRecurring);
  const dueDateLabel = !isPermanent && bill.dueDay ? getDueDateLabel(bill.dueDay) : null;
  const isPaid = status === 'paid';
  const overdue = isBillOverdueUnpaid(bill, mk);

  return (
    <div className="relative rounded-2xl border border-slate-700/50 bg-slate-800/50 overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusAccent(status, overdue)}`} />
      <div className="p-4 pl-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className={`font-semibold text-base leading-tight ${isPaid ? 'line-through text-slate-500' : 'text-white'}`}>{bill.name}</p>
              {ownerBadge(bill.owner, myName, spouseName)}
              {isPermanent && (
                <span className="text-[10px] bg-slate-700/60 text-slate-400 border border-slate-600/40 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <CalendarOff size={9} /> Permanent
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-slate-500">{bill.category}</p>
              {dueDateLabel && <span className={`text-xs font-medium ${statusColor}`}>· {dueDateLabel}</span>}
            </div>
          </div>
          <div className="flex items-start gap-1.5 flex-shrink-0">
            <p className={`text-xl font-bold ${isPaid ? 'text-emerald-400' : status === 'pending' ? 'text-amber-300' : 'text-white'}`}>
              {formatCurrency(bill.amount)}
            </p>
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 -mr-1 text-slate-500 hover:text-slate-300 hover:bg-slate-700/60 rounded-lg transition-colors">
              <MoreVertical size={16} />
            </button>
          </div>
        </div>

        {(bill.notes || (bill.paymentUrl && !isPaid)) && (
          <div className="flex items-center gap-2 mt-2.5">
            {bill.notes && (
              <div className="relative">
                <button onClick={() => setShowNote(!showNote)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-400 bg-slate-700/40 hover:bg-indigo-500/10 px-2.5 py-1.5 rounded-lg transition-colors">
                  <Info size={13} /> Note
                </button>
                {showNote && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNote(false)} />
                    <div className="absolute left-0 top-9 z-50 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-3 min-w-[220px] max-w-[280px]">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{bill.name} — Note</p>
                        <button onClick={() => setShowNote(false)} className="text-slate-500 hover:text-slate-300"><X size={12} /></button>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap break-words">{bill.notes}</p>
                    </div>
                  </>
                )}
              </div>
            )}
            {bill.paymentUrl && !isPaid && (
              <a href={bill.paymentUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors font-medium">
                Pay <ExternalLink size={10} />
              </a>
            )}
          </div>
        )}

        <StatusControl status={status} onSet={(s) => onSetStatus(bill.id, mk, s)} />
      </div>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-3 top-12 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden min-w-[140px]">
            <button onClick={() => { onEdit(bill); setMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
              <Pencil size={14} /> Edit
            </button>
            <button onClick={() => { onDelete(bill.id); setMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-rose-400 hover:bg-slate-700 transition-colors">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Debts ────────────────────────────────────────────────────────────────────

function DebtCard({ debt, month, onTogglePaid, onEdit, onDelete, myName, spouseName }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isPaid = (debt.paidMonths || {})[month];

  return (
    <div className={`rounded-2xl border transition-colors p-4 ${isPaid ? 'border-emerald-800/40 bg-emerald-950/10' : 'border-slate-700/50 bg-slate-800/50'}`}>
      <div className="flex items-start gap-3">
        <button onClick={() => onTogglePaid(debt.id, month)}
          className={`mt-0.5 flex-shrink-0 transition-colors ${isPaid ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400'}`}>
          {isPaid ? <CheckCircle2 size={24} /> : <Circle size={24} />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <p className={`font-semibold text-base ${isPaid ? 'text-slate-400 line-through' : 'text-white'}`}>{debt.name}</p>
            {ownerBadge(debt.owner, myName, spouseName)}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-slate-500">Balance: <span className="text-slate-300 font-semibold">{formatCurrency(debt.balance)}</span></span>
            {debt.interestRate != null && (
              <span className="text-xs text-slate-600 bg-slate-700/40 px-2 py-0.5 rounded-lg">{debt.interestRate}% APR</span>
            )}
          </div>
          {debt.notes && <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{debt.notes}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right">
            <p className={`text-xl font-bold ${isPaid ? 'text-emerald-400' : 'text-amber-400'}`}>{formatCurrency(debt.minPayment)}</p>
            <p className="text-xs text-slate-500">min/mo</p>
          </div>
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700/60 rounded-lg transition-colors">
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden min-w-[140px]">
                  <button onClick={() => { onEdit(debt); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors"><Pencil size={14} /> Edit</button>
                  <button onClick={() => { onDelete(debt.id); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-rose-400 hover:bg-slate-700 transition-colors"><Trash2 size={14} /> Delete</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

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

  // Bills
  const monthBills = getBillsForMonth(bills, mk);
  const filteredBills = ownerFilter
    ? monthBills.filter((b) => normalizeOwner(b.owner) === ownerFilter)
    : monthBills;
  const sortedBills = [...filteredBills].sort((a, b) => {
    const order = { unpaid: 0, pending: 1, paid: 2 };
    const aS = getBillStatus(a, mk);
    const bS = getBillStatus(b, mk);
    if (order[aS] !== order[bS]) return order[aS] - order[bS];
    const aO = isBillOverdueUnpaid(a, mk) ? -1 : 0;
    const bO = isBillOverdueUnpaid(b, mk) ? -1 : 0;
    if (aO !== bO) return aO - bO;
    return (a.dueDay || 99) - (b.dueDay || 99);
  });
  const billTotals = {
    unpaid: monthBills.filter((b) => getBillStatus(b, mk) === 'unpaid').reduce((s, b) => s + b.amount, 0),
    pending: monthBills.filter((b) => getBillStatus(b, mk) === 'pending').reduce((s, b) => s + b.amount, 0),
    paid: monthBills.filter((b) => getBillStatus(b, mk) === 'paid').reduce((s, b) => s + b.amount, 0),
  };
  const overdueCount = monthBills.filter((b) => isBillOverdueUnpaid(b, mk)).length;

  // Debts
  const filteredDebts = ownerFilter ? debts.filter((d) => normalizeOwner(d.owner) === ownerFilter) : debts;
  const sortedDebts = [
    ...filteredDebts.filter((d) => !(d.paidMonths || {})[mk]).sort((a, b) => b.balance - a.balance),
    ...filteredDebts.filter((d) => (d.paidMonths || {})[mk]).sort((a, b) => b.balance - a.balance),
  ];
  const totalDebtBalance = filteredDebts.reduce((s, d) => s + d.balance, 0);
  const totalDebtMin = filteredDebts.reduce((s, d) => s + d.minPayment, 0);
  const aaronDebts = debts.filter((d) => normalizeOwner(d.owner) === 'aaron');
  const cameronDebts = debts.filter((d) => normalizeOwner(d.owner) === 'cameron');
  const jointDebts = debts.filter((d) => normalizeOwner(d.owner) === 'joint');

  const toggleOwner = (val) => setOwnerFilter((cur) => (cur === val ? null : val));

  return (
    <div className="pb-36">
      <div className="px-4 pt-6 pb-3">
        {/* Tab toggle */}
        <div className="flex bg-slate-800/60 rounded-2xl p-1 gap-1 mb-4">
          <button
            onClick={() => setTab('bills')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab === 'bills' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Receipt size={15} /> Bills
          </button>
          <button
            onClick={() => setTab('debts')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab === 'debts' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <CreditCard size={15} /> Debts
          </button>
        </div>

        {/* Month nav + Add button */}
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => setMk(monthOffset(mk, -1))} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors"><ChevronLeft size={20} /></button>
          <span className="text-base text-slate-200 font-semibold flex-1 text-center">{monthLabel(mk)}</span>
          <button onClick={() => setMk(monthOffset(mk, 1))} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors"><ChevronRight size={20} /></button>
          <AddButton
            onClick={() => tab === 'bills' ? setShowAddBill(true) : setShowAddDebt(true)}
            label={tab === 'bills' ? 'Add Bill' : 'Add Debt'}
          />
        </div>

        {/* Owner filter */}
        {(tab === 'bills' ? monthBills : debts).length > 0 && (
          <div className="flex gap-2 mb-1">
            {[['aaron', aaronLabel], ['cameron', cameronLabel], ['joint', 'Joint']].map(([val, label]) => (
              <button key={val} onClick={() => toggleOwner(val)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors truncate px-2 ${
                  ownerFilter === val ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bills tab content */}
      {tab === 'bills' && (
        <div className="px-4">
          {monthBills.length > 0 && (
            <>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40 text-center">
                  <p className="text-xs text-slate-500 mb-0.5">Unpaid</p>
                  <p className="text-base font-bold text-rose-400">{formatCurrency(billTotals.unpaid)}</p>
                </div>
                <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40 text-center">
                  <p className="text-xs text-slate-500 mb-0.5">Pending</p>
                  <p className="text-base font-bold text-amber-400">{formatCurrency(billTotals.pending)}</p>
                </div>
                <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40 text-center">
                  <p className="text-xs text-slate-500 mb-0.5">Paid</p>
                  <p className="text-base font-bold text-emerald-400">{formatCurrency(billTotals.paid)}</p>
                </div>
              </div>

              {overdueCount > 0 && (
                <div className="flex items-center gap-2.5 bg-red-950/40 border border-red-900/50 rounded-xl px-3.5 py-2.5 mb-4">
                  <AlertTriangle size={15} className="text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-300 font-medium">
                    {overdueCount} bill{overdueCount > 1 ? 's are' : ' is'} overdue this month
                  </p>
                </div>
              )}
            </>
          )}

          <div className="space-y-2.5">
            {sortedBills.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <Receipt size={44} className="mx-auto mb-3 opacity-30" />
                <p className="text-base">{monthBills.length === 0 ? 'No bills yet.' : 'No bills for this person.'}</p>
                {monthBills.length === 0 && <p className="text-sm mt-1 text-slate-600">Tap Add Bill to get started.</p>}
              </div>
            ) : sortedBills.map((bill) => (
              <BillCard key={bill.id} bill={bill} mk={mk} onSetStatus={setBillStatusDirect}
                onEdit={setEditBill} onDelete={deleteBill} myName={myName} spouseName={spouseName} />
            ))}
          </div>
        </div>
      )}

      {/* Debts tab content */}
      {tab === 'debts' && (
        <div className="px-4">
          {debts.length > 0 && (
            <>
              <div className="bg-gradient-to-br from-slate-800 to-slate-800/70 rounded-2xl p-4 border border-slate-700/50 mb-3">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Combined Debt</p>
                <p className="text-3xl font-black text-rose-400">{formatCurrency(debts.reduce((s, d) => s + d.balance, 0))}</p>
                <p className="text-xs text-slate-500 mt-1">{debts.length} account{debts.length !== 1 ? 's' : ''} · Monthly mins: {formatCurrency(debts.reduce((s, d) => s + d.minPayment, 0))}</p>
              </div>

              {/* Per-owner breakdown */}
              {(aaronDebts.length > 0 || cameronDebts.length > 0 || jointDebts.length > 0) && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {aaronDebts.length > 0 && (
                    <div className="bg-indigo-950/30 rounded-xl p-3 border border-indigo-900/40">
                      <p className="text-[10px] text-indigo-400 uppercase tracking-wide mb-1">{aaronLabel}</p>
                      <p className="text-base font-bold text-white">{formatCurrency(aaronDebts.reduce((s, d) => s + d.balance, 0))}</p>
                    </div>
                  )}
                  {cameronDebts.length > 0 && (
                    <div className="bg-violet-950/30 rounded-xl p-3 border border-violet-900/40">
                      <p className="text-[10px] text-violet-400 uppercase tracking-wide mb-1">{cameronLabel}</p>
                      <p className="text-base font-bold text-white">{formatCurrency(cameronDebts.reduce((s, d) => s + d.balance, 0))}</p>
                    </div>
                  )}
                  {jointDebts.length > 0 && (
                    <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Joint</p>
                      <p className="text-base font-bold text-white">{formatCurrency(jointDebts.reduce((s, d) => s + d.balance, 0))}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="space-y-2.5">
            {sortedDebts.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <CreditCard size={44} className="mx-auto mb-3 opacity-30" />
                <p className="text-base">{debts.length === 0 ? 'No debts added.' : 'No debts for this filter.'}</p>
                {debts.length === 0 && <p className="text-sm mt-1 text-slate-600">Tap Add Debt to track loans and credit cards.</p>}
              </div>
            ) : sortedDebts.map((debt) => (
              <DebtCard key={debt.id} debt={debt} month={mk} onTogglePaid={toggleDebtPaid}
                onEdit={setEditDebt} onDelete={deleteDebt} myName={myName} spouseName={spouseName} />
            ))}
          </div>
        </div>
      )}

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

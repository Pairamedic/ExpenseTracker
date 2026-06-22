import { useState } from 'react';
import {
  Plus, ExternalLink, MoreVertical, Pencil, Trash2,
  ChevronLeft, ChevronRight, Receipt, Info, X,
  Clock, Check, Circle, CalendarOff, AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatCurrency, monthKey, monthLabel, getDueDateLabel,
  getBillsForMonth, getBillStatus, getBillStatusColor, isBillOverdueUnpaid,
} from '../utils/helpers';
import Modal from '../components/Modal';
import BillForm from '../components/BillForm';

function monthOffset(mk, offset) {
  const [y, m] = mk.split('-').map(Number);
  return monthKey(new Date(y, m - 1 + offset, 1));
}

function ownerBadge(owner, myName, spouseName) {
  const aaronLabel = myName || 'Aaron';
  const cameronLabel = spouseName || 'Cameron';
  const normalized = owner === 'mine' ? 'aaron' : owner === 'partner' ? 'cameron' : (owner || 'aaron');
  if (normalized === 'joint') return <span className="text-[10px] bg-slate-700 text-slate-300 border border-slate-600 px-1.5 py-0.5 rounded-md font-medium">Joint</span>;
  if (normalized === 'cameron') return <span className="text-[10px] bg-violet-900/60 text-violet-300 border border-violet-700/40 px-1.5 py-0.5 rounded-md font-medium">{cameronLabel}</span>;
  return <span className="text-[10px] bg-indigo-900/60 text-indigo-300 border border-indigo-700/40 px-1.5 py-0.5 rounded-md font-medium">{aaronLabel}</span>;
}

function StatusButton({ status, onClick }) {
  if (status === 'paid') {
    return (
      <button onClick={onClick} title="Mark as Unpaid"
        className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 border-2 border-emerald-400 flex items-center justify-center transition-all hover:bg-emerald-400">
        <Check size={15} strokeWidth={3} className="text-white" />
      </button>
    );
  }
  if (status === 'pending') {
    return (
      <button onClick={onClick} title="Mark as Paid"
        className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center transition-all hover:bg-amber-500/30">
        <Clock size={14} className="text-amber-400" />
      </button>
    );
  }
  return (
    <button onClick={onClick} title="Mark as Pending"
      className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-slate-600 flex items-center justify-center transition-all hover:border-indigo-400 hover:bg-indigo-500/10">
      <Circle size={14} className="text-slate-600" />
    </button>
  );
}

function BillCard({ bill, mk, onToggle, onEdit, onDelete, myName, spouseName }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const status = getBillStatus(bill, mk);
  const statusColor = getBillStatusColor(status, bill.dueDay);
  const dueDateLabel = !bill.isPermanent && bill.dueDay ? getDueDateLabel(bill.dueDay) : null;
  const isPaid = status === 'paid';
  const isPermanent = bill.isPermanent || (!bill.dueDay && bill.isRecurring);

  const statusBg = isPaid
    ? 'border-emerald-800/40 bg-emerald-950/20'
    : status === 'pending'
    ? 'border-amber-800/40 bg-amber-950/10'
    : isBillOverdueUnpaid(bill, mk)
    ? 'border-red-900/50 bg-red-950/10'
    : 'border-slate-700/50 bg-slate-800/50';

  return (
    <div className={`relative rounded-2xl border transition-all ${statusBg}`}>
      <div className="flex items-start gap-3 p-4">
        <StatusButton status={status} onClick={() => onToggle(bill.id, mk)} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className={`font-semibold text-base leading-tight ${isPaid ? 'line-through text-slate-500' : 'text-white'}`}>
                  {bill.name}
                </p>
                {ownerBadge(bill.owner, myName, spouseName)}
                {isPermanent && !isPaid && (
                  <span className="text-[10px] bg-slate-700/60 text-slate-400 border border-slate-600/40 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                    <CalendarOff size={9} /> Permanent
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{bill.category}</p>
            </div>
            <p className={`text-xl font-bold flex-shrink-0 ${isPaid ? 'text-emerald-400' : status === 'pending' ? 'text-amber-300' : 'text-white'}`}>
              {formatCurrency(bill.amount)}
            </p>
          </div>

          <div className="flex items-center justify-between mt-2 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {dueDateLabel && (
                <span className={`text-xs font-medium ${statusColor} shrink-0`}>{dueDateLabel}</span>
              )}
              {status === 'pending' && <span className="text-xs text-amber-400 font-medium shrink-0">Pending</span>}
              {bill.notes && (
                <div className="relative">
                  <button
                    onClick={() => setShowNote(!showNote)}
                    className="p-1 text-slate-500 hover:text-indigo-400 transition-colors rounded-lg hover:bg-indigo-500/10"
                    title="View note"
                  >
                    <Info size={14} />
                  </button>
                  {showNote && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowNote(false)} />
                      <div className="absolute left-0 top-7 z-50 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-3 min-w-[220px] max-w-[280px]">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Note</p>
                          <button onClick={() => setShowNote(false)} className="text-slate-500 hover:text-slate-300">
                            <X size={12} />
                          </button>
                        </div>
                        <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{bill.notes}</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {bill.paymentUrl && !isPaid && (
                <a href={bill.paymentUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors font-medium">
                  Pay <ExternalLink size={10} />
                </a>
              )}
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700/60 rounded-lg transition-colors">
                <MoreVertical size={16} />
              </button>
            </div>
          </div>
        </div>
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

export default function Bills() {
  const { bills, addBill, updateBill, deleteBill, toggleBillPaid, settings } = useApp();
  const [mk, setMk] = useState(() => monthKey(new Date()));
  const [showAdd, setShowAdd] = useState(false);
  const [editBill, setEditBill] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');

  const { myName, spouseName } = settings;
  const aaronLabel = myName || 'Aaron';
  const cameronLabel = spouseName || 'Cameron';

  const monthBills = getBillsForMonth(bills, mk);

  // Normalize owner for filtering
  const normalize = (owner) => owner === 'mine' ? 'aaron' : owner === 'partner' ? 'cameron' : (owner || 'aaron');

  const filtered = monthBills.filter((b) => {
    const status = getBillStatus(b, mk);
    if (statusFilter === 'unpaid' && status !== 'unpaid') return false;
    if (statusFilter === 'pending' && status !== 'pending') return false;
    if (statusFilter === 'paid' && status !== 'paid') return false;
    if (ownerFilter !== 'all' && normalize(b.owner) !== ownerFilter) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const aStatus = getBillStatus(a, mk);
    const bStatus = getBillStatus(b, mk);
    const order = { unpaid: 0, pending: 1, paid: 2 };
    if (order[aStatus] !== order[bStatus]) return order[aStatus] - order[bStatus];
    const aOverdue = isBillOverdueUnpaid(a, mk) ? -1 : 0;
    const bOverdue = isBillOverdueUnpaid(b, mk) ? -1 : 0;
    if (aOverdue !== bOverdue) return aOverdue - bOverdue;
    return (a.dueDay || 99) - (b.dueDay || 99);
  });

  const totals = {
    all: monthBills.reduce((s, b) => s + b.amount, 0),
    unpaid: monthBills.filter((b) => getBillStatus(b, mk) === 'unpaid').reduce((s, b) => s + b.amount, 0),
    pending: monthBills.filter((b) => getBillStatus(b, mk) === 'pending').reduce((s, b) => s + b.amount, 0),
    paid: monthBills.filter((b) => getBillStatus(b, mk) === 'paid').reduce((s, b) => s + b.amount, 0),
  };

  const overdueCount = monthBills.filter((b) => isBillOverdueUnpaid(b, mk)).length;

  return (
    <div className="pb-32">
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-black text-white tracking-tight">Bills</h1>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            <Plus size={15} /> Add Bill
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => setMk(monthOffset(mk, -1))} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="text-base text-slate-200 font-semibold flex-1 text-center">{monthLabel(mk)}</span>
          <button onClick={() => setMk(monthOffset(mk, 1))} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Summary row */}
        {monthBills.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40 text-center">
              <p className="text-xs text-slate-500 mb-0.5">Unpaid</p>
              <p className="text-base font-bold text-red-400">{formatCurrency(totals.unpaid)}</p>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40 text-center">
              <p className="text-xs text-slate-500 mb-0.5">Pending</p>
              <p className="text-base font-bold text-amber-400">{formatCurrency(totals.pending)}</p>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40 text-center">
              <p className="text-xs text-slate-500 mb-0.5">Paid</p>
              <p className="text-base font-bold text-emerald-400">{formatCurrency(totals.paid)}</p>
            </div>
          </div>
        )}

        {/* Overdue alert */}
        {overdueCount > 0 && (
          <div className="flex items-center gap-2.5 bg-red-950/40 border border-red-900/50 rounded-xl px-3.5 py-2.5 mb-4">
            <AlertTriangle size={15} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300 font-medium">
              {overdueCount} bill{overdueCount > 1 ? 's are' : ' is'} overdue this month
            </p>
          </div>
        )}

        {/* Status filter */}
        <div className="flex gap-1.5 mb-2">
          {[['all', 'All'], ['unpaid', 'Unpaid'], ['pending', 'Pending'], ['paid', 'Paid']].map(([f, label]) => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                statusFilter === f ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Owner filter */}
        <div className="flex gap-1.5">
          {[['all', 'All'], ['aaron', aaronLabel], ['cameron', cameronLabel], ['joint', 'Joint']].map(([val, label]) => (
            <button key={val} onClick={() => setOwnerFilter(val)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-colors truncate px-1 ${
                ownerFilter === val ? 'bg-slate-600 text-white' : 'bg-slate-800/60 text-slate-500 hover:text-slate-300'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-2.5">
        {sorted.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Receipt size={44} className="mx-auto mb-3 opacity-30" />
            <p className="text-base">{monthBills.length === 0 ? 'No bills yet.' : 'No bills match your filters.'}</p>
            {monthBills.length === 0 && <p className="text-sm mt-1 text-slate-600">Tap Add Bill to get started.</p>}
          </div>
        ) : (
          sorted.map((bill) => (
            <BillCard key={bill.id} bill={bill} mk={mk} onToggle={toggleBillPaid}
              onEdit={setEditBill} onDelete={deleteBill} myName={myName} spouseName={spouseName} />
          ))
        )}
      </div>

      {showAdd && (
        <Modal title="Add Bill" onClose={() => setShowAdd(false)}>
          <BillForm
            onSave={(data) => { addBill({ ...data, month: mk }); setShowAdd(false); }}
            onCancel={() => setShowAdd(false)}
            myName={myName}
            spouseName={spouseName}
          />
        </Modal>
      )}
      {editBill && (
        <Modal title="Edit Bill" onClose={() => setEditBill(null)}>
          <BillForm
            initial={editBill}
            onSave={(data) => { updateBill(editBill.id, data); setEditBill(null); }}
            onCancel={() => setEditBill(null)}
            myName={myName}
            spouseName={spouseName}
          />
        </Modal>
      )}
    </div>
  );
}

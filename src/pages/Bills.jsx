import { useState } from 'react';
import { Plus, ExternalLink, Check, MoreVertical, Pencil, Trash2, ChevronLeft, ChevronRight, Receipt } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, monthKey, monthLabel, getDueDateLabel, getDueDateColor, getBillsForMonth } from '../utils/helpers';
import Modal from '../components/Modal';
import BillForm from '../components/BillForm';

function monthOffset(mk, offset) {
  const [y, m] = mk.split('-').map(Number);
  const d = new Date(y, m - 1 + offset, 1);
  return monthKey(d);
}

function BillCard({ bill, mk, onToggle, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isPaid = (bill.paidMonths || {})[mk];
  const dueDateColor = getDueDateColor(bill.dueDay, isPaid);
  const dueDateLabel = bill.dueDay ? getDueDateLabel(bill.dueDay) : null;

  return (
    <div className={`relative bg-slate-800/60 rounded-2xl border transition-all ${isPaid ? 'border-emerald-800/50 opacity-75' : 'border-slate-700/50'}`}>
      <div className="flex items-start gap-3 p-4">
        <button
          onClick={() => onToggle(bill.id, mk)}
          className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            isPaid ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 hover:border-indigo-400'
          }`}
        >
          {isPaid && <Check size={13} strokeWidth={3} className="text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={`font-semibold leading-tight ${isPaid ? 'line-through text-slate-400' : 'text-white'}`}>{bill.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{bill.category} {bill.isRecurring && '· Monthly'}</p>
            </div>
            <p className={`text-lg font-bold flex-shrink-0 ${isPaid ? 'text-emerald-400' : 'text-white'}`}>
              {formatCurrency(bill.amount)}
            </p>
          </div>

          <div className="flex items-center justify-between mt-2 gap-2">
            <div className="flex items-center gap-2">
              {dueDateLabel && (
                <span className={`text-xs font-medium ${dueDateColor}`}>{dueDateLabel}</span>
              )}
              {bill.notes && <span className="text-xs text-slate-500 truncate">{bill.notes}</span>}
            </div>
            <div className="flex items-center gap-1">
              {bill.paymentUrl && !isPaid && (
                <a
                  href={bill.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                  Pay <ExternalLink size={11} />
                </a>
              )}
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-colors">
                <MoreVertical size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-3 top-12 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden min-w-[140px]">
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
  const { bills, addBill, updateBill, deleteBill, toggleBillPaid } = useApp();
  const [mk, setMk] = useState(() => monthKey(new Date()));
  const [showAdd, setShowAdd] = useState(false);
  const [editBill, setEditBill] = useState(null);
  const [filter, setFilter] = useState('all');

  const monthBills = getBillsForMonth(bills, mk);
  const filtered = monthBills.filter((b) => {
    const paid = (b.paidMonths || {})[mk];
    if (filter === 'unpaid') return !paid;
    if (filter === 'paid') return paid;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const aPaid = (a.paidMonths || {})[mk] ? 1 : 0;
    const bPaid = (b.paidMonths || {})[mk] ? 1 : 0;
    if (aPaid !== bPaid) return aPaid - bPaid;
    return (a.dueDay || 99) - (b.dueDay || 99);
  });

  const totalUnpaid = monthBills.filter((b) => !(b.paidMonths || {})[mk]).reduce((s, b) => s + b.amount, 0);

  return (
    <div className="pb-24">
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Bills</h1>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            <Plus size={16} /> Add
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => setMk(monthOffset(mk, -1))} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="text-slate-300 font-medium flex-1 text-center">{monthLabel(mk)}</span>
          <button onClick={() => setMk(monthOffset(mk, 1))} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        {totalUnpaid > 0 && (
          <div className="bg-amber-900/30 border border-amber-700/40 rounded-xl px-4 py-2.5 mb-4 text-center">
            <span className="text-amber-300 text-sm font-medium">{formatCurrency(totalUnpaid)} still to pay</span>
          </div>
        )}

        <div className="flex gap-2">
          {['all', 'unpaid', 'paid'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 space-y-3">
        {sorted.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Receipt size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No bills yet. Tap Add to get started.</p>
          </div>
        ) : (
          sorted.map((bill) => (
            <BillCard
              key={bill.id}
              bill={bill}
              mk={mk}
              onToggle={toggleBillPaid}
              onEdit={setEditBill}
              onDelete={deleteBill}
            />
          ))
        )}
      </div>

      {showAdd && (
        <Modal title="Add Bill" onClose={() => setShowAdd(false)}>
          <BillForm
            onSave={(data) => { addBill({ ...data, month: mk }); setShowAdd(false); }}
            onCancel={() => setShowAdd(false)}
          />
        </Modal>
      )}

      {editBill && (
        <Modal title="Edit Bill" onClose={() => setEditBill(null)}>
          <BillForm
            initial={editBill}
            onSave={(data) => { updateBill(editBill.id, data); setEditBill(null); }}
            onCancel={() => setEditBill(null)}
          />
        </Modal>
      )}
    </div>
  );
}

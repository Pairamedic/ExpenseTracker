import { useState } from 'react';
import { Plus, Pencil, Trash2, MoreVertical, CreditCard, ChevronLeft, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, monthKey, monthLabel } from '../utils/helpers';
import Modal from '../components/Modal';
import DebtForm from '../components/DebtForm';

function monthOffset(mk, offset) {
  const [y, m] = mk.split('-').map(Number);
  return monthKey(new Date(y, m - 1 + offset, 1));
}

function DebtCard({ debt, month, onTogglePaid, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isPaid = (debt.paidMonths || {})[month];

  return (
    <div className={`bg-slate-800/60 rounded-2xl border transition-colors ${isPaid ? 'border-emerald-800/40' : 'border-slate-700/50'} p-4`}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => onTogglePaid(debt.id, month)}
          className={`mt-0.5 flex-shrink-0 transition-colors ${isPaid ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400'}`}
        >
          {isPaid ? <CheckCircle2 size={22} /> : <Circle size={22} />}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`font-semibold ${isPaid ? 'text-slate-400 line-through' : 'text-white'}`}>{debt.name}</p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs text-slate-500">Balance: <span className="text-slate-300">{formatCurrency(debt.balance)}</span></span>
            {debt.interestRate != null && (
              <span className="text-xs text-slate-500">{debt.interestRate}% APR</span>
            )}
          </div>
          {debt.notes && <p className="text-xs text-slate-500 mt-1 truncate">{debt.notes}</p>}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right">
            <p className={`text-lg font-bold ${isPaid ? 'text-emerald-400' : 'text-amber-400'}`}>{formatCurrency(debt.minPayment)}</p>
            <p className="text-xs text-slate-500">min/mo</p>
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden min-w-[140px]">
                  <button
                    onClick={() => { onEdit(debt); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    onClick={() => { onDelete(debt.id); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-rose-400 hover:bg-slate-700 transition-colors"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Debts() {
  const { debts, addDebt, updateDebt, deleteDebt, toggleDebtPaid } = useApp();
  const [mk, setMk] = useState(() => monthKey(new Date()));
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const totalBalance = debts.reduce((s, d) => s + d.balance, 0);
  const totalMin = debts.reduce((s, d) => s + d.minPayment, 0);
  const paidDebts = debts.filter((d) => (d.paidMonths || {})[mk]);
  const unpaidDebts = debts.filter((d) => !(d.paidMonths || {})[mk]);

  const sorted = [
    ...unpaidDebts.sort((a, b) => b.balance - a.balance),
    ...paidDebts.sort((a, b) => b.balance - a.balance),
  ];

  return (
    <div className="pb-24">
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Debts</h1>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
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

        {debts.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-1">
            <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Debt</p>
              <p className="text-xl font-bold text-rose-400">{formatCurrency(totalBalance)}</p>
              <p className="text-xs text-slate-500 mt-0.5">{debts.length} account{debts.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Monthly Mins</p>
              <p className="text-xl font-bold text-amber-400">{formatCurrency(totalMin)}</p>
              <p className="text-xs text-slate-500 mt-0.5">{paidDebts.length} of {debts.length} paid</p>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 space-y-3">
        {sorted.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No debts added. Tap Add to track loans, credit cards, etc.</p>
          </div>
        ) : (
          sorted.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              month={mk}
              onTogglePaid={toggleDebtPaid}
              onEdit={setEditItem}
              onDelete={deleteDebt}
            />
          ))
        )}
      </div>

      {showAdd && (
        <Modal title="Add Debt" onClose={() => setShowAdd(false)}>
          <DebtForm
            onSave={(data) => { addDebt(data); setShowAdd(false); }}
            onCancel={() => setShowAdd(false)}
          />
        </Modal>
      )}

      {editItem && (
        <Modal title="Edit Debt" onClose={() => setEditItem(null)}>
          <DebtForm
            initial={editItem}
            onSave={(data) => { updateDebt(editItem.id, data); setEditItem(null); }}
            onCancel={() => setEditItem(null)}
          />
        </Modal>
      )}
    </div>
  );
}

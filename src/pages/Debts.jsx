import { useState } from 'react';
import { Pencil, Trash2, MoreVertical, CreditCard, ChevronLeft, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, monthKey, monthLabel } from '../utils/helpers';
import Modal from '../components/Modal';
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
  const normalized = normalizeOwner(owner);
  if (normalized === 'joint') return <span className="text-[10px] bg-slate-700 text-slate-300 border border-slate-600 px-1.5 py-0.5 rounded-md font-medium">Joint</span>;
  if (normalized === 'cameron') return <span className="text-[10px] bg-violet-900/60 text-violet-300 border border-violet-700/40 px-1.5 py-0.5 rounded-md font-medium">{spouseName || 'Cameron'}</span>;
  return <span className="text-[10px] bg-indigo-900/60 text-indigo-300 border border-indigo-700/40 px-1.5 py-0.5 rounded-md font-medium">{myName || 'Aaron'}</span>;
}

function DebtCard({ debt, month, onTogglePaid, onEdit, onDelete, myName, spouseName }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isPaid = (debt.paidMonths || {})[month];

  return (
    <div className={`rounded-2xl border transition-colors p-4 ${isPaid ? 'border-emerald-800/40 bg-emerald-950/10' : 'border-slate-700/50 bg-slate-800/50'}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => onTogglePaid(debt.id, month)}
          className={`mt-0.5 flex-shrink-0 transition-colors ${isPaid ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400'}`}
        >
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

export default function Debts() {
  const { debts, addDebt, updateDebt, deleteDebt, toggleDebtPaid, settings } = useApp();
  const [mk, setMk] = useState(() => monthKey(new Date()));
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [ownerFilter, setOwnerFilter] = useState('all');

  const { myName, spouseName } = settings;
  const aaronLabel = myName || 'Aaron';
  const cameronLabel = spouseName || 'Cameron';

  const filtered = ownerFilter === 'all' ? debts : debts.filter((d) => normalizeOwner(d.owner) === ownerFilter);

  const paidDebts = filtered.filter((d) => (d.paidMonths || {})[mk]);
  const unpaidDebts = filtered.filter((d) => !(d.paidMonths || {})[mk]);

  const sorted = [
    ...unpaidDebts.sort((a, b) => b.balance - a.balance),
    ...paidDebts.sort((a, b) => b.balance - a.balance),
  ];

  const totalBalance = filtered.reduce((s, d) => s + d.balance, 0);
  const totalMin = filtered.reduce((s, d) => s + d.minPayment, 0);

  // Per-owner breakdown
  const aaronDebts = debts.filter((d) => normalizeOwner(d.owner) === 'aaron');
  const cameronDebts = debts.filter((d) => normalizeOwner(d.owner) === 'cameron');
  const jointDebts = debts.filter((d) => normalizeOwner(d.owner) === 'joint');

  const aaronTotal = aaronDebts.reduce((s, d) => s + d.balance, 0);
  const cameronTotal = cameronDebts.reduce((s, d) => s + d.balance, 0);
  const jointTotal = jointDebts.reduce((s, d) => s + d.balance, 0);
  const combinedTotal = debts.reduce((s, d) => s + d.balance, 0);

  return (
    <div className="pb-36">
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h1 className="text-2xl font-black text-white tracking-tight">Debts</h1>
          <AddButton onClick={() => setShowAdd(true)} label="Add Debt" />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => setMk(monthOffset(mk, -1))} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors"><ChevronLeft size={20} /></button>
          <span className="text-base text-slate-200 font-semibold flex-1 text-center">{monthLabel(mk)}</span>
          <button onClick={() => setMk(monthOffset(mk, 1))} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors"><ChevronRight size={20} /></button>
        </div>

        {debts.length > 0 && (
          <>
            {/* Collective total */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-800/70 rounded-2xl p-4 border border-slate-700/50 mb-3">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Combined Debt</p>
              <p className="text-3xl font-black text-rose-400">{formatCurrency(combinedTotal)}</p>
              <p className="text-xs text-slate-500 mt-1">{debts.length} account{debts.length !== 1 ? 's' : ''} total</p>
            </div>

            {/* Per-owner breakdown */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {aaronDebts.length > 0 && (
                <div className="bg-indigo-950/30 rounded-xl p-3 border border-indigo-900/40">
                  <p className="text-[10px] text-indigo-400 uppercase tracking-wide mb-1">{aaronLabel}</p>
                  <p className="text-base font-bold text-white">{formatCurrency(aaronTotal)}</p>
                  <p className="text-[10px] text-slate-500">{aaronDebts.length} acct</p>
                </div>
              )}
              {cameronDebts.length > 0 && (
                <div className="bg-violet-950/30 rounded-xl p-3 border border-violet-900/40">
                  <p className="text-[10px] text-violet-400 uppercase tracking-wide mb-1">{cameronLabel}</p>
                  <p className="text-base font-bold text-white">{formatCurrency(cameronTotal)}</p>
                  <p className="text-[10px] text-slate-500">{cameronDebts.length} acct</p>
                </div>
              )}
              {jointDebts.length > 0 && (
                <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Joint</p>
                  <p className="text-base font-bold text-white">{formatCurrency(jointTotal)}</p>
                  <p className="text-[10px] text-slate-500">{jointDebts.length} acct</p>
                </div>
              )}
            </div>

            {/* Owner filter */}
            <div className="flex gap-1.5 mb-2">
              {[['all', 'All', `${formatCurrency(combinedTotal)}`], ['aaron', aaronLabel, formatCurrency(aaronTotal)], ['cameron', cameronLabel, formatCurrency(cameronTotal)], ['joint', 'Joint', formatCurrency(jointTotal)]].map(([val, label]) => (
                <button key={val} onClick={() => setOwnerFilter(val)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors truncate px-1 ${
                    ownerFilter === val ? 'bg-slate-600 text-white' : 'bg-slate-800/60 text-slate-500 hover:text-slate-300'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {ownerFilter !== 'all' && (
              <div className="grid grid-cols-2 gap-3 mb-1">
                <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 text-center">
                  <p className="text-xs text-slate-500 mb-1">Total Balance</p>
                  <p className="text-xl font-bold text-rose-400">{formatCurrency(totalBalance)}</p>
                </div>
                <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 text-center">
                  <p className="text-xs text-slate-500 mb-1">Monthly Mins</p>
                  <p className="text-xl font-bold text-amber-400">{formatCurrency(totalMin)}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="px-4 space-y-2.5">
        {sorted.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <CreditCard size={44} className="mx-auto mb-3 opacity-30" />
            <p className="text-base">{debts.length === 0 ? 'No debts added.' : 'No debts for this filter.'}</p>
            {debts.length === 0 && <p className="text-sm mt-1 text-slate-600">Tap Add to track loans, credit cards, etc.</p>}
          </div>
        ) : sorted.map((debt) => (
          <DebtCard key={debt.id} debt={debt} month={mk} onTogglePaid={toggleDebtPaid}
            onEdit={setEditItem} onDelete={deleteDebt} myName={myName} spouseName={spouseName} />
        ))}
      </div>

      {showAdd && (
        <Modal title="Add Debt" onClose={() => setShowAdd(false)}>
          <DebtForm onSave={(data) => { addDebt(data); setShowAdd(false); }} onCancel={() => setShowAdd(false)} myName={myName} spouseName={spouseName} />
        </Modal>
      )}
      {editItem && (
        <Modal title="Edit Debt" onClose={() => setEditItem(null)}>
          <DebtForm initial={editItem} onSave={(data) => { updateDebt(editItem.id, data); setEditItem(null); }} onCancel={() => setEditItem(null)} myName={myName} spouseName={spouseName} />
        </Modal>
      )}
    </div>
  );
}

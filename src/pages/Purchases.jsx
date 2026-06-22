import { useState } from 'react';
import { Plus, ShoppingBag, Pencil, Trash2, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, monthKey, monthLabel } from '../utils/helpers';
import Modal from '../components/Modal';
import PurchaseForm from '../components/PurchaseForm';

function monthOffset(mk, offset) {
  const [y, m] = mk.split('-').map(Number);
  return monthKey(new Date(y, m - 1 + offset, 1));
}

const CATEGORY_COLORS = {
  'Food & Dining': 'text-orange-400 bg-orange-950/40 border-orange-900/40',
  'Groceries': 'text-green-400 bg-green-950/40 border-green-900/40',
  'Gas': 'text-yellow-400 bg-yellow-950/40 border-yellow-900/40',
  'Shopping': 'text-pink-400 bg-pink-950/40 border-pink-900/40',
  'Entertainment': 'text-purple-400 bg-purple-950/40 border-purple-900/40',
  'Coffee & Drinks': 'text-amber-400 bg-amber-950/40 border-amber-900/40',
  'Health & Medical': 'text-red-400 bg-red-950/40 border-red-900/40',
  'Personal Care': 'text-teal-400 bg-teal-950/40 border-teal-900/40',
  'Transportation': 'text-blue-400 bg-blue-950/40 border-blue-900/40',
  'Home & Garden': 'text-lime-400 bg-lime-950/40 border-lime-900/40',
  'Other': 'text-slate-400 bg-slate-800/60 border-slate-700/40',
};

function PurchaseCard({ purchase, onEdit, onDelete, myName, spouseName }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isAaron = purchase.person === 'aaron' || purchase.person === 'me';
  const personLabel = isAaron ? (myName || 'Aaron') : (spouseName || 'Cameron');
  const catColor = CATEGORY_COLORS[purchase.category] || CATEGORY_COLORS['Other'];
  const dateLabel = new Date(purchase.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-700/30 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-semibold text-sm text-white truncate">{purchase.merchant}</p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium flex-shrink-0 ${catColor}`}>
            {purchase.category}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{dateLabel}</span>
          <span>·</span>
          <span className={isAaron ? 'text-indigo-400' : 'text-violet-400'}>{personLabel}</span>
          {purchase.notes && <span>· {purchase.notes}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <p className="text-base font-bold text-white">{formatCurrency(purchase.amount)}</p>
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 text-slate-600 hover:text-slate-400 transition-colors rounded-lg hover:bg-slate-700/60">
            <MoreVertical size={15} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden min-w-[130px]">
                <button onClick={() => { onEdit(purchase); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
                  <Pencil size={13} /> Edit
                </button>
                <button onClick={() => { onDelete(purchase.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-rose-400 hover:bg-slate-700 transition-colors">
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

  // Category breakdown
  const byCategory = {};
  filtered.forEach((p) => {
    byCategory[p.category] = (byCategory[p.category] || 0) + p.amount;
  });
  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const filteredTotal = filtered.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="pb-32">
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-black text-white tracking-tight">Purchases</h1>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            <Plus size={15} /> Add
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => setMk(monthOffset(mk, -1))} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors"><ChevronLeft size={20} /></button>
          <span className="text-base text-slate-200 font-semibold flex-1 text-center">{monthLabel(mk)}</span>
          <button onClick={() => setMk(monthOffset(mk, 1))} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors"><ChevronRight size={20} /></button>
        </div>

        {monthPurchases.length > 0 && (
          <>
            {/* Totals */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-800/60 rounded-2xl p-4 border border-slate-700/50 mb-3">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Total Spent</p>
              <p className="text-3xl font-black text-white">{formatCurrency(totalAll)}</p>
              <div className="flex gap-4 mt-2">
                <span className="text-xs"><span className="text-indigo-400 font-semibold">{aaronLabel}:</span> <span className="text-slate-300">{formatCurrency(totalAaron)}</span></span>
                <span className="text-xs"><span className="text-violet-400 font-semibold">{cameronLabel}:</span> <span className="text-slate-300">{formatCurrency(totalCameron)}</span></span>
              </div>
            </div>

            {/* Category breakdown */}
            {topCategories.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                {topCategories.map(([cat, amt]) => (
                  <div key={cat} className="flex-shrink-0 bg-slate-800/60 rounded-xl px-3 py-2 border border-slate-700/40 text-center min-w-[80px]">
                    <p className="text-xs text-slate-500 truncate">{cat}</p>
                    <p className="text-sm font-bold text-white mt-0.5">{formatCurrency(amt)}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Person filter */}
            <div className="flex gap-1.5">
              {[['all', 'All', totalAll], ['aaron', aaronLabel, totalAaron], ['cameron', cameronLabel, totalCameron]].map(([val, label, total]) => (
                <button key={val} onClick={() => setPersonFilter(val)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    personFilter === val ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="px-4">
        {sorted.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <ShoppingBag size={44} className="mx-auto mb-3 opacity-30" />
            <p className="text-base font-medium">{monthPurchases.length === 0 ? 'No purchases yet.' : 'No purchases for this filter.'}</p>
            {monthPurchases.length === 0 && <p className="text-sm mt-1 text-slate-600">Tap Add to log day-to-day spending.</p>}
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
            {sorted.map((p) => (
              <PurchaseCard key={p.id} purchase={p} onEdit={setEditItem} onDelete={deletePurchase}
                myName={myName} spouseName={spouseName} />
            ))}
            {personFilter !== 'all' && (
              <div className="px-4 py-3 bg-slate-800/30 flex justify-between items-center">
                <span className="text-xs text-slate-500 font-medium">Total ({personFilter === 'aaron' ? aaronLabel : cameronLabel})</span>
                <span className="text-sm font-bold text-white">{formatCurrency(filteredTotal)}</span>
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

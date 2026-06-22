import { useState } from 'react';
import { Pencil, Trash2, MoreVertical, TrendingUp, RefreshCw, ChevronLeft, ChevronRight, Briefcase, ToggleLeft, ToggleRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, monthKey, monthLabel, getIncomeForMonth } from '../utils/helpers';
import { calcPaycheck, calcHoursFromShifts } from '../utils/taxCalc';
import Modal from '../components/Modal';
import IncomeForm from '../components/IncomeForm';
import AddButton from '../components/AddButton';

function monthOffset(mk, offset) {
  const [y, m] = mk.split('-').map(Number);
  return monthKey(new Date(y, m - 1 + offset, 1));
}

function monthlyAmount(item) {
  const mult = item.frequency === 'weekly' ? 4.33 : item.frequency === 'biweekly' ? 2.17 : 1;
  return item.amount * mult;
}

// Card for regular income entries
function IncomeCard({ item, onEdit, onDelete, spouseEnabled, spouseName, jobs, shifts, mk }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [useCalc, setUseCalc] = useState(item.useCalculated || false);

  // If linked to a job, compute calculated amount from shifts
  const linkedJob = item.linkedJobId ? jobs.find((j) => j.id === item.linkedJobId) : null;
  const calcResult = (() => {
    if (!linkedJob || !useCalc) return null;
    const monthShifts = shifts.filter((s) => s.jobId === linkedJob.id && s.date.startsWith(mk));
    if (monthShifts.length === 0) return null;
    const { regularHours, overtimeHours } = calcHoursFromShifts(monthShifts, linkedJob);
    return calcPaycheck({ job: linkedJob, regularHours, overtimeHours });
  })();

  const displayAmount = calcResult ? calcResult.netPay : monthlyAmount(item);
  const isCalcMode = linkedJob && useCalc && calcResult;

  return (
    <div className="relative bg-slate-800/60 rounded-2xl border border-slate-700/50 p-4">
      {item.isWorkTimeEntry && (
        <div className="flex items-center gap-1.5 mb-2">
          <Briefcase size={11} className="text-indigo-400" />
          <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">Work Time</span>
          {item.payPeriodStart && (
            <span className="text-[10px] text-slate-500">
              · {new Date(item.payPeriodStart + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              –{new Date(item.payPeriodEnd + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-base text-white">{item.source}</p>
            {item.isRecurring && <RefreshCw size={13} className="text-slate-500 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-slate-500 capitalize">{item.frequency}</p>
            {spouseEnabled && (
              <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-lg">
                {item.person === 'spouse' ? (spouseName || 'Spouse') : 'Me'}
              </span>
            )}
            {item.notes && <span className="text-xs text-slate-500 truncate">{item.notes}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right">
            {item.isWorkTimeEntry && item.grossPay ? (
              <>
                <p className="text-xl font-bold text-emerald-400">{formatCurrency(item.amount)}</p>
                <p className="text-xs text-slate-500">net · gross {formatCurrency(item.grossPay)}</p>
              </>
            ) : isCalcMode ? (
              <>
                <p className="text-xl font-bold text-indigo-400">{formatCurrency(calcResult.netPay)}</p>
                <p className="text-xs text-slate-500">calc net · {formatCurrency(calcResult.grossPay)} gross</p>
              </>
            ) : (
              <>
                <p className="text-xl font-bold text-emerald-400">{formatCurrency(displayAmount)}</p>
                <p className="text-xs text-slate-500">/mo</p>
              </>
            )}
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-colors">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {item.frequency !== 'monthly' && !item.isWorkTimeEntry && !isCalcMode && (
        <p className="text-xs text-slate-600 mt-2">{formatCurrency(item.amount)} per paycheck</p>
      )}

      {/* Toggle for linked job entries */}
      {linkedJob && (
        <button
          onClick={() => setUseCalc((v) => !v)}
          className={`mt-3 flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-colors ${
            useCalc
              ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
              : 'bg-slate-700/40 text-slate-400 border border-slate-600/40'
          }`}
        >
          {useCalc ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
          {useCalc
            ? `Using calculated from ${linkedJob.name} hours`
            : `Using fixed amount (tap to use ${linkedJob.name} hours)`}
        </button>
      )}

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-3 top-12 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden min-w-[140px]">
            <button onClick={() => { onEdit(item); setMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
              <Pencil size={14} /> Edit
            </button>
            <button onClick={() => { onDelete(item.id); setMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-rose-400 hover:bg-slate-700 transition-colors">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Income() {
  const { income, addIncome, updateIncome, deleteIncome, settings, jobs, shifts } = useApp();
  const [mk, setMk] = useState(() => monthKey(new Date()));
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const monthIncome = getIncomeForMonth(income, mk);
  const regularIncome = monthIncome.filter((i) => !i.isWorkTimeEntry);
  const workTimeIncome = monthIncome.filter((i) => i.isWorkTimeEntry);

  const totalMonthly = monthIncome.reduce((s, i) => s + monthlyAmount(i), 0);
  const myTotal = monthIncome.filter((i) => i.person !== 'spouse').reduce((s, i) => s + monthlyAmount(i), 0);
  const spouseTotal = monthIncome.filter((i) => i.person === 'spouse').reduce((s, i) => s + monthlyAmount(i), 0);

  return (
    <div className="pb-36">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h1 className="text-2xl font-black text-white tracking-tight">Income</h1>
          <AddButton onClick={() => setShowAdd(true)} label="Add Income" />
        </div>
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => setMk(monthOffset(mk, -1))} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors"><ChevronLeft size={20} /></button>
          <span className="text-base text-slate-300 font-semibold flex-1 text-center">{monthLabel(mk)}</span>
          <button onClick={() => setMk(monthOffset(mk, 1))} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors"><ChevronRight size={20} /></button>
        </div>
        <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-2xl p-5 mb-1">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Total Monthly Income</p>
          <p className="text-4xl font-black text-emerald-400">{formatCurrency(totalMonthly)}</p>
          {settings.spouseEnabled && (
            <div className="flex gap-5 mt-3">
              <span className="text-sm text-slate-500">Me: <span className="text-slate-300 font-semibold">{formatCurrency(myTotal)}</span></span>
              <span className="text-sm text-slate-500">{settings.spouseName || 'Spouse'}: <span className="text-slate-300 font-semibold">{formatCurrency(spouseTotal)}</span></span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 space-y-3">
        {/* Regular income */}
        {regularIncome.map((item) => (
          <IncomeCard key={item.id} item={item} onEdit={setEditItem} onDelete={deleteIncome}
            spouseEnabled={settings.spouseEnabled} spouseName={settings.spouseName}
            jobs={jobs} shifts={shifts} mk={mk} />
        ))}

        {/* Work time income entries */}
        {workTimeIncome.length > 0 && (
          <>
            {regularIncome.length > 0 && (
              <div className="pt-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Work Time Paychecks</p>
              </div>
            )}
            {workTimeIncome.map((item) => (
              <IncomeCard key={item.id} item={item} onEdit={setEditItem} onDelete={deleteIncome}
                spouseEnabled={settings.spouseEnabled} spouseName={settings.spouseName}
                jobs={jobs} shifts={shifts} mk={mk} />
            ))}
          </>
        )}

        {monthIncome.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <TrendingUp size={44} className="mx-auto mb-3 opacity-30" />
            <p className="text-base">No income added yet. Tap Add to get started.</p>
          </div>
        )}
      </div>

      {showAdd && (
        <Modal title="Add Income" onClose={() => setShowAdd(false)}>
          <IncomeForm
            onSave={(data) => { addIncome({ ...data, month: mk }); setShowAdd(false); }}
            onCancel={() => setShowAdd(false)}
            spouseEnabled={settings.spouseEnabled}
            spouseName={settings.spouseName}
            jobs={jobs}
          />
        </Modal>
      )}
      {editItem && (
        <Modal title="Edit Income" onClose={() => setEditItem(null)}>
          <IncomeForm
            initial={editItem}
            onSave={(data) => { updateIncome(editItem.id, data); setEditItem(null); }}
            onCancel={() => setEditItem(null)}
            spouseEnabled={settings.spouseEnabled}
            spouseName={settings.spouseName}
            jobs={jobs}
          />
        </Modal>
      )}
    </div>
  );
}

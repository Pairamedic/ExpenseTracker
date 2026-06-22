import { useState, useMemo } from 'react';
import {
  Briefcase, Clock, ChevronLeft, ChevronRight, Plus, Pencil, Trash2,
  MoreVertical, Check, DollarSign, Calculator, TrendingUp, Save,
  CalendarDays, Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, generateId, monthKey } from '../utils/helpers';
import { calcPaycheck, calcHoursFromShifts } from '../utils/taxCalc';
import Modal from '../components/Modal';

// ── helpers ─────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().slice(0, 10);

function fmt(date) {
  return new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function periodLabel(start, end) {
  const s = new Date(start + 'T12:00:00');
  const e = new Date(end + 'T12:00:00');
  const opts = { month: 'short', day: 'numeric' };
  const year = s.getFullYear() !== e.getFullYear() ? `, ${e.getFullYear()}` : '';
  return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
}

function getLastNDaysEnd(n) {
  const end = today();
  const start = addDays(end, -(n - 1));
  return { start, end };
}

function getBiweeklyPeriod(offset = 0) {
  // Anchor to a known biweekly pay cycle (Monday start)
  const anchor = new Date('2026-06-08T12:00:00'); // adjust as needed
  const now = new Date();
  const msSince = now - anchor;
  const periodMs = 14 * 24 * 60 * 60 * 1000;
  const periodNum = Math.floor(msSince / periodMs) + offset;
  const start = new Date(anchor.getTime() + periodNum * periodMs);
  const end = new Date(start.getTime() + 13 * 24 * 60 * 60 * 1000);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

// ── JobForm ──────────────────────────────────────────────────────────────────

const FILING_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'mfj', label: 'Married Filing Jointly' },
];

function JobForm({ initial = {}, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    hourlyRate: '',
    otRate: '',
    otRateAuto: true,
    normalShiftHours: '8',
    payFrequency: 'biweekly',
    filingStatus: 'single',
    iraPerPeriod: '',
    ...initial,
    otRateAuto: initial.otRateAuto !== false,
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const autoOTRate = form.hourlyRate
    ? (parseFloat(form.hourlyRate) * 1.5).toFixed(2)
    : '';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.hourlyRate) return;
    const rate = parseFloat(form.hourlyRate);
    const otRate = form.otRateAuto ? rate * 1.5 : parseFloat(form.otRate) || rate * 1.5;
    onSave({
      ...form,
      hourlyRate: rate,
      otRate: Math.round(otRate * 100) / 100,
      normalShiftHours: parseFloat(form.normalShiftHours) || 8,
      iraPerPeriod: parseFloat(form.iraPerPeriod) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-sm text-slate-400 mb-1 block">Job Name *</label>
        <input
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          placeholder="e.g. Amazon, Walmart, Side Gig"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Hourly Rate *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
            <input
              type="number" min="0" step="0.01"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-7 pr-3 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              placeholder="18.50"
              value={form.hourlyRate}
              onChange={(e) => set('hourlyRate', e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Normal Shift Hrs</label>
          <input
            type="number" min="1" max="24" step="0.5"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            placeholder="8"
            value={form.normalShiftHours}
            onChange={(e) => set('normalShiftHours', e.target.value)}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm text-slate-400">OT Rate</label>
          <button
            type="button"
            onClick={() => set('otRateAuto', !form.otRateAuto)}
            className="text-xs text-indigo-400 hover:text-indigo-300"
          >
            {form.otRateAuto ? `Auto (1.5× = $${autoOTRate})` : 'Set manually'}
          </button>
        </div>
        {!form.otRateAuto && (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
            <input
              type="number" min="0" step="0.01"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-7 pr-3 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              placeholder={autoOTRate || '27.75'}
              value={form.otRate}
              onChange={(e) => set('otRate', e.target.value)}
            />
          </div>
        )}
        {form.otRateAuto && (
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl px-4 py-3 text-slate-400 text-sm">
            {autoOTRate ? `$${autoOTRate}/hr` : 'Enter hourly rate first'}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Pay Frequency</label>
          <select
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
            value={form.payFrequency}
            onChange={(e) => set('payFrequency', e.target.value)}
          >
            <option value="biweekly">Biweekly</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Filing Status</label>
          <select
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
            value={form.filingStatus}
            onChange={(e) => set('filingStatus', e.target.value)}
          >
            {FILING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm text-slate-400 mb-1 block">
          IRA / 401k Pre-tax Deduction
          <span className="text-slate-600 ml-1">(per paycheck)</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
          <input
            type="number" min="0" step="0.01"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-7 pr-3 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            placeholder="0.00  (optional)"
            value={form.iraPerPeriod}
            onChange={(e) => set('iraPerPeriod', e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">
          Cancel
        </button>
        <button type="submit"
          className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors">
          Save Job
        </button>
      </div>
    </form>
  );
}

// ── ShiftForm ────────────────────────────────────────────────────────────────

function ShiftForm({ initial = {}, jobs, onSave, onCancel }) {
  const defaultJobId = jobs[0]?.id || '';
  const [form, setForm] = useState({
    date: today(),
    jobId: defaultJobId,
    hoursWorked: '',
    notes: '',
    ...initial,
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const selectedJob = jobs.find((j) => j.id === form.jobId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.jobId || !form.hoursWorked) return;
    onSave({ ...form, hoursWorked: parseFloat(form.hoursWorked) });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-sm text-slate-400 mb-1 block">Date</label>
        <input
          type="date"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
          value={form.date}
          onChange={(e) => set('date', e.target.value)}
          required
        />
      </div>

      {jobs.length > 1 && (
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Job</label>
          <select
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
            value={form.jobId}
            onChange={(e) => set('jobId', e.target.value)}
          >
            {jobs.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="text-sm text-slate-400 mb-1 block">
          Hours Worked
          {selectedJob && (
            <span className="text-slate-600 ml-1">
              (normal shift: {selectedJob.normalShiftHours}h)
            </span>
          )}
        </label>
        <input
          type="number" min="0" max="24" step="0.25"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          placeholder="8.0"
          value={form.hoursWorked}
          onChange={(e) => set('hoursWorked', e.target.value)}
          required
          autoFocus
        />
      </div>

      <div>
        <label className="text-sm text-slate-400 mb-1 block">Notes (optional)</label>
        <input
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          placeholder="e.g. Covered a shift, short day"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">
          Cancel
        </button>
        <button type="submit"
          className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors">
          Log Shift
        </button>
      </div>
    </form>
  );
}

// ── Pay Breakdown Card ───────────────────────────────────────────────────────

function PayBreakdown({ result }) {
  const rows = [
    { label: `Regular (${result.regularHours}h × $${result.regularHours > 0 ? (result.regularPay / result.regularHours).toFixed(2) : '—'})`, value: result.regularPay, color: 'text-white' },
    result.overtimeHours > 0 && { label: `Overtime (${result.overtimeHours}h)`, value: result.otPay, color: 'text-amber-300' },
  ].filter(Boolean);

  const deductions = [
    result.iraDeduction > 0 && { label: 'IRA / 401k (pre-tax)', value: result.iraDeduction },
    { label: 'Federal Income Tax (FIT)', value: result.fit },
    { label: 'Social Security (FICA 6.2%)', value: result.fica },
    { label: 'Medicare (MEDI 1.45%)', value: result.medi },
    { label: 'AR State Income Tax (SIT)', value: result.sitAR },
  ].filter(Boolean);

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
      {/* Gross */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-700/50">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Earnings</p>
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between items-center py-1">
            <span className="text-sm text-slate-400">{r.label}</span>
            <span className={`text-sm font-semibold ${r.color}`}>{formatCurrency(r.value)}</span>
          </div>
        ))}
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-700/40">
          <span className="text-sm font-bold text-white">Gross Pay</span>
          <span className="text-base font-black text-white">{formatCurrency(result.grossPay)}</span>
        </div>
      </div>

      {/* Deductions */}
      <div className="px-4 pt-3 pb-3 border-b border-slate-700/50">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Deductions</p>
        {result.iraDeduction > 0 && (
          <div className="flex justify-between items-center py-1">
            <span className="text-sm text-slate-400">IRA / 401k (pre-tax)</span>
            <span className="text-sm text-rose-400">-{formatCurrency(result.iraDeduction)}</span>
          </div>
        )}
        {result.iraDeduction > 0 && (
          <div className="flex justify-between items-center py-1 mb-1">
            <span className="text-xs text-slate-500">FIT / SIT Taxable</span>
            <span className="text-xs text-slate-400">{formatCurrency(result.fitTaxable)}</span>
          </div>
        )}
        {[
          ['Federal Income Tax (FIT)', result.fit],
          ['Social Security (FICA 6.2%)', result.fica],
          ['Medicare (MEDI 1.45%)', result.medi],
          ['AR State Income Tax (SIT)', result.sitAR],
        ].map(([label, val]) => (
          <div key={label} className="flex justify-between items-center py-1">
            <span className="text-sm text-slate-400">{label}</span>
            <span className="text-sm text-rose-400">-{formatCurrency(val)}</span>
          </div>
        ))}
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-700/40">
          <span className="text-sm font-bold text-slate-300">Total Deductions</span>
          <span className="text-sm font-bold text-rose-400">-{formatCurrency(result.totalDeductions)}</span>
        </div>
      </div>

      {/* Net */}
      <div className="px-4 py-4 bg-emerald-950/30">
        <div className="flex justify-between items-center">
          <span className="text-base font-black text-white">Est. Net Pay</span>
          <span className="text-2xl font-black text-emerald-400">{formatCurrency(result.netPay)}</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Effective rate: {result.grossPay > 0 ? ((result.totalDeductions / result.grossPay) * 100).toFixed(1) : 0}% deducted
        </p>
      </div>
    </div>
  );
}

// ── Jobs Tab ─────────────────────────────────────────────────────────────────

function JobCard({ job, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const otRate = job.otRate || (job.hourlyRate * 1.5);

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 relative">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <Briefcase size={18} className="text-indigo-400" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white text-base">{job.name}</p>
            <p className="text-sm text-slate-400">
              {formatCurrency(job.hourlyRate)}/hr · OT {formatCurrency(otRate)}/hr
            </p>
          </div>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)}
          className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700/60 rounded-lg transition-colors flex-shrink-0">
          <MoreVertical size={16} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <span className="text-xs bg-slate-700/60 text-slate-400 border border-slate-600/40 px-2.5 py-1 rounded-lg">
          {job.normalShiftHours}h shift
        </span>
        <span className="text-xs bg-slate-700/60 text-slate-400 border border-slate-600/40 px-2.5 py-1 rounded-lg capitalize">
          {job.payFrequency}
        </span>
        <span className="text-xs bg-slate-700/60 text-slate-400 border border-slate-600/40 px-2.5 py-1 rounded-lg">
          {job.filingStatus === 'mfj' ? 'Married' : 'Single'}
        </span>
        {job.iraPerPeriod > 0 && (
          <span className="text-xs bg-amber-900/30 text-amber-400 border border-amber-800/30 px-2.5 py-1 rounded-lg">
            IRA {formatCurrency(job.iraPerPeriod)}/period
          </span>
        )}
      </div>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-3 top-12 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden min-w-[140px]">
            <button onClick={() => { onEdit(job); setMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
              <Pencil size={14} /> Edit
            </button>
            <button onClick={() => { onDelete(job.id); setMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-rose-400 hover:bg-slate-700 transition-colors">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Hours Tab ────────────────────────────────────────────────────────────────

function HoursTab({ jobs, shifts, addShift, updateShift, deleteShift }) {
  const [logDate, setLogDate] = useState(today());
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [editShift, setEditShift] = useState(null);

  // Shifts sorted newest first
  const recentShifts = useMemo(() => {
    return [...shifts]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30);
  }, [shifts]);

  const shiftsOnDate = shifts.filter((s) => s.date === logDate);

  function navDay(n) {
    setLogDate(addDays(logDate, n));
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-20 px-6 text-slate-500">
        <Briefcase size={44} className="mx-auto mb-3 opacity-25" />
        <p className="text-base font-medium text-slate-400">No jobs yet</p>
        <p className="text-sm mt-1">Add a job first from the Jobs tab</p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-2">
      {/* Date nav */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navDay(-1)}
          className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <input
          type="date"
          value={logDate}
          onChange={(e) => setLogDate(e.target.value)}
          className="flex-1 text-center bg-transparent text-white font-semibold text-base focus:outline-none"
        />
        <button onClick={() => navDay(1)}
          className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Today's shifts */}
      {shiftsOnDate.length > 0 ? (
        <div className="space-y-2 mb-4">
          {shiftsOnDate.map((sh) => {
            const job = jobs.find((j) => j.id === sh.jobId);
            return (
              <div key={sh.id} className="bg-indigo-950/30 border border-indigo-800/30 rounded-xl p-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-white">{job?.name || 'Unknown'}</p>
                  <p className="text-xs text-slate-400">{sh.hoursWorked}h logged{sh.notes ? ` · ${sh.notes}` : ''}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditShift(sh)}
                    className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700/60 rounded-lg transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteShift(sh.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-700/60 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-800/30 border border-dashed border-slate-700/50 rounded-xl p-4 mb-4 text-center">
          <p className="text-sm text-slate-500">No shift logged for this date</p>
        </div>
      )}

      <button
        onClick={() => setShowShiftForm(true)}
        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={18} /> Log Shift
      </button>

      {/* Recent shift history */}
      {recentShifts.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Recent Shifts</p>
          <div className="space-y-2">
            {recentShifts.map((sh) => {
              const job = jobs.find((j) => j.id === sh.jobId);
              return (
                <div key={sh.id} className="bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{fmt(sh.date)}</p>
                      {jobs.length > 1 && (
                        <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">{job?.name}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {sh.hoursWorked}h{sh.notes ? ` · ${sh.notes}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditShift(sh)}
                      className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700/60 rounded-lg transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => deleteShift(sh.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-700/60 rounded-lg transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showShiftForm && (
        <Modal title="Log Shift" onClose={() => setShowShiftForm(false)}>
          <ShiftForm
            initial={{ date: logDate }}
            jobs={jobs}
            onSave={(data) => { addShift(data); setShowShiftForm(false); }}
            onCancel={() => setShowShiftForm(false)}
          />
        </Modal>
      )}
      {editShift && (
        <Modal title="Edit Shift" onClose={() => setEditShift(null)}>
          <ShiftForm
            initial={editShift}
            jobs={jobs}
            onSave={(data) => { updateShift(editShift.id, data); setEditShift(null); }}
            onCancel={() => setEditShift(null)}
          />
        </Modal>
      )}
    </div>
  );
}

// ── Estimate Tab ─────────────────────────────────────────────────────────────

const PERIOD_PRESETS = [
  { label: 'Last 7 days', key: '7d' },
  { label: 'Last 14 days', key: '14d' },
  { label: 'This Week', key: 'thisWeek' },
  { label: 'Custom', key: 'custom' },
];

function getPresetRange(key) {
  if (key === '7d') return getLastNDaysEnd(7);
  if (key === '14d') return getLastNDaysEnd(14);
  if (key === 'thisWeek') {
    const now = new Date();
    const dow = now.getDay();
    const mon = new Date(now);
    mon.setDate(now.getDate() - ((dow + 6) % 7));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return {
      start: mon.toISOString().slice(0, 10),
      end: sun.toISOString().slice(0, 10),
    };
  }
  return getLastNDaysEnd(14);
}

function EstimateTab({ jobs, shifts, addIncome }) {
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id || '');
  const [preset, setPreset] = useState('14d');
  const [range, setRange] = useState(() => getLastNDaysEnd(14));
  const [saved, setSaved] = useState(false);

  const job = jobs.find((j) => j.id === selectedJobId);

  const periodShifts = useMemo(() => {
    return shifts.filter(
      (s) => s.jobId === selectedJobId && s.date >= range.start && s.date <= range.end
    );
  }, [shifts, selectedJobId, range]);

  const { regularHours, overtimeHours } = useMemo(
    () => (periodShifts.length > 0 ? calcHoursFromShifts(periodShifts, job || {}) : { regularHours: 0, overtimeHours: 0 }),
    [periodShifts, job]
  );

  const result = useMemo(() => {
    if (!job || (regularHours === 0 && overtimeHours === 0)) return null;
    return calcPaycheck({ job, regularHours, overtimeHours });
  }, [job, regularHours, overtimeHours]);

  function handlePreset(key) {
    setPreset(key);
    if (key !== 'custom') setRange(getPresetRange(key));
    setSaved(false);
  }

  function handleSaveAsIncome() {
    if (!result || !job) return;
    const mk = monthKey(new Date(range.end + 'T12:00:00'));
    addIncome({
      source: `${job.name} — Paycheck Est.`,
      amount: result.netPay,
      frequency: 'monthly',
      isRecurring: false,
      month: mk,
      person: 'me',
      notes: `${periodLabel(range.start, range.end)} · Gross ${formatCurrency(result.grossPay)}`,
      isWorkTimeEntry: true,
      jobId: job.id,
      grossPay: result.grossPay,
      payPeriodStart: range.start,
      payPeriodEnd: range.end,
    });
    setSaved(true);
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-20 px-6 text-slate-500">
        <Calculator size={44} className="mx-auto mb-3 opacity-25" />
        <p className="text-base font-medium text-slate-400">No jobs yet</p>
        <p className="text-sm mt-1">Add a job from the Jobs tab to estimate your paycheck</p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-2">
      {/* Job selector */}
      {jobs.length > 1 && (
        <div className="mb-4">
          <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block">Job</label>
          <div className="flex gap-2 flex-wrap">
            {jobs.map((j) => (
              <button
                key={j.id}
                onClick={() => { setSelectedJobId(j.id); setSaved(false); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedJobId === j.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {j.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Period selector */}
      <div className="mb-4">
        <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block">Pay Period</label>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {PERIOD_PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => handlePreset(p.key)}
              className={`py-2 rounded-xl text-sm font-medium transition-colors ${
                preset === p.key
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Start</label>
              <input
                type="date"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                value={range.start}
                onChange={(e) => { setRange((r) => ({ ...r, start: e.target.value })); setSaved(false); }}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">End</label>
              <input
                type="date"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                value={range.end}
                onChange={(e) => { setRange((r) => ({ ...r, end: e.target.value })); setSaved(false); }}
              />
            </div>
          </div>
        )}

        <p className="text-xs text-slate-500 mt-2 text-center">{periodLabel(range.start, range.end)}</p>
      </div>

      {/* Hours summary */}
      {periodShifts.length > 0 ? (
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-3 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-slate-400">Shifts logged</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {regularHours}h regular{overtimeHours > 0 ? ` + ${overtimeHours}h OT` : ''} · {periodShifts.length} days
              </p>
            </div>
            <p className="text-2xl font-black text-white">{regularHours + overtimeHours}h</p>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/30 border border-dashed border-slate-700/40 rounded-xl p-4 mb-4 text-center">
          <Clock size={28} className="mx-auto mb-2 text-slate-600" />
          <p className="text-sm text-slate-500">No shifts logged for this period</p>
          <p className="text-xs text-slate-600 mt-1">Log hours in the Hours tab first</p>
        </div>
      )}

      {/* Pay breakdown */}
      {result ? (
        <>
          <PayBreakdown result={result} />

          <div className="mt-4 p-3 bg-slate-800/30 border border-slate-700/30 rounded-xl">
            <p className="text-xs text-slate-500 leading-relaxed">
              <Info size={11} className="inline mr-1 opacity-60" />
              Estimates use 2025 IRS Pub 15-T (federal) and AR DFA withholding tables.
              Actual amounts depend on your W-4 and employer elections.
            </p>
          </div>

          {saved ? (
            <div className="mt-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-900/30 border border-emerald-800/40 text-emerald-400 font-semibold text-sm">
              <Check size={16} /> Saved to Income
            </div>
          ) : (
            <button
              onClick={handleSaveAsIncome}
              className="mt-4 w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Save size={18} /> Add to Income ({monthKey(new Date(range.end + 'T12:00:00'))})
            </button>
          )}
        </>
      ) : null}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'jobs', label: 'Jobs', Icon: Briefcase },
  { key: 'hours', label: 'Hours', Icon: Clock },
  { key: 'estimate', label: 'Estimate', Icon: Calculator },
];

export default function WorkTime() {
  const { jobs, addJob, updateJob, deleteJob, shifts, addShift, updateShift, deleteShift, addIncome } = useApp();
  const [tab, setTab] = useState('jobs');
  const [showJobForm, setShowJobForm] = useState(false);
  const [editJob, setEditJob] = useState(null);

  return (
    <div className="pb-36">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-black text-white tracking-tight mb-4">Work Time</h1>

        {/* Tabs */}
        <div className="flex bg-slate-800/60 rounded-2xl p-1 gap-1">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                tab === key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab === 'jobs' && (
        <div className="px-4 space-y-3">
          {jobs.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <Briefcase size={48} className="mx-auto mb-3 opacity-25" />
              <p className="text-base font-medium text-slate-400">No jobs added yet</p>
              <p className="text-sm mt-1">Add a job to start tracking your hours and pay</p>
              <button
                onClick={() => setShowJobForm(true)}
                className="mt-5 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors inline-flex items-center gap-2"
              >
                <Plus size={18} /> Add First Job
              </button>
            </div>
          ) : (
            <>
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} onEdit={setEditJob} onDelete={deleteJob} />
              ))}
              <button
                onClick={() => setShowJobForm(true)}
                className="w-full py-3 rounded-xl border border-dashed border-slate-600/60 text-slate-400 hover:text-white hover:border-slate-500 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Plus size={16} /> Add Another Job
              </button>
            </>
          )}
        </div>
      )}

      {tab === 'hours' && (
        <HoursTab
          jobs={jobs}
          shifts={shifts}
          addShift={addShift}
          updateShift={updateShift}
          deleteShift={deleteShift}
        />
      )}

      {tab === 'estimate' && (
        <EstimateTab
          jobs={jobs}
          shifts={shifts}
          addIncome={addIncome}
        />
      )}

      {showJobForm && (
        <Modal title="Add Job" onClose={() => setShowJobForm(false)}>
          <JobForm
            onSave={(data) => { addJob(data); setShowJobForm(false); }}
            onCancel={() => setShowJobForm(false)}
          />
        </Modal>
      )}
      {editJob && (
        <Modal title="Edit Job" onClose={() => setEditJob(null)}>
          <JobForm
            initial={editJob}
            onSave={(data) => { updateJob(editJob.id, data); setEditJob(null); }}
            onCancel={() => setEditJob(null)}
          />
        </Modal>
      )}
    </div>
  );
}

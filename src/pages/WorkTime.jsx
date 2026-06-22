import { useState, useMemo } from 'react';
import {
  Briefcase, Clock, ChevronLeft, ChevronRight, Plus, Pencil, Trash2,
  MoreVertical, Check, Calculator, Save, Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, monthKey } from '../utils/helpers';
import { calcPaycheck, calcHoursFromShifts } from '../utils/taxCalc';
import Modal from '../components/Modal';

// ── helpers ──────────────────────────────────────────────────────────────────

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
  return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
}

function getLastNDaysEnd(n) {
  const end = today();
  const start = addDays(end, -(n - 1));
  return { start, end };
}

function getThisWeekRange() {
  const now = new Date();
  const dow = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((dow + 6) % 7));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { start: mon.toISOString().slice(0, 10), end: sun.toISOString().slice(0, 10) };
}

// ── Shared styled wrappers ────────────────────────────────────────────────────

function Label({ children }) {
  return <label className="app-label">{children}</label>;
}

function Input(props) {
  return <input {...props} className="app-input" />;
}

function Select({ children, ...props }) {
  return (
    <select {...props} className="app-input">
      {children}
    </select>
  );
}

// ── Job Form ─────────────────────────────────────────────────────────────────

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
  const autoOT = form.hourlyRate ? (parseFloat(form.hourlyRate) * 1.5).toFixed(2) : '';

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
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <Label>Job Name *</Label>
        <Input placeholder="e.g. Amazon, Walmart, Side Gig" value={form.name}
          onChange={(e) => set('name', e.target.value)} required />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <Label>Hourly Rate *</Label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: '1rem' }}>$</span>
            <Input type="number" min="0" step="0.01" placeholder="18.50" value={form.hourlyRate}
              onChange={(e) => set('hourlyRate', e.target.value)} required
              style={{ paddingLeft: '1.75rem' }} />
          </div>
        </div>
        <div>
          <Label>Shift Hours</Label>
          <Input type="number" min="1" max="24" step="0.5" placeholder="8" value={form.normalShiftHours}
            onChange={(e) => set('normalShiftHours', e.target.value)} />
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
          <Label>OT Rate</Label>
          <button type="button" onClick={() => set('otRateAuto', !form.otRateAuto)}
            style={{ fontSize: '0.75rem', color: 'var(--accent-text)', background: 'none', border: 'none', cursor: 'pointer' }}>
            {form.otRateAuto ? `Auto (1.5× = $${autoOT || '—'})` : 'Use auto 1.5×'}
          </button>
        </div>
        {!form.otRateAuto ? (
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>$</span>
            <Input type="number" min="0" step="0.01" placeholder={autoOT || '27.75'} value={form.otRate}
              onChange={(e) => set('otRate', e.target.value)} style={{ paddingLeft: '1.75rem' }} />
          </div>
        ) : (
          <div className="app-input" style={{ color: 'var(--subtle)', cursor: 'default' }}>
            {autoOT ? `$${autoOT}/hr (auto)` : 'Enter hourly rate above'}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <Label>Pay Frequency</Label>
          <Select value={form.payFrequency} onChange={(e) => set('payFrequency', e.target.value)}>
            <option value="biweekly">Biweekly</option>
            <option value="weekly">Weekly</option>
          </Select>
        </div>
        <div>
          <Label>Filing Status</Label>
          <Select value={form.filingStatus} onChange={(e) => set('filingStatus', e.target.value)}>
            <option value="single">Single</option>
            <option value="mfj">Married (Joint)</option>
          </Select>
        </div>
      </div>

      <div>
        <Label>IRA / 401k per paycheck (optional)</Label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>$</span>
          <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.iraPerPeriod}
            onChange={(e) => set('iraPerPeriod', e.target.value)} style={{ paddingLeft: '1.75rem' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', paddingTop: '0.5rem' }}>
        <button type="button" onClick={onCancel} className="app-btn-secondary">Cancel</button>
        <button type="submit" className="app-btn-primary">Save Job</button>
      </div>
    </form>
  );
}

// ── Shift Form ────────────────────────────────────────────────────────────────

function ShiftForm({ initial = {}, jobs, onSave, onCancel }) {
  const [form, setForm] = useState({
    date: today(),
    jobId: jobs[0]?.id || '',
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
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <Label>Date</Label>
        <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required />
      </div>

      {jobs.length > 1 && (
        <div>
          <Label>Job</Label>
          <Select value={form.jobId} onChange={(e) => set('jobId', e.target.value)}>
            {jobs.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
          </Select>
        </div>
      )}

      <div>
        <Label>
          Hours Worked
          {selectedJob && <span style={{ color: 'var(--subtle)', marginLeft: '0.25rem', fontSize: '0.75rem' }}>(normal: {selectedJob.normalShiftHours}h)</span>}
        </Label>
        <Input type="number" min="0" max="24" step="0.25" placeholder="8.0" value={form.hoursWorked}
          onChange={(e) => set('hoursWorked', e.target.value)} required autoFocus
          style={{ fontSize: '1.5rem', textAlign: 'center', fontWeight: '700' }} />
      </div>

      <div>
        <Label>Notes (optional)</Label>
        <Input placeholder="e.g. Covered a shift, short day" value={form.notes}
          onChange={(e) => set('notes', e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', paddingTop: '0.5rem' }}>
        <button type="button" onClick={onCancel} className="app-btn-secondary">Cancel</button>
        <button type="submit" className="app-btn-primary">Log Shift</button>
      </div>
    </form>
  );
}

// ── Pay Breakdown ─────────────────────────────────────────────────────────────

function PayRow({ label, value, color, size = 'sm', prefix = '' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.3rem 0' }}>
      <span style={{ fontSize: size === 'sm' ? '0.875rem' : '1rem', color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontSize: size === 'sm' ? '0.875rem' : '1rem', fontWeight: size === 'lg' ? '800' : '600', color: color || 'var(--text)' }}>
        {prefix}{formatCurrency(value)}
      </span>
    </div>
  );
}

function PayBreakdown({ result }) {
  const effRate = result.grossPay > 0 ? ((result.totalDeductions / result.grossPay) * 100).toFixed(1) : 0;
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '1rem', overflow: 'hidden' }}>
      {/* Earnings */}
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--subtle)', marginBottom: '0.5rem' }}>Earnings</p>
        <PayRow label={`Regular (${result.regularHours}h)`} value={result.regularPay} />
        {result.overtimeHours > 0 && (
          <PayRow label={`Overtime (${result.overtimeHours}h)`} value={result.otPay} color="var(--warn)" />
        )}
        <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
          <PayRow label="Gross Pay" value={result.grossPay} size="lg" />
        </div>
      </div>

      {/* Deductions */}
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--subtle)', marginBottom: '0.5rem' }}>Deductions</p>
        {result.iraDeduction > 0 && (
          <PayRow label="IRA / 401k (pre-tax)" value={result.iraDeduction} color="var(--danger)" prefix="-" />
        )}
        {result.iraDeduction > 0 && (
          <div style={{ padding: '0.25rem 0' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--subtle)' }}>FIT/SIT taxable: {formatCurrency(result.fitTaxable)}</span>
          </div>
        )}
        <PayRow label="Federal Income Tax (FIT)" value={result.fit} color="var(--danger)" prefix="-" />
        <PayRow label="Social Security (FICA 6.2%)" value={result.fica} color="var(--danger)" prefix="-" />
        <PayRow label="Medicare (MEDI 1.45%)" value={result.medi} color="var(--danger)" prefix="-" />
        <PayRow label="AR State Income Tax (SIT)" value={result.sitAR} color="var(--danger)" prefix="-" />
        <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
          <PayRow label="Total Deductions" value={result.totalDeductions} color="var(--danger)" prefix="-" />
        </div>
      </div>

      {/* Net */}
      <div style={{ padding: '1rem', backgroundColor: 'var(--positive-soft)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text)' }}>Est. Net Pay</span>
          <span style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--positive-text)' }}>{formatCurrency(result.netPay)}</span>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
          {effRate}% effective deduction rate
        </p>
      </div>
    </div>
  );
}

// ── Job Card ──────────────────────────────────────────────────────────────────

function JobCard({ job, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const otRate = job.otRate || job.hourlyRate * 1.5;

  return (
    <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1rem', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', backgroundColor: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Briefcase size={18} style={{ color: 'var(--accent-text)' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: '700', color: 'var(--text)', fontSize: '1rem' }}>{job.name}</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: '0.125rem' }}>
            {formatCurrency(job.hourlyRate)}/hr · OT {formatCurrency(otRate)}/hr
          </p>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)}
          style={{ color: 'var(--subtle)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', marginTop: '-0.125rem', flexShrink: 0 }}>
          <MoreVertical size={18} />
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
        {[
          `${job.normalShiftHours}h shift`,
          job.payFrequency.charAt(0).toUpperCase() + job.payFrequency.slice(1),
          job.filingStatus === 'mfj' ? 'Married (Joint)' : 'Single',
          job.iraPerPeriod > 0 ? `IRA ${formatCurrency(job.iraPerPeriod)}/pay` : null,
        ].filter(Boolean).map((t) => (
          <span key={t} style={{ fontSize: '0.75rem', backgroundColor: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)', padding: '0.25rem 0.625rem', borderRadius: '0.5rem' }}>
            {t}
          </span>
        ))}
      </div>

      {menuOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setMenuOpen(false)} />
          <div style={{ position: 'absolute', right: '0.75rem', top: '3rem', zIndex: 50, backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', overflow: 'hidden', minWidth: '9rem', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <button onClick={() => { onEdit(job); setMenuOpen(false); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.875rem 1rem', fontSize: '0.875rem', color: 'var(--text)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <Pencil size={14} /> Edit
            </button>
            <button onClick={() => { onDelete(job.id); setMenuOpen(false); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.875rem 1rem', fontSize: '0.875rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Hours Tab ─────────────────────────────────────────────────────────────────

function HoursTab({ jobs, shifts, addShift, updateShift, deleteShift }) {
  const [logDate, setLogDate] = useState(today());
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [editShift, setEditShift] = useState(null);

  const recentShifts = useMemo(() =>
    [...shifts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30),
    [shifts]);

  const shiftsOnDate = shifts.filter((s) => s.date === logDate);

  if (jobs.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 1.5rem', color: 'var(--muted)' }}>
        <Briefcase size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.3, display: 'block' }} />
        <p style={{ fontWeight: '600', color: 'var(--muted)', marginBottom: '0.25rem' }}>No jobs yet</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--subtle)' }}>Add a job from the Jobs tab first</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 1rem' }}>
      {/* Date nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <button onClick={() => setLogDate(addDays(logDate, -1))}
          style={{ padding: '0.5rem', borderRadius: '0.75rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <ChevronLeft size={20} />
        </button>
        <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)}
          style={{ flex: 1, textAlign: 'center', background: 'none', border: 'none', color: 'var(--text)', fontWeight: '700', fontSize: '1rem', outline: 'none', cursor: 'pointer' }} />
        <button onClick={() => setLogDate(addDays(logDate, 1))}
          style={{ padding: '0.5rem', borderRadius: '0.75rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Shifts on this date */}
      {shiftsOnDate.map((sh) => {
        const job = jobs.find((j) => j.id === sh.jobId);
        return (
          <div key={sh.id} style={{ backgroundColor: 'var(--accent-soft)', border: '1px solid var(--border)', borderRadius: '0.875rem', padding: '0.875rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontWeight: '600', color: 'var(--text)', fontSize: '0.9375rem' }}>{job?.name || 'Unknown'}</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: '0.125rem' }}>{sh.hoursWorked}h logged{sh.notes ? ` · ${sh.notes}` : ''}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button onClick={() => setEditShift(sh)} style={{ padding: '0.375rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '0.5rem' }}><Pencil size={15} /></button>
              <button onClick={() => deleteShift(sh.id)} style={{ padding: '0.375rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '0.5rem' }}><Trash2 size={15} /></button>
            </div>
          </div>
        );
      })}

      {shiftsOnDate.length === 0 && (
        <div style={{ backgroundColor: 'var(--surface2)', border: '1px dashed var(--border)', borderRadius: '0.875rem', padding: '1rem', textAlign: 'center', marginBottom: '0.75rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--subtle)' }}>No shift logged for this date</p>
        </div>
      )}

      <button onClick={() => setShowShiftForm(true)} className="app-btn-primary" style={{ marginBottom: '1.5rem' }}>
        <Plus size={18} /> Log Shift
      </button>

      {/* Recent shifts */}
      {recentShifts.length > 0 && (
        <div>
          <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--subtle)', marginBottom: '0.75rem', padding: '0 0.25rem' }}>Recent Shifts</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentShifts.map((sh) => {
              const job = jobs.find((j) => j.id === sh.jobId);
              return (
                <div key={sh.id} style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.875rem', padding: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <p style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text)' }}>{fmt(sh.date)}</p>
                      {jobs.length > 1 && <span style={{ fontSize: '0.6875rem', backgroundColor: 'var(--surface2)', color: 'var(--muted)', padding: '0.125rem 0.5rem', borderRadius: '0.375rem' }}>{job?.name}</span>}
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--subtle)', marginTop: '0.125rem' }}>{sh.hoursWorked}h{sh.notes ? ` · ${sh.notes}` : ''}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => setEditShift(sh)} style={{ padding: '0.375rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}><Pencil size={14} /></button>
                    <button onClick={() => deleteShift(sh.id)} style={{ padding: '0.375rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showShiftForm && (
        <Modal title="Log Shift" onClose={() => setShowShiftForm(false)}>
          <ShiftForm initial={{ date: logDate }} jobs={jobs}
            onSave={(d) => { addShift(d); setShowShiftForm(false); }}
            onCancel={() => setShowShiftForm(false)} />
        </Modal>
      )}
      {editShift && (
        <Modal title="Edit Shift" onClose={() => setEditShift(null)}>
          <ShiftForm initial={editShift} jobs={jobs}
            onSave={(d) => { updateShift(editShift.id, d); setEditShift(null); }}
            onCancel={() => setEditShift(null)} />
        </Modal>
      )}
    </div>
  );
}

// ── Estimate Tab ──────────────────────────────────────────────────────────────

const PRESETS = [
  { label: 'Last 7 days', key: '7d' },
  { label: 'Last 14 days', key: '14d' },
  { label: 'This Week', key: 'week' },
  { label: 'Custom', key: 'custom' },
];

function EstimateTab({ jobs, shifts, addIncome }) {
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id || '');
  const [preset, setPreset] = useState('14d');
  const [range, setRange] = useState(() => getLastNDaysEnd(14));
  const [saved, setSaved] = useState(false);

  const job = jobs.find((j) => j.id === selectedJobId);

  const periodShifts = useMemo(() =>
    shifts.filter((s) => s.jobId === selectedJobId && s.date >= range.start && s.date <= range.end),
    [shifts, selectedJobId, range]);

  const { regularHours, overtimeHours } = useMemo(() =>
    periodShifts.length > 0 ? calcHoursFromShifts(periodShifts, job || {}) : { regularHours: 0, overtimeHours: 0 },
    [periodShifts, job]);

  const result = useMemo(() => {
    if (!job || (regularHours === 0 && overtimeHours === 0)) return null;
    return calcPaycheck({ job, regularHours, overtimeHours });
  }, [job, regularHours, overtimeHours]);

  function handlePreset(key) {
    setPreset(key);
    setSaved(false);
    if (key === '7d') setRange(getLastNDaysEnd(7));
    else if (key === '14d') setRange(getLastNDaysEnd(14));
    else if (key === 'week') setRange(getThisWeekRange());
  }

  function handleSave() {
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
      <div style={{ textAlign: 'center', padding: '5rem 1.5rem', color: 'var(--muted)' }}>
        <Calculator size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.3, display: 'block' }} />
        <p style={{ fontWeight: '600', color: 'var(--muted)', marginBottom: '0.25rem' }}>No jobs yet</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--subtle)' }}>Add a job from the Jobs tab to estimate your paycheck</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 1rem' }}>
      {/* Job selector */}
      {jobs.length > 1 && (
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--subtle)', marginBottom: '0.5rem' }}>Job</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {jobs.map((j) => (
              <button key={j.id} onClick={() => { setSelectedJobId(j.id); setSaved(false); }}
                style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: '600', border: 'none', cursor: 'pointer',
                  backgroundColor: selectedJobId === j.id ? 'var(--accent)' : 'var(--surface2)',
                  color: selectedJobId === j.id ? '#fff' : 'var(--muted)' }}>
                {j.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Period */}
      <div style={{ marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--subtle)', marginBottom: '0.5rem' }}>Pay Period</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {PRESETS.map((p) => (
            <button key={p.key} onClick={() => handlePreset(p.key)}
              style={{ padding: '0.625rem', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: '600', border: `1px solid ${preset === p.key ? 'var(--accent)' : 'var(--border)'}`,
                backgroundColor: preset === p.key ? 'var(--accent-soft)' : 'var(--surface2)',
                color: preset === p.key ? 'var(--accent-text)' : 'var(--muted)', cursor: 'pointer' }}>
              {p.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div>
              <Label>Start</Label>
              <Input type="date" value={range.start} onChange={(e) => { setRange((r) => ({ ...r, start: e.target.value })); setSaved(false); }} />
            </div>
            <div>
              <Label>End</Label>
              <Input type="date" value={range.end} onChange={(e) => { setRange((r) => ({ ...r, end: e.target.value })); setSaved(false); }} />
            </div>
          </div>
        )}
        <p style={{ fontSize: '0.8125rem', color: 'var(--subtle)', textAlign: 'center' }}>{periodLabel(range.start, range.end)}</p>
      </div>

      {/* Hours summary */}
      {periodShifts.length > 0 ? (
        <div style={{ backgroundColor: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '0.875rem', padding: '0.875rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Shifts logged</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--subtle)', marginTop: '0.125rem' }}>
              {regularHours}h regular{overtimeHours > 0 ? ` + ${overtimeHours}h OT` : ''} · {periodShifts.length} days
            </p>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--text)' }}>{regularHours + overtimeHours}h</p>
        </div>
      ) : (
        <div style={{ border: '1px dashed var(--border)', borderRadius: '0.875rem', padding: '1.5rem', textAlign: 'center', marginBottom: '1rem' }}>
          <Clock size={28} style={{ margin: '0 auto 0.5rem', color: 'var(--subtle)', display: 'block' }} />
          <p style={{ fontSize: '0.875rem', color: 'var(--subtle)' }}>No shifts for this period — log hours first</p>
        </div>
      )}

      {/* Breakdown */}
      {result && (
        <>
          <PayBreakdown result={result} />
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--surface2)', borderRadius: '0.75rem', marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--subtle)', lineHeight: '1.4' }}>
              <Info size={11} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle', opacity: 0.6 }} />
              Estimates use 2025 IRS Pub 15-T and AR DFA withholding tables. Actual amounts depend on your W-4.
            </p>
          </div>

          {saved ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem', borderRadius: '0.875rem', backgroundColor: 'var(--positive-soft)', color: 'var(--positive-text)', fontWeight: '700' }}>
              <Check size={16} /> Saved to Income
            </div>
          ) : (
            <button onClick={handleSave} className="app-btn-primary"
              style={{ backgroundColor: 'var(--positive)', marginTop: '0' }}>
              <Save size={18} /> Save to Income
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── Page tabs ─────────────────────────────────────────────────────────────────

const TABS = ['jobs', 'hours', 'estimate'];
const TAB_LABELS = { jobs: 'Jobs', hours: 'Hours', estimate: 'Estimate' };

function SegmentedControl({ value, onChange, options }) {
  return (
    <div style={{ display: 'flex', backgroundColor: 'var(--surface2)', borderRadius: '0.875rem', padding: '0.25rem', gap: '0.25rem' }}>
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)}
          style={{
            flex: 1, padding: '0.625rem 0', borderRadius: '0.625rem', fontSize: '0.9375rem', fontWeight: '700',
            border: 'none', cursor: 'pointer', transition: 'all 0.15s',
            backgroundColor: value === o ? 'var(--surface)' : 'transparent',
            color: value === o ? 'var(--text)' : 'var(--subtle)',
            boxShadow: value === o ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
          }}>
          {TAB_LABELS[o]}
        </button>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function WorkTime() {
  const { jobs, addJob, updateJob, deleteJob, shifts, addShift, updateShift, deleteShift, addIncome } = useApp();
  const [tab, setTab] = useState('jobs');
  const [showJobForm, setShowJobForm] = useState(false);
  const [editJob, setEditJob] = useState(null);

  return (
    <div className="app-page">
      <div className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.625rem', fontWeight: '900', color: 'var(--text)', letterSpacing: '-0.02em' }}>Work Time</h1>
          {tab === 'jobs' && jobs.length > 0 && (
            <button onClick={() => setShowJobForm(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer' }}>
              <Plus size={16} /> Add Job
            </button>
          )}
        </div>
        <SegmentedControl value={tab} onChange={setTab} options={TABS} />
      </div>

      <div style={{ marginTop: '0.25rem' }}>
        {/* Jobs tab */}
        {tab === 'jobs' && (
          <div style={{ padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {jobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <Briefcase size={48} style={{ margin: '0 auto 1rem', opacity: 0.2, color: 'var(--muted)', display: 'block' }} />
                <p style={{ fontWeight: '700', color: 'var(--text)', fontSize: '1.125rem', marginBottom: '0.5rem' }}>No jobs added yet</p>
                <p style={{ fontSize: '0.9375rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>Add a job to start tracking your hours and paycheck</p>
                <button onClick={() => setShowJobForm(true)} className="app-btn-primary"
                  style={{ maxWidth: '14rem', margin: '0 auto' }}>
                  <Plus size={18} /> Add First Job
                </button>
              </div>
            ) : (
              <>
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} onEdit={setEditJob} onDelete={deleteJob} />
                ))}
                <button onClick={() => setShowJobForm(true)}
                  style={{ padding: '0.875rem', border: '1px dashed var(--border)', borderRadius: '0.875rem', color: 'var(--muted)', background: 'none', cursor: 'pointer', fontSize: '0.9375rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Plus size={16} /> Add Another Job
                </button>
              </>
            )}
          </div>
        )}

        {tab === 'hours' && (
          <HoursTab jobs={jobs} shifts={shifts} addShift={addShift} updateShift={updateShift} deleteShift={deleteShift} />
        )}

        {tab === 'estimate' && (
          <EstimateTab jobs={jobs} shifts={shifts} addIncome={addIncome} />
        )}
      </div>

      {showJobForm && (
        <Modal title="Add Job" onClose={() => setShowJobForm(false)}>
          <JobForm onSave={(d) => { addJob(d); setShowJobForm(false); }} onCancel={() => setShowJobForm(false)} />
        </Modal>
      )}
      {editJob && (
        <Modal title="Edit Job" onClose={() => setEditJob(null)}>
          <JobForm initial={editJob} onSave={(d) => { updateJob(editJob.id, d); setEditJob(null); }} onCancel={() => setEditJob(null)} />
        </Modal>
      )}
    </div>
  );
}

import { useState } from 'react';
import { User, Users, Trash2, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';

export default function Settings() {
  const { settings, setSettings, bills, income, debts, savings, commitments } = useApp();
  const [form, setForm] = useState({ ...settings });
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const save = () => { setSettings(form); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const clearAll = () => { localStorage.clear(); window.location.reload(); };

  return (
    <div className="pb-32">
      <div className="px-5 pt-5 pb-6">
        <h1 className="text-3xl font-black text-white tracking-tight mb-6">Settings</h1>

        <section className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <User size={16} className="text-indigo-400" />
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">My Profile</h2>
          </div>
          <label className="text-sm text-slate-400 mb-1.5 block">Your name</label>
          <input className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            placeholder="e.g. Elias" value={form.myName} onChange={(e) => set('myName', e.target.value)} />
        </section>

        <section className="mb-5 bg-slate-800/60 rounded-2xl border border-slate-700/50 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-indigo-400" />
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Spouse / Partner</h2>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${form.spouseEnabled ? 'bg-indigo-500' : 'bg-slate-700'}`} onClick={() => set('spouseEnabled', !form.spouseEnabled)}>
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.spouseEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </div>
          {form.spouseEnabled ? (
            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">Partner's name</label>
              <input className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Alex" value={form.spouseName} onChange={(e) => set('spouseName', e.target.value)} />
              <p className="text-xs text-slate-500 mt-2">Their income will be tracked separately and shown in the income summary.</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Enable to track a spouse or partner's income and bills separately.</p>
          )}
        </section>

        <button onClick={save} className={`w-full py-4 rounded-2xl font-bold text-base transition-all mb-5 ${
          saved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
        }`}>
          {saved ? 'Saved!' : 'Save Settings'}
        </button>

        <section className="mb-5 bg-slate-800/60 rounded-2xl border border-slate-700/50 p-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Data</h2>
          <div className="space-y-2 text-sm text-slate-400">
            <p>{bills.length} bill{bills.length !== 1 ? 's' : ''} saved</p>
            <p>{income.length} income source{income.length !== 1 ? 's' : ''} saved</p>
            <p>{debts.length} debt{debts.length !== 1 ? 's' : ''} saved</p>
            <p>{savings.length} savings account{savings.length !== 1 ? 's' : ''}</p>
            <p>{commitments.length} commitment{commitments.length !== 1 ? 's' : ''}</p>
          </div>
        </section>

        <section className="bg-rose-950/30 border border-rose-900/50 rounded-2xl p-4">
          <h2 className="text-xs font-semibold text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <AlertTriangle size={13} /> Danger Zone
          </h2>
          <p className="text-xs text-slate-500 mb-3">Permanently delete all data. This cannot be undone.</p>
          <button onClick={() => setShowClearConfirm(true)} className="flex items-center gap-2 text-sm text-rose-400 border border-rose-800/50 px-4 py-2.5 rounded-xl hover:bg-rose-900/30 transition-colors">
            <Trash2 size={14} /> Clear All Data
          </button>
        </section>
      </div>

      {showClearConfirm && (
        <Modal title="Clear All Data?" onClose={() => setShowClearConfirm(false)}>
          <p className="text-slate-400 text-sm mb-6">This will permanently delete all your bills, income, and budget data. There is no way to recover it.</p>
          <div className="flex gap-3">
            <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">Cancel</button>
            <button onClick={clearAll} className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors">Delete Everything</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Trash2, AlertTriangle, Wallet, PiggyBank, DollarSign, Sun, Moon, LogOut, Mail, Download, Share2, RefreshCw, Copy, Check, X, Bell, BellOff, Lock, FolderOpen, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { formatCurrency, exportAllData, exportAsHTML } from '../utils/helpers';
import { notificationPermission, sendNotification } from '../utils/notifications';

const ALL_EXPORT_CATS = [
  { key: 'bills', label: 'Bills' },
  { key: 'income', label: 'Income' },
  { key: 'debts', label: 'Debts' },
  { key: 'savings', label: 'Savings' },
  { key: 'commitments', label: 'Commitments' },
  { key: 'planned', label: 'Goals' },
  { key: 'agreements', label: 'Deals' },
  { key: 'projects', label: 'Projects' },
  { key: 'purchases', label: 'Spending' },
  { key: 'budget', label: 'Budget' },
  { key: 'lists', label: 'Shopping Lists' },
];

function NotifRow({ label, sublabel, checked, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text)' }}>{label}</p>
        {sublabel && <p style={{ fontSize: '0.75rem', color: 'var(--subtle)' }}>{sublabel}</p>}
      </div>
      <button onClick={() => onChange(!checked)} style={{ width: '2.75rem', height: '1.625rem', borderRadius: '9999px', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s', backgroundColor: checked ? 'var(--accent)' : 'var(--surface2)', position: 'relative', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: '2px', left: checked ? 'calc(100% - 1.25rem)' : '2px', width: '1.25rem', height: '1.25rem', borderRadius: '9999px', backgroundColor: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
      </button>
    </div>
  );
}

export default function Settings() {
  const { settings, setSettings, bills, income, debts, savings, commitments, plannedExpenses, agreements, projects, purchases, budgetCategories, budgetSpends, shoppingLists, shoppingItems, generateShareLink, revokeShareLink, refreshShareLink, notifPrefs, persistNotifPrefs, fcmToken, enablePushNotifications } = useApp();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...settings });
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exportCats, setExportCats] = useState(() => ALL_EXPORT_CATS.map((c) => c.key));
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareError, setShareError] = useState('');
  const [pinEditMode, setPinEditMode] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [notifPermission, setNotifPermission] = useState(() => notificationPermission());
  const [notifEnabling, setNotifEnabling] = useState(false);

  const updatePref = (category, key, value) =>
    persistNotifPrefs({ ...notifPrefs, [category]: { ...(notifPrefs[category] || {}), [key]: value } });

  const toggleCat = (key) => setExportCats((prev) =>
    prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
  );

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const save = () => { setSettings(form); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const clearAll = () => { localStorage.clear(); window.location.reload(); };

  const sectionLabelStyle = { color: 'var(--muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' };
  const cardStyle = { backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1rem' };

  return (
    <div style={{ paddingBottom: '7rem', backgroundColor: 'var(--bg)', minHeight: '100svh' }}>
      <div className="px-4 pt-5 pb-6">
        <h1 className="text-2xl font-black tracking-tight mb-6" style={{ color: 'var(--text)' }}>Settings</h1>

        {/* Appearance */}
        <section className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Sun size={15} style={{ color: 'var(--accent-text)' }} />
            <span style={sectionLabelStyle}>Appearance</span>
          </div>
          <div style={cardStyle}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {form.lightMode ? <Sun size={18} style={{ color: 'var(--warn)' }} /> : <Moon size={18} style={{ color: 'var(--accent-text)' }} />}
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{form.lightMode ? 'Light Mode' : 'Dark Mode'}</p>
                  <p className="text-xs" style={{ color: 'var(--subtle)' }}>Toggle display theme</p>
                </div>
              </div>
              <button
                onClick={() => set('lightMode', !form.lightMode)}
                style={{
                  width: '3rem',
                  height: '1.75rem',
                  borderRadius: '9999px',
                  backgroundColor: form.lightMode ? 'var(--accent)' : 'var(--surface2)',
                  border: '1px solid var(--border)',
                  position: 'relative',
                  transition: 'background-color 0.2s',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  left: form.lightMode ? 'calc(100% - 1.375rem)' : '2px',
                  width: '1.25rem',
                  height: '1.25rem',
                  borderRadius: '9999px',
                  backgroundColor: '#fff',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </button>
            </div>
            <p className="text-xs mt-3" style={{ color: 'var(--subtle)' }}>
              Note: tap Save Settings below to apply theme change.
            </p>
          </div>
        </section>

        {/* Profile */}
        <section className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <User size={15} style={{ color: 'var(--accent-text)' }} />
            <span style={sectionLabelStyle}>Profiles</span>
          </div>
          <div style={cardStyle} className="space-y-3">
            <div>
              <label className="app-label">Primary user name</label>
              <input className="app-input" placeholder="e.g. Aaron" value={form.myName} onChange={(e) => set('myName', e.target.value)} />
            </div>
            <div>
              <label className="app-label">Partner name</label>
              <input className="app-input" placeholder="e.g. Cameron" value={form.spouseName} onChange={(e) => set('spouseName', e.target.value)} />
            </div>
          </div>
        </section>

        {/* Spending & Savings */}
        <section className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={15} style={{ color: 'var(--positive-text)' }} />
            <span style={sectionLabelStyle}>Monthly Budget Targets</span>
          </div>
          <div style={cardStyle} className="space-y-4">
            <div>
              <label className="app-label flex items-center gap-1.5">
                <Wallet size={13} /> Spending money budget
              </label>
              <p className="text-xs mb-2" style={{ color: 'var(--subtle)' }}>How much of your available funds you plan to spend each month</p>
              <input type="number" min="0" step="1" className="app-input" placeholder="0"
                value={form.monthlySpendingBudget || ''}
                onChange={(e) => set('monthlySpendingBudget', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="app-label flex items-center gap-1.5">
                <PiggyBank size={13} /> Savings target
              </label>
              <p className="text-xs mb-2" style={{ color: 'var(--subtle)' }}>Amount you aim to move to savings each month</p>
              <input type="number" min="0" step="1" className="app-input" placeholder="0"
                value={form.monthlySavingsTarget || ''}
                onChange={(e) => set('monthlySavingsTarget', parseFloat(e.target.value) || 0)} />
            </div>
            {(form.monthlySpendingBudget > 0 || form.monthlySavingsTarget > 0) && (
              <div style={{ backgroundColor: 'var(--surface2)', borderRadius: '0.75rem', padding: '0.75rem' }} className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--muted)' }}>Spending budget</span>
                  <span style={{ color: 'var(--accent-text)' }} className="font-semibold">{formatCurrency(form.monthlySpendingBudget || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--muted)' }}>Savings target</span>
                  <span style={{ color: 'var(--positive-text)' }} className="font-semibold">{formatCurrency(form.monthlySavingsTarget || 0)}</span>
                </div>
                <div className="flex justify-between pt-1.5" style={{ borderTop: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--muted)' }}>Total allocated</span>
                  <span style={{ color: 'var(--text)' }} className="font-semibold">{formatCurrency((form.monthlySpendingBudget || 0) + (form.monthlySavingsTarget || 0))}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        <button
          onClick={save}
          className="app-btn-primary mb-4"
          style={saved ? { backgroundColor: 'var(--positive)' } : {}}
        >
          {saved ? 'Saved!' : 'Save Settings'}
        </button>

        {/* Data summary */}
        <section className="mb-4" style={cardStyle}>
          <p className="mb-3" style={sectionLabelStyle}>Data Summary</p>
          <div className="grid grid-cols-2 gap-2 text-sm" style={{ color: 'var(--muted)' }}>
            <p>{bills.length} bill{bills.length !== 1 ? 's' : ''}</p>
            <p>{income.length} income source{income.length !== 1 ? 's' : ''}</p>
            <p>{debts.length} debt{debts.length !== 1 ? 's' : ''}</p>
            <p>{savings.length} savings account{savings.length !== 1 ? 's' : ''}</p>
            <p>{commitments.length} commitment{commitments.length !== 1 ? 's' : ''}</p>
            <p>{purchases.length} purchase{purchases.length !== 1 ? 's' : ''}</p>
          </div>
        </section>

        {/* Account */}
        <section className="mb-4" style={cardStyle}>
          <p className="mb-3" style={sectionLabelStyle}>Account</p>
          <div className="flex items-center gap-3 mb-3">
            <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.75rem', backgroundColor: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Mail size={16} style={{ color: 'var(--accent-text)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Email</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{user?.email || '—'}</p>
            </div>
          </div>
          <button onClick={signOut}
            className="flex items-center gap-2 text-sm font-semibold"
            style={{ color: 'var(--muted)', border: '1px solid var(--border)', padding: '0.625rem 1rem', borderRadius: '0.75rem', backgroundColor: 'transparent', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
            <LogOut size={15} /> Sign Out
          </button>
        </section>

        {/* Share Link */}
        <section className="mb-4" style={cardStyle}>
          <div className="flex items-center gap-2 mb-1">
            <Share2 size={15} style={{ color: 'var(--accent-text)' }} />
            <span style={sectionLabelStyle}>Shared View Link</span>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
            Generate a read-only link to share your family finances. Your partner can view bills, income, spending, debts, and savings without needing an account.
          </p>
          {settings.shareToken ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <div style={{ backgroundColor: 'var(--surface2)', borderRadius: '0.75rem', padding: '0.625rem 0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--subtle)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {`${window.location.origin}/ExpenseTracker/share/${settings.shareToken}`}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/ExpenseTracker/share/${settings.shareToken}`).then(() => {
                      setShareCopied(true); setTimeout(() => setShareCopied(false), 2000);
                    });
                  }}
                  style={{ flexShrink: 0, padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: shareCopied ? 'var(--positive-text)' : 'var(--accent-text)' }}>
                  {shareCopied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={async () => {
                    setShareLoading(true); setShareError('');
                    const res = await refreshShareLink();
                    setShareLoading(false);
                    if (res && !res.ok) setShareError(res.error);
                  }}
                  disabled={shareLoading}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', padding: '0.625rem', borderRadius: '0.75rem', border: '1px solid var(--border)', backgroundColor: 'var(--surface2)', color: 'var(--muted)', fontSize: '0.8125rem', fontWeight: '600', cursor: 'pointer' }}>
                  <RefreshCw size={13} className={shareLoading ? 'animate-spin' : ''} />
                  {shareLoading ? 'Refreshing…' : 'Refresh Data'}
                </button>
                <button
                  onClick={() => { if (window.confirm('Revoke this share link? Anyone with the link will lose access.')) revokeShareLink(); }}
                  style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.625rem', borderRadius: '0.75rem', border: '1px solid var(--danger)', backgroundColor: 'transparent', color: 'var(--danger)', fontSize: '0.8125rem', fontWeight: '600', cursor: 'pointer' }}>
                  <X size={13} /> Revoke
                </button>
              </div>
              {shareError && (
                <div style={{ backgroundColor: 'rgba(244,63,94,0.08)', border: '1px solid var(--danger)', borderRadius: '0.75rem', padding: '0.75rem', fontSize: '0.8125rem', color: 'var(--danger)' }}>
                  <p style={{ fontWeight: '700', marginBottom: '0.25rem' }}>Firestore rules not deployed</p>
                  <p style={{ color: 'var(--muted)', marginBottom: '0.5rem' }}>Go to Firebase Console → Firestore → Rules and paste:</p>
                  <pre style={{ fontSize: '0.7rem', backgroundColor: 'var(--surface2)', padding: '0.5rem', borderRadius: '0.5rem', overflowX: 'auto', color: 'var(--text)', margin: 0 }}>{`match /shared/{token} {\n  allow read: if true;\n  allow write: if request.auth != null;\n}`}</pre>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <button
                onClick={async () => {
                  setShareLoading(true); setShareError('');
                  const res = await generateShareLink();
                  setShareLoading(false);
                  if (res && !res.ok) setShareError(res.error);
                }}
                disabled={shareLoading}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1rem', borderRadius: '0.75rem', border: 'none', backgroundColor: 'var(--accent)', color: '#fff', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer' }}>
                <Share2 size={14} />
                {shareLoading ? 'Generating…' : 'Generate Share Link'}
              </button>
              {shareError && (
                <div style={{ backgroundColor: 'rgba(244,63,94,0.08)', border: '1px solid var(--danger)', borderRadius: '0.75rem', padding: '0.75rem', fontSize: '0.8125rem', color: 'var(--danger)' }}>
                  <p style={{ fontWeight: '700', marginBottom: '0.25rem' }}>Firestore rules not deployed</p>
                  <p style={{ color: 'var(--muted)', marginBottom: '0.5rem' }}>Go to Firebase Console → Firestore Database → Rules tab and paste this rule inside the existing rules block:</p>
                  <pre style={{ fontSize: '0.7rem', backgroundColor: 'var(--surface2)', padding: '0.5rem', borderRadius: '0.5rem', overflowX: 'auto', color: 'var(--text)', margin: 0 }}>{`match /shared/{token} {\n  allow read: if true;\n  allow write: if request.auth != null;\n}`}</pre>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Share Link PIN */}
        <section className="mb-4" style={cardStyle}>
          <div className="flex items-center gap-2 mb-1">
            <Lock size={15} style={{ color: 'var(--accent-text)' }} />
            <span style={sectionLabelStyle}>Share View PIN</span>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
            Anyone opening the shared link must enter this PIN. Save it to their device so they only enter it once.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
            {pinEditMode ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={4}
                  value={pinInput}
                  autoFocus
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="0000"
                  style={{ width: '5.5rem', textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.125rem', fontWeight: 800, padding: '0.5rem 0.625rem', backgroundColor: 'var(--surface2)', border: '1.5px solid var(--accent)', borderRadius: '0.625rem', color: 'var(--text)', outline: 'none' }}
                />
                <button
                  onClick={() => {
                    if (pinInput.length === 4) {
                      setSettings({ ...settings, sharePin: pinInput });
                      setPinEditMode(false);
                    }
                  }}
                  disabled={pinInput.length !== 4}
                  style={{ padding: '0.5rem 0.875rem', backgroundColor: pinInput.length === 4 ? 'var(--accent)' : 'var(--surface2)', color: pinInput.length === 4 ? '#fff' : 'var(--muted)', border: 'none', borderRadius: '0.625rem', fontSize: '0.875rem', fontWeight: 700, cursor: pinInput.length === 4 ? 'pointer' : 'default' }}>
                  Save
                </button>
                <button onClick={() => setPinEditMode(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '0.25rem', display: 'flex' }}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem', letterSpacing: '0.2em', color: 'var(--text)', fontWeight: 700, lineHeight: 1 }}>{'●'.repeat(settings.sharePin?.length || 4)}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>({(settings.sharePin?.length || 4)}-digit PIN)</span>
                </div>
                <button
                  onClick={() => { setPinInput(settings.sharePin || '3419'); setPinEditMode(true); }}
                  style={{ padding: '0.5rem 0.875rem', backgroundColor: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '0.625rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}>
                  Change PIN
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Document Vault */}
        <section className="mb-4" style={cardStyle}>
          <div className="flex items-center gap-2 mb-1">
            <FolderOpen size={15} style={{ color: 'var(--accent-text)' }} />
            <span style={sectionLabelStyle}>Document Vault</span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '0.875rem' }}>View all uploaded receipts, W-2s, and paystubs in one place.</p>
          <button onClick={() => navigate('/vault')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '0.875rem', cursor: 'pointer', color: 'var(--text)', fontSize: '0.875rem', fontWeight: 600 }}>
            <span>Open Document Vault</span>
            <ChevronRight size={16} style={{ color: 'var(--subtle)' }} />
          </button>
        </section>

        {/* Notifications */}
        <section className="mb-4" style={cardStyle}>
          <div className="flex items-center gap-2 mb-3">
            <Bell size={15} style={{ color: 'var(--accent-text)' }} />
            <span style={sectionLabelStyle}>Notifications</span>
          </div>

          {notifPermission === 'denied' ? (
            <div style={{ backgroundColor: 'var(--surface2)', borderRadius: '0.75rem', padding: '0.75rem' }}>
              <div className="flex items-center gap-2 mb-1">
                <BellOff size={15} style={{ color: 'var(--danger)' }} />
                <p style={{ fontSize: '0.875rem', color: 'var(--danger)', fontWeight: 600 }}>Notifications blocked</p>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>Open your browser or device settings and allow notifications for this site, then reload.</p>
            </div>
          ) : notifPermission !== 'granted' ? (
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
                Get alerted for overdue bills, expiring commitments, to-do deadlines, and daily work log reminders — even when the app is in the background.
              </p>
              <button
                onClick={async () => {
                  setNotifEnabling(true);
                  try {
                    const res = await enablePushNotifications();
                    if (!res.ok && res.reason === 'denied') return;
                  } catch (e) {
                    console.warn('enablePushNotifications error:', e);
                  } finally {
                    setNotifEnabling(false);
                    setNotifPermission(notificationPermission());
                  }
                }}
                disabled={notifEnabling}
                className="app-btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={14} />
                {notifEnabling ? 'Requesting…' : 'Enable Notifications'}
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Check size={14} style={{ color: 'var(--positive-text)' }} />
                <p style={{ fontSize: '0.8125rem', color: 'var(--positive-text)', fontWeight: 600 }}>
                  {fcmToken ? 'Push notifications active' : 'In-app notifications active'}
                </p>
              </div>
              {!fcmToken && (
                <p style={{ fontSize: '0.75rem', color: 'var(--subtle)', marginBottom: '0.75rem', backgroundColor: 'var(--surface2)', padding: '0.625rem', borderRadius: '0.625rem' }}>
                  Background push (when app is closed) requires a VAPID key — see VITE_FCM_VAPID_KEY in the project README. In-app alerts work now.
                </p>
              )}

              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-text)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem', marginTop: '0.5rem' }}>Bills</p>
              <NotifRow label="Same-day reminder (8 AM)" sublabel="Notification at 8 AM on the day a bill is due" checked={!!notifPrefs.bills?.sameDay} onChange={(v) => updatePref('bills', 'sameDay', v)} />
              <NotifRow label="Overdue bill alert" sublabel="Fires immediately when a bill is past due" checked={!!notifPrefs.bills?.overdue} onChange={(v) => updatePref('bills', 'overdue', v)} />
              <NotifRow label="1-day payment reminder" sublabel="Fires the day before a bill is due" checked={!!notifPrefs.bills?.dayBefore} onChange={(v) => updatePref('bills', 'dayBefore', v)} />
              <div style={{ paddingTop: '0.75rem' }}>
                <button
                  onClick={() => sendNotification('Bill Due Today: Rent', { body: '$1,200.00 due today — this is a test', tag: 'test-notif-' + Date.now() })}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent-text)', backgroundColor: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: '0.625rem', padding: '0.5rem 0.875rem', cursor: 'pointer' }}>
                  <Bell size={13} /> Send test notification
                </button>
              </div>

              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-text)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem', marginTop: '1rem' }}>Commitments</p>
              <NotifRow label="Expiring commitment alert" checked={!!notifPrefs.commitments?.expiring} onChange={(v) => updatePref('commitments', 'expiring', v)} />
              {notifPrefs.commitments?.expiring && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0 0.25rem 0.25rem' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>Notify</span>
                  <select value={notifPrefs.commitments?.daysBefore ?? 3} onChange={(e) => updatePref('commitments', 'daysBefore', Number(e.target.value))}
                    style={{ backgroundColor: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.25rem 0.5rem', color: 'var(--text)', fontSize: '0.875rem' }}>
                    {[1, 2, 3, 5, 7, 14].map((d) => <option key={d} value={d}>{d} day{d !== 1 ? 's' : ''}</option>)}
                  </select>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>before expiry</span>
                </div>
              )}

              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-text)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem', marginTop: '1rem' }}>To-Do Lists</p>
              <NotifRow label="Item due time reminders" sublabel="Uses the time set on each to-do item" checked={!!notifPrefs.todos?.enabled} onChange={(v) => updatePref('todos', 'enabled', v)} />
              <NotifRow label="Morning reminder" sublabel="Push at set time if you have incomplete to-dos" checked={notifPrefs.todos?.morningEnabled !== false} onChange={(v) => updatePref('todos', 'morningEnabled', v)} />
              {notifPrefs.todos?.morningEnabled !== false && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0 0 0.25rem' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>Time</span>
                  <input type="time" value={notifPrefs.todos?.morningTime || '08:00'} onChange={(e) => updatePref('todos', 'morningTime', e.target.value)}
                    style={{ backgroundColor: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.25rem 0.5rem', color: 'var(--text)', fontSize: '0.875rem' }} />
                </div>
              )}
              <NotifRow label="Afternoon reminder" sublabel="Push at set time if you have incomplete to-dos" checked={notifPrefs.todos?.afternoonEnabled !== false} onChange={(v) => updatePref('todos', 'afternoonEnabled', v)} />
              {notifPrefs.todos?.afternoonEnabled !== false && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0 0 0.25rem' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>Time</span>
                  <input type="time" value={notifPrefs.todos?.afternoonTime || '16:00'} onChange={(e) => updatePref('todos', 'afternoonTime', e.target.value)}
                    style={{ backgroundColor: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.25rem 0.5rem', color: 'var(--text)', fontSize: '0.875rem' }} />
                </div>
              )}

              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-text)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem', marginTop: '1rem' }}>Work</p>
              <NotifRow label="Daily hours log reminder" sublabel="Reminds you to log your work hours" checked={!!notifPrefs.shifts?.reminder} onChange={(v) => updatePref('shifts', 'reminder', v)} />
              {notifPrefs.shifts?.reminder && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0 0 0.25rem' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>Remind me at</span>
                  <input type="time" value={notifPrefs.shifts?.reminderTime || '18:00'} onChange={(e) => updatePref('shifts', 'reminderTime', e.target.value)}
                    style={{ backgroundColor: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.25rem 0.5rem', color: 'var(--text)', fontSize: '0.875rem' }} />
                </div>
              )}
            </div>
          )}
        </section>

        {/* Export */}
        <section className="mb-4" style={cardStyle}>
          <p className="mb-1" style={sectionLabelStyle}>Export Data</p>
          <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>Choose which sections to include, then export as a printable HTML report or CSV files.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            {ALL_EXPORT_CATS.map(({ key, label }) => {
              const on = exportCats.includes(key);
              return (
                <button key={key} onClick={() => toggleCat(key)}
                  style={{ padding: '0.375rem 0.75rem', borderRadius: '0.625rem', fontSize: '0.8125rem', fontWeight: 700, border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`, cursor: 'pointer', transition: 'all 0.15s',
                    backgroundColor: on ? 'var(--accent-soft)' : 'var(--surface2)',
                    color: on ? 'var(--accent-text)' : 'var(--muted)' }}>
                  {on ? '✓ ' : ''}{label}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <button
              onClick={() => exportAsHTML({ bills, income, debts, savings, purchases, commitments, plannedExpenses, agreements, projects, budgetCategories, budgetSpends, shoppingLists, shoppingItems, settings, include: exportCats })}
              className="flex items-center gap-2 text-sm font-semibold"
              style={{ color: '#fff', border: 'none', padding: '0.625rem 1rem', borderRadius: '0.75rem', backgroundColor: 'var(--accent)', cursor: 'pointer' }}>
              <Download size={14} /> Export to HTML (Printable)
            </button>
            <button
              onClick={() => exportAllData({ bills, income, debts, savings, purchases })}
              className="flex items-center gap-2 text-sm font-semibold"
              style={{ color: 'var(--accent-text)', border: '1px solid var(--accent)', padding: '0.625rem 1rem', borderRadius: '0.75rem', backgroundColor: 'transparent', cursor: 'pointer' }}>
              <Download size={14} /> Export to CSV
            </button>
          </div>
        </section>

        {/* Danger zone */}
        <section style={{ backgroundColor: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: '1rem', padding: '1rem', opacity: 0.85 }}>
          <p className="mb-3 flex items-center gap-2" style={{ ...sectionLabelStyle, color: 'var(--danger)' }}>
            <AlertTriangle size={13} /> Danger Zone
          </p>
          <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>Permanently delete all data. This cannot be undone.</p>
          <button onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-2 text-sm"
            style={{ color: 'var(--danger)', border: '1px solid var(--danger)', padding: '0.625rem 1rem', borderRadius: '0.75rem', backgroundColor: 'transparent', cursor: 'pointer' }}>
            <Trash2 size={14} /> Clear All Data
          </button>
        </section>
      </div>

      {showClearConfirm && (
        <Modal title="Clear All Data?" onClose={() => setShowClearConfirm(false)}>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>This will permanently delete all your bills, income, debts, savings, purchases, and settings. This cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setShowClearConfirm(false)} className="app-btn-secondary flex-1">Cancel</button>
            <button onClick={clearAll} className="flex-1 py-3 rounded-xl font-semibold text-white" style={{ backgroundColor: 'var(--danger)' }}>Delete Everything</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../firebase';
import { loadSharedView } from '../utils/firestoreSync';
import { formatCurrency, monthKey, getBillStatus } from '../utils/helpers';
import { TrendingUp, Receipt, ShoppingBag, CreditCard, PiggyBank, CheckSquare, Square, Clock, AlertTriangle } from 'lucide-react';

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f0f10' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', border: '3px solid #333', borderTopColor: '#6366f1', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        <p style={{ color: '#666', fontSize: '0.875rem', marginTop: '1rem' }}>Loading shared view…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function SectionTitle({ icon: Icon, title, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
      <Icon size={16} style={{ color: color || '#6366f1' }} />
      <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888', fontWeight: '700' }}>{title}</p>
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ backgroundColor: '#1a1a1f', border: '1px solid #2a2a35', borderRadius: '1rem', padding: '1rem', ...style }}>
      {children}
    </div>
  );
}

function ReadOnlyDashboard({ data }) {
  const mk = monthKey(new Date());
  const { settings = {}, bills = [], income = [], purchases = [], debts = [], savings = [], commitments = [] } = data;
  const { myName = 'Me', spouseName = 'Partner' } = settings;

  // Bills
  const monthBills = bills.filter((b) => {
    if (!b.startMonth || b.startMonth <= mk) {
      if (!b.endMonth || b.endMonth >= mk) return true;
    }
    return false;
  });
  const billsPaid = monthBills.filter((b) => getBillStatus(b, mk) === 'paid');
  const billsUnpaid = monthBills.filter((b) => getBillStatus(b, mk) !== 'paid');
  const totalBills = monthBills.reduce((s, b) => s + (b.amount || 0), 0);

  // Income
  const totalMonthlyIncome = income.reduce((s, i) => {
    const mult = i.frequency === 'weekly' ? 4.33 : i.frequency === 'biweekly' ? 2.17 : 1;
    return s + (i.amount || 0) * mult;
  }, 0);

  // Spending this month
  const monthPurchases = purchases.filter((p) => p.date && p.date.startsWith(mk));
  const totalSpending = monthPurchases.reduce((s, p) => s + (p.amount || 0), 0);
  const spendingByPerson = { me: 0, other: 0 };
  monthPurchases.forEach((p) => {
    if (p.person === 'me' || p.person === 'aaron') spendingByPerson.me += p.amount;
    else spendingByPerson.other += p.amount;
  });

  // Debts
  const totalDebt = debts.reduce((s, d) => s + (d.balance || 0), 0);

  // Savings
  const totalSavings = savings.reduce((s, sv) => s + (sv.balance || 0), 0);

  const sharedAt = data.updatedAt ? new Date(data.updatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : null;

  return (
    <div style={{ minHeight: '100svh', backgroundColor: '#0f0f10', paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#1a1a1f', borderBottom: '1px solid #2a2a35', padding: '1rem' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src="/ExpenseTracker/app-icon.jpeg" alt="icon" style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem', objectFit: 'cover' }} />
            <div>
              <p style={{ fontSize: '1rem', fontWeight: '900', color: '#f4f4f5' }}>Family Finance View</p>
              <p style={{ fontSize: '0.75rem', color: '#666' }}>
                Shared by {myName}{sharedAt ? ` · Updated ${sharedAt}` : ''}
              </p>
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '0.625rem', padding: '0.5rem 0.75rem' }}>
            <p style={{ fontSize: '0.75rem', color: '#f59e0b' }}>Read-only snapshot — data is not live</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Income + Bills summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Card>
            <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: '0.25rem' }}>Monthly Income</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '900', color: '#10b981' }}>{formatCurrency(totalMonthlyIncome)}</p>
            <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>{income.length} source{income.length !== 1 ? 's' : ''}</p>
          </Card>
          <Card>
            <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: '0.25rem' }}>Bills This Month</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '900', color: '#f4f4f5' }}>{formatCurrency(totalBills)}</p>
            <p style={{ fontSize: '0.75rem', color: billsUnpaid.length > 0 ? '#f59e0b' : '#10b981', marginTop: '0.25rem' }}>
              {billsPaid.length}/{monthBills.length} paid
            </p>
          </Card>
        </div>

        {/* Spending this month */}
        <Card>
          <SectionTitle icon={ShoppingBag} title="Spending This Month" />
          <p style={{ fontSize: '2rem', fontWeight: '900', color: '#f4f4f5', marginBottom: '0.5rem' }}>{formatCurrency(totalSpending)}</p>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#888', marginBottom: '0.75rem' }}>
            <span>{myName}: <span style={{ color: '#a5b4fc', fontWeight: '600' }}>{formatCurrency(spendingByPerson.me)}</span></span>
            <span>{spouseName}: <span style={{ color: '#a5b4fc', fontWeight: '600' }}>{formatCurrency(spendingByPerson.other)}</span></span>
          </div>
          {monthPurchases.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {[...monthPurchases].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6).map((p, i) => (
                <div key={p.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderTop: i > 0 ? '1px solid #2a2a35' : 'none' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#f4f4f5' }}>{p.merchant}</p>
                    <p style={{ fontSize: '0.7rem', color: '#666' }}>{formatDateShort(p.date)} · {p.person === 'me' || p.person === 'aaron' ? myName : spouseName}</p>
                  </div>
                  <p style={{ fontSize: '0.9375rem', fontWeight: '700', color: '#f4f4f5' }}>{formatCurrency(p.amount)}</p>
                </div>
              ))}
              {monthPurchases.length > 6 && (
                <p style={{ fontSize: '0.75rem', color: '#666', paddingTop: '0.5rem', textAlign: 'center' }}>+ {monthPurchases.length - 6} more purchases</p>
              )}
            </div>
          )}
        </Card>

        {/* Bills */}
        {monthBills.length > 0 && (
          <Card>
            <SectionTitle icon={Receipt} title="Bills" color="#6366f1" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {monthBills.map((b, i) => {
                const paid = getBillStatus(b, mk) === 'paid';
                return (
                  <div key={b.id || i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderTop: i > 0 ? '1px solid #2a2a35' : 'none' }}>
                    {paid ? <CheckSquare size={16} style={{ color: '#10b981', flexShrink: 0 }} /> : <Square size={16} style={{ color: '#666', flexShrink: 0 }} />}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: '600', color: paid ? '#888' : '#f4f4f5' }}>{b.name}</p>
                      {b.dueDay && <p style={{ fontSize: '0.7rem', color: '#666' }}>Due day {b.dueDay}</p>}
                    </div>
                    <p style={{ fontSize: '0.9375rem', fontWeight: '700', color: paid ? '#666' : '#f4f4f5' }}>{formatCurrency(b.amount)}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Debts */}
        {debts.length > 0 && (
          <Card>
            <SectionTitle icon={CreditCard} title="Debts" color="#f43f5e" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {debts.map((d, i) => (
                <div key={d.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderTop: i > 0 ? '1px solid #2a2a35' : 'none' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#f4f4f5' }}>{d.name}</p>
                    {d.interestRate > 0 && <p style={{ fontSize: '0.7rem', color: '#666' }}>{d.interestRate}% APR</p>}
                  </div>
                  <p style={{ fontSize: '0.9375rem', fontWeight: '700', color: '#f43f5e' }}>{formatCurrency(d.balance)}</p>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #2a2a35', marginTop: '0.375rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#888' }}>Total</span>
                <span style={{ fontSize: '0.9375rem', fontWeight: '900', color: '#f43f5e' }}>{formatCurrency(totalDebt)}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Savings */}
        {savings.length > 0 && (
          <Card>
            <SectionTitle icon={PiggyBank} title="Savings" color="#10b981" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {savings.map((sv, i) => {
                const pct = sv.goal ? Math.min(100, (sv.balance / sv.goal) * 100) : null;
                return (
                  <div key={sv.id || i} style={{ padding: '0.5rem 0', borderTop: i > 0 ? '1px solid #2a2a35' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: pct !== null ? '0.375rem' : 0 }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#f4f4f5' }}>{sv.name}</p>
                      <p style={{ fontSize: '0.9375rem', fontWeight: '700', color: '#10b981' }}>{formatCurrency(sv.balance)}</p>
                    </div>
                    {pct !== null && (
                      <>
                        <div style={{ height: '0.375rem', backgroundColor: '#2a2a35', borderRadius: '9999px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, backgroundColor: '#10b981', borderRadius: '9999px' }} />
                        </div>
                        <p style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>{pct.toFixed(0)}% of {formatCurrency(sv.goal)} goal</p>
                      </>
                    )}
                  </div>
                );
              })}
              <div style={{ borderTop: '1px solid #2a2a35', marginTop: '0.375rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#888' }}>Total</span>
                <span style={{ fontSize: '0.9375rem', fontWeight: '900', color: '#10b981' }}>{formatCurrency(totalSavings)}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Active commitments */}
        {commitments.length > 0 && (
          <Card>
            <SectionTitle icon={Clock} title="Active Commitments" color="#a78bfa" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {commitments.slice(0, 5).map((c, i) => (
                <div key={c.id || i} style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0', borderTop: i > 0 ? '1px solid #2a2a35' : 'none' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#a78bfa', marginTop: '0.4rem', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#f4f4f5' }}>{c.title || c.text}</p>
                    {c.notes && <p style={{ fontSize: '0.75rem', color: '#666' }}>{c.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function SharedView() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
        const d = await loadSharedView(token);
        if (!d) {
          setError('not_found');
        } else {
          setData(d);
        }
      } catch (err) {
        if (err.code === 'permission-denied' || err.code === 'PERMISSION_DENIED') {
          setError('permission_denied');
        } else {
          setError(err.message || 'unknown_error');
        }
      }
      setLoading(false);
    }
    load();
  }, [token]);

  if (loading) return <LoadingScreen />;

  if (error === 'not_found') {
    return (
      <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f0f10', padding: '1rem' }}>
        <div style={{ maxWidth: '360px', textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔗</p>
          <p style={{ fontSize: '1.125rem', fontWeight: '700', color: '#f4f4f5', marginBottom: '0.5rem' }}>Link not found</p>
          <p style={{ fontSize: '0.9375rem', color: '#888' }}>This shared link has been revoked or does not exist.</p>
        </div>
      </div>
    );
  }

  if (error === 'permission_denied') {
    return (
      <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f0f10', padding: '1rem' }}>
        <div style={{ maxWidth: '420px', backgroundColor: '#1a1a1f', border: '1px solid #2a2a35', borderRadius: '1rem', padding: '1.5rem' }}>
          <AlertTriangle size={24} style={{ color: '#f59e0b', marginBottom: '0.75rem' }} />
          <p style={{ fontSize: '1rem', fontWeight: '700', color: '#f4f4f5', marginBottom: '0.5rem' }}>Firebase rules update needed</p>
          <p style={{ fontSize: '0.875rem', color: '#888', marginBottom: '1rem', lineHeight: '1.5' }}>
            To enable shared links, add this rule to your Firebase Firestore rules:
          </p>
          <pre style={{ backgroundColor: '#0f0f10', border: '1px solid #2a2a35', borderRadius: '0.625rem', padding: '0.875rem', fontSize: '0.75rem', color: '#a5b4fc', overflowX: 'auto', lineHeight: '1.6', marginBottom: '0' }}>
{`match /shared/{token} {
  allow read: if true;
  allow write: if request.auth != null;
}`}
          </pre>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f0f10', padding: '1rem' }}>
        <div style={{ maxWidth: '360px', textAlign: 'center' }}>
          <AlertTriangle size={24} style={{ color: '#f43f5e', margin: '0 auto 0.75rem', display: 'block' }} />
          <p style={{ fontSize: '1rem', fontWeight: '700', color: '#f4f4f5', marginBottom: '0.5rem' }}>Error loading view</p>
          <p style={{ fontSize: '0.875rem', color: '#888' }}>{error}</p>
        </div>
      </div>
    );
  }

  return <ReadOnlyDashboard data={data} />;
}

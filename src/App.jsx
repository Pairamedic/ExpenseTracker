import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import BillsDebts from './pages/BillsDebts';
import Income from './pages/Income';
import Notes from './pages/Notes';
import Settings from './pages/Settings';
import Purchases from './pages/Purchases';
import WorkTime from './pages/WorkTime';
import SearchPage from './pages/Search';
import Login from './pages/Login';

function UpdateBanner() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();
  if (!needRefresh) return null;
  return (
    <div style={{
      position: 'fixed', bottom: '5.5rem', left: '1rem', right: '1rem', zIndex: 200,
      backgroundColor: 'var(--accent)', borderRadius: '1rem', padding: '0.875rem 1rem',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
      boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
    }}>
      <p style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>
        New version available
      </p>
      <button
        onClick={() => updateServiceWorker(true)}
        style={{
          backgroundColor: '#fff', color: 'var(--accent)', borderRadius: '0.625rem',
          padding: '0.375rem 0.875rem', fontSize: '0.8rem', fontWeight: 700,
          border: 'none', cursor: 'pointer', flexShrink: 0,
        }}
      >
        Update now
      </button>
    </div>
  );
}

function ThemeSync() {
  const { settings } = useApp();
  useEffect(() => {
    const html = document.documentElement;
    if (settings.lightMode) {
      html.classList.add('light');
      html.classList.remove('dark');
    } else {
      html.classList.add('dark');
      html.classList.remove('light');
    }
  }, [settings.lightMode]);
  return null;
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'var(--bg)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '2.5rem', height: '2.5rem', borderRadius: '50%',
          border: '3px solid var(--border)', borderTopColor: 'var(--accent)',
          animation: 'spin 0.8s linear infinite', margin: '0 auto',
        }} />
        <p style={{ color: 'var(--subtle)', fontSize: '0.875rem', marginTop: '1rem' }}>Loading…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function AppShell() {
  const { user } = useAuth();

  // undefined = still checking auth state
  if (user === undefined) return <LoadingScreen />;

  // Not logged in — show login screen (no AppProvider needed)
  if (!user) return <Login />;

  // Logged in — render full app with Firestore sync
  return (
    <AppProvider uid={user.uid}>
      <BrowserRouter basename="/ExpenseTracker">
        <ThemeSync />
        <div className="min-h-screen">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/bills" element={<BillsDebts />} />
            <Route path="/debts" element={<Navigate to="/bills" replace />} />
            <Route path="/income" element={<Income />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/work" element={<WorkTime />} />
            <Route path="/search" element={<SearchPage />} />
          </Routes>
        </div>
        <BottomNav />
        <UpdateBanner />
      </BrowserRouter>
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
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
import ShoppingLists from './pages/ShoppingLists';
import Planning from './pages/Planning';
import SharedView from './pages/SharedView';
import Login from './pages/Login';

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

function AuthenticatedApp() {
  const { user } = useAuth();

  if (user === undefined) return <LoadingScreen />;
  if (!user) return <Login />;

  return (
    <AppProvider uid={user.uid}>
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
          <Route path="/lists" element={<ShoppingLists />} />
          <Route path="/planning" element={<Planning />} />
        </Routes>
      </div>
      <BottomNav />
    </AppProvider>
  );
}

function AppShell() {
  return (
    <Routes>
      {/* Public route — accessible without login */}
      <Route path="/share/:token" element={<SharedView />} />
      {/* All other routes require auth */}
      <Route path="*" element={<AuthenticatedApp />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/ExpenseTracker">
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}

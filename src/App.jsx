import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import BillsDebts from './pages/BillsDebts';
import Income from './pages/Income';
import Notes from './pages/Notes';
import Settings from './pages/Settings';
import Purchases from './pages/Purchases';
import WorkTime from './pages/WorkTime';

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

export default function App() {
  return (
    <AppProvider>
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
          </Routes>
        </div>
        <BottomNav />
      </BrowserRouter>
    </AppProvider>
  );
}

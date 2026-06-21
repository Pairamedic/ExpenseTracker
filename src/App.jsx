import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import Bills from './pages/Bills';
import Income from './pages/Income';
import Debts from './pages/Debts';
import Notes from './pages/Notes';
import Settings from './pages/Settings';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter basename="/expensetracker">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/bills" element={<Bills />} />
          <Route path="/income" element={<Income />} />
          <Route path="/debts" element={<Debts />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        <BottomNav />
      </BrowserRouter>
    </AppProvider>
  );
}

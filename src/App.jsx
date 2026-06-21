import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import Bills from './pages/Bills';
import Income from './pages/Income';
import Settings from './pages/Settings';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/bills" element={<Bills />} />
          <Route path="/income" element={<Income />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        <BottomNav />
      </BrowserRouter>
    </AppProvider>
  );
}

import { createContext, useContext, useState, useCallback } from 'react';
import { storage } from '../utils/storage';
import { generateId, currentMonthKey } from '../utils/helpers';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [bills, setBillsState] = useState(() => storage.getBills());
  const [income, setIncomeState] = useState(() => storage.getIncome());
  const [budget, setBudgetState] = useState(() => storage.getBudget());
  const [settings, setSettingsState] = useState(() => storage.getSettings());

  const persistBills = useCallback((next) => {
    setBillsState(next);
    storage.setBills(next);
  }, []);

  const persistIncome = useCallback((next) => {
    setIncomeState(next);
    storage.setIncome(next);
  }, []);

  const persistBudget = useCallback((next) => {
    setBudgetState(next);
    storage.setBudget(next);
  }, []);

  const persistSettings = useCallback((next) => {
    setSettingsState(next);
    storage.setSettings(next);
  }, []);

  const addBill = useCallback((bill) => {
    persistBills([...bills, { ...bill, id: generateId() }]);
  }, [bills, persistBills]);

  const updateBill = useCallback((id, updates) => {
    persistBills(bills.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  }, [bills, persistBills]);

  const deleteBill = useCallback((id) => {
    persistBills(bills.filter((b) => b.id !== id));
  }, [bills, persistBills]);

  const toggleBillPaid = useCallback((id, month) => {
    persistBills(bills.map((b) => {
      if (b.id !== id) return b;
      const paidMonths = b.paidMonths || {};
      const mk = month || currentMonthKey();
      return {
        ...b,
        paidMonths: { ...paidMonths, [mk]: !paidMonths[mk] },
      };
    }));
  }, [bills, persistBills]);

  const addIncome = useCallback((item) => {
    persistIncome([...income, { ...item, id: generateId() }]);
  }, [income, persistIncome]);

  const updateIncome = useCallback((id, updates) => {
    persistIncome(income.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  }, [income, persistIncome]);

  const deleteIncome = useCallback((id) => {
    persistIncome(income.filter((i) => i.id !== id));
  }, [income, persistIncome]);

  const setBudgetForMonth = useCallback((mk, amount) => {
    persistBudget({ ...budget, [mk]: amount });
  }, [budget, persistBudget]);

  return (
    <AppContext.Provider value={{
      bills, addBill, updateBill, deleteBill, toggleBillPaid,
      income, addIncome, updateIncome, deleteIncome,
      budget, setBudgetForMonth,
      settings, setSettings: persistSettings,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

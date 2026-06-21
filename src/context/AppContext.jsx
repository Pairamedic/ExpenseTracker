import { createContext, useContext, useState, useCallback } from 'react';
import { storage } from '../utils/storage';
import { generateId, currentMonthKey } from '../utils/helpers';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [bills, setBillsState] = useState(() => storage.getBills());
  const [income, setIncomeState] = useState(() => storage.getIncome());
  const [budget, setBudgetState] = useState(() => storage.getBudget());
  const [settings, setSettingsState] = useState(() => storage.getSettings());
  const [notes, setNotesState] = useState(() => storage.getNotes());
  const [debts, setDebtsState] = useState(() => storage.getDebts());

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

  const persistDebts = useCallback((next) => {
    setDebtsState(next);
    storage.setDebts(next);
  }, []);

  // Bills
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

  // Income
  const addIncome = useCallback((item) => {
    persistIncome([...income, { ...item, id: generateId() }]);
  }, [income, persistIncome]);

  const updateIncome = useCallback((id, updates) => {
    persistIncome(income.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  }, [income, persistIncome]);

  const deleteIncome = useCallback((id) => {
    persistIncome(income.filter((i) => i.id !== id));
  }, [income, persistIncome]);

  // Budget
  const setBudgetForMonth = useCallback((mk, amount) => {
    persistBudget({ ...budget, [mk]: amount });
  }, [budget, persistBudget]);

  // Debts
  const addDebt = useCallback((debt) => {
    persistDebts([...debts, { ...debt, id: generateId() }]);
  }, [debts, persistDebts]);

  const updateDebt = useCallback((id, updates) => {
    persistDebts(debts.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  }, [debts, persistDebts]);

  const deleteDebt = useCallback((id) => {
    persistDebts(debts.filter((d) => d.id !== id));
  }, [debts, persistDebts]);

  const toggleDebtPaid = useCallback((id, month) => {
    persistDebts(debts.map((d) => {
      if (d.id !== id) return d;
      const paidMonths = d.paidMonths || {};
      const mk = month || currentMonthKey();
      return { ...d, paidMonths: { ...paidMonths, [mk]: !paidMonths[mk] } };
    }));
  }, [debts, persistDebts]);

  // Notes
  const persistNotes = useCallback((next) => {
    setNotesState(next);
    storage.setNotes(next);
  }, []);

  const addNote = useCallback((note) => {
    const now = new Date().toISOString();
    persistNotes([{ ...note, id: generateId(), createdAt: now, updatedAt: now }, ...notes]);
  }, [notes, persistNotes]);

  const updateNote = useCallback((id, updates) => {
    persistNotes(notes.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n)));
  }, [notes, persistNotes]);

  const deleteNote = useCallback((id) => {
    persistNotes(notes.filter((n) => n.id !== id));
  }, [notes, persistNotes]);

  const toggleNotePin = useCallback((id) => {
    persistNotes(notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  }, [notes, persistNotes]);

  return (
    <AppContext.Provider value={{
      bills, addBill, updateBill, deleteBill, toggleBillPaid,
      income, addIncome, updateIncome, deleteIncome,
      budget, setBudgetForMonth,
      notes, addNote, updateNote, deleteNote, toggleNotePin,
      debts, addDebt, updateDebt, deleteDebt, toggleDebtPaid,
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

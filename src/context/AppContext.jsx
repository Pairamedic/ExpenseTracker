import { createContext, useContext, useState, useCallback } from 'react';
import { storage } from '../utils/storage';
import { generateId, currentMonthKey, getBillStatus, nextBillStatus } from '../utils/helpers';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [bills, setBillsState] = useState(() => storage.getBills());
  const [income, setIncomeState] = useState(() => storage.getIncome());
  const [budget, setBudgetState] = useState(() => storage.getBudget());
  const [settings, setSettingsState] = useState(() => storage.getSettings());
  const [notes, setNotesState] = useState(() => storage.getNotes());
  const [debts, setDebtsState] = useState(() => storage.getDebts());
  const [savings, setSavingsState] = useState(() => storage.getSavings());
  const [commitments, setCommitmentsState] = useState(() => storage.getCommitments());
  const [purchases, setPurchasesState] = useState(() => storage.getPurchases());
  const [plannedExpenses, setPlannedExpensesState] = useState(() => storage.getPlannedExpenses());

  const persistBills = useCallback((next) => { setBillsState(next); storage.setBills(next); }, []);
  const persistIncome = useCallback((next) => { setIncomeState(next); storage.setIncome(next); }, []);
  const persistBudget = useCallback((next) => { setBudgetState(next); storage.setBudget(next); }, []);
  const persistSettings = useCallback((next) => { setSettingsState(next); storage.setSettings(next); }, []);
  const persistDebts = useCallback((next) => { setDebtsState(next); storage.setDebts(next); }, []);
  const persistSavings = useCallback((next) => { setSavingsState(next); storage.setSavings(next); }, []);
  const persistCommitments = useCallback((next) => { setCommitmentsState(next); storage.setCommitments(next); }, []);
  const persistPurchases = useCallback((next) => { setPurchasesState(next); storage.setPurchases(next); }, []);
  const persistPlannedExpenses = useCallback((next) => { setPlannedExpensesState(next); storage.setPlannedExpenses(next); }, []);

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

  // Cycle unpaid → pending → paid → unpaid
  const toggleBillPaid = useCallback((id, month) => {
    const mk = month || currentMonthKey();
    persistBills(bills.map((b) => {
      if (b.id !== id) return b;
      const current = getBillStatus(b, mk);
      const next = nextBillStatus(current);
      return { ...b, statusMonths: { ...(b.statusMonths || {}), [mk]: next } };
    }));
  }, [bills, persistBills]);

  const setBillStatusDirect = useCallback((id, mk, status) => {
    persistBills(bills.map((b) => {
      if (b.id !== id) return b;
      return { ...b, statusMonths: { ...(b.statusMonths || {}), [mk]: status } };
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

  // Savings
  const addSaving = useCallback((s) => persistSavings([...savings, { ...s, id: generateId() }]), [savings, persistSavings]);
  const updateSaving = useCallback((id, u) => persistSavings(savings.map((s) => s.id === id ? { ...s, ...u } : s)), [savings, persistSavings]);
  const deleteSaving = useCallback((id) => persistSavings(savings.filter((s) => s.id !== id)), [savings, persistSavings]);

  // Commitments
  const addCommitment = useCallback((c) => {
    persistCommitments([...commitments, { ...c, id: generateId(), completed: false, createdAt: new Date().toISOString() }]);
  }, [commitments, persistCommitments]);
  const updateCommitment = useCallback((id, u) => persistCommitments(commitments.map((c) => c.id === id ? { ...c, ...u } : c)), [commitments, persistCommitments]);
  const deleteCommitment = useCallback((id) => persistCommitments(commitments.filter((c) => c.id !== id)), [commitments, persistCommitments]);
  const toggleCommitment = useCallback((id) => persistCommitments(commitments.map((c) => c.id === id ? { ...c, completed: !c.completed } : c)), [commitments, persistCommitments]);

  // Notes
  const persistNotes = useCallback((next) => { setNotesState(next); storage.setNotes(next); }, []);

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

  const toggleNoteDashboardPin = useCallback((id) => {
    persistNotes(notes.map((n) => (n.id === id ? { ...n, pinnedToDashboard: !n.pinnedToDashboard } : n)));
  }, [notes, persistNotes]);

  // Purchases
  const addPurchase = useCallback((p) => {
    persistPurchases([{ ...p, id: generateId(), createdAt: new Date().toISOString() }, ...purchases]);
  }, [purchases, persistPurchases]);

  const updatePurchase = useCallback((id, updates) => {
    persistPurchases(purchases.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  }, [purchases, persistPurchases]);

  const deletePurchase = useCallback((id) => {
    persistPurchases(purchases.filter((p) => p.id !== id));
  }, [purchases, persistPurchases]);

  // Planned Expenses
  const addPlannedExpense = useCallback((pe) => {
    persistPlannedExpenses([...plannedExpenses, { ...pe, id: generateId(), status: 'planned', createdAt: new Date().toISOString() }]);
  }, [plannedExpenses, persistPlannedExpenses]);

  const updatePlannedExpense = useCallback((id, updates) => {
    persistPlannedExpenses(plannedExpenses.map((pe) => (pe.id === id ? { ...pe, ...updates } : pe)));
  }, [plannedExpenses, persistPlannedExpenses]);

  const deletePlannedExpense = useCallback((id) => {
    persistPlannedExpenses(plannedExpenses.filter((pe) => pe.id !== id));
  }, [plannedExpenses, persistPlannedExpenses]);

  return (
    <AppContext.Provider value={{
      bills, addBill, updateBill, deleteBill, toggleBillPaid, setBillStatusDirect,
      income, addIncome, updateIncome, deleteIncome,
      budget, setBudgetForMonth,
      notes, addNote, updateNote, deleteNote, toggleNotePin, toggleNoteDashboardPin,
      debts, addDebt, updateDebt, deleteDebt, toggleDebtPaid,
      savings, addSaving, updateSaving, deleteSaving,
      commitments, addCommitment, updateCommitment, deleteCommitment, toggleCommitment,
      purchases, addPurchase, updatePurchase, deletePurchase,
      plannedExpenses, addPlannedExpense, updatePlannedExpense, deletePlannedExpense,
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

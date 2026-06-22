import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { storage } from '../utils/storage';
import { saveUserData, loadUserData } from '../utils/firestoreSync';
import { generateId, currentMonthKey, getBillStatus, nextBillStatus } from '../utils/helpers';

const AppContext = createContext(null);

// Debounce Firestore writes so rapid changes don't spam the DB
function useDebounce(fn, delay = 1500) {
  const timer = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

export function AppProvider({ children, uid }) {
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
  const [jobs, setJobsState] = useState(() => storage.getJobs());
  const [shifts, setShiftsState] = useState(() => storage.getShifts());
  const [budgetCategories, setBudgetCategoriesState] = useState(() => storage.getBudgetCategories());
  const [budgetSpends, setBudgetSpendsState] = useState(() => storage.getBudgetSpends());
  const [cloudLoaded, setCloudLoaded] = useState(false);

  // Use refs to always have fresh values for the save function
  const stateRef = useRef({});
  stateRef.current = { bills, income, budget, settings, notes, debts, savings, commitments, purchases, plannedExpenses, jobs, shifts, budgetCategories, budgetSpends };

  // Load from Firestore on login
  useEffect(() => {
    if (!uid) return;
    setCloudLoaded(false);
    loadUserData(uid).then((data) => {
      if (data) {
        // Hydrate all state from Firestore (Firestore is source of truth)
        const s = stateRef.current.settings;
        if (data.bills) { setBillsState(data.bills); storage.setBills(data.bills); }
        if (data.income) { setIncomeState(data.income); storage.setIncome(data.income); }
        if (data.budget) { setBudgetState(data.budget); storage.setBudget(data.budget); }
        if (data.settings) { setSettingsState({ ...s, ...data.settings }); storage.setSettings({ ...s, ...data.settings }); }
        if (data.notes) { setNotesState(data.notes); storage.setNotes(data.notes); }
        if (data.debts) { setDebtsState(data.debts); storage.setDebts(data.debts); }
        if (data.savings) { setSavingsState(data.savings); storage.setSavings(data.savings); }
        if (data.commitments) { setCommitmentsState(data.commitments); storage.setCommitments(data.commitments); }
        if (data.purchases) { setPurchasesState(data.purchases); storage.setPurchases(data.purchases); }
        if (data.plannedExpenses) { setPlannedExpensesState(data.plannedExpenses); storage.setPlannedExpenses(data.plannedExpenses); }
        if (data.jobs) { setJobsState(data.jobs); storage.setJobs(data.jobs); }
        if (data.shifts) { setShiftsState(data.shifts); storage.setShifts(data.shifts); }
        if (data.budgetCategories) { setBudgetCategoriesState(data.budgetCategories); storage.setBudgetCategories(data.budgetCategories); }
        if (data.budgetSpends) { setBudgetSpendsState(data.budgetSpends); storage.setBudgetSpends(data.budgetSpends); }
      } else {
        // First login — upload existing localStorage data to Firestore
        saveUserData(uid, stateRef.current);
      }
      setCloudLoaded(true);
    });
  }, [uid]);

  // Save snapshot to Firestore (debounced)
  const syncToCloud = useCallback((patch) => {
    if (!uid) return;
    saveUserData(uid, patch);
  }, [uid]);

  const debouncedSync = useDebounce(syncToCloud);

  // Persist helpers: update state, localStorage, and queue Firestore sync
  const persistBills = useCallback((next) => {
    setBillsState(next); storage.setBills(next);
    debouncedSync({ bills: next });
  }, [debouncedSync]);

  const persistIncome = useCallback((next) => {
    setIncomeState(next); storage.setIncome(next);
    debouncedSync({ income: next });
  }, [debouncedSync]);

  const persistBudget = useCallback((next) => {
    setBudgetState(next); storage.setBudget(next);
    debouncedSync({ budget: next });
  }, [debouncedSync]);

  const persistSettings = useCallback((next) => {
    setSettingsState(next); storage.setSettings(next);
    debouncedSync({ settings: next });
  }, [debouncedSync]);

  const persistDebts = useCallback((next) => {
    setDebtsState(next); storage.setDebts(next);
    debouncedSync({ debts: next });
  }, [debouncedSync]);

  const persistSavings = useCallback((next) => {
    setSavingsState(next); storage.setSavings(next);
    debouncedSync({ savings: next });
  }, [debouncedSync]);

  const persistCommitments = useCallback((next) => {
    setCommitmentsState(next); storage.setCommitments(next);
    debouncedSync({ commitments: next });
  }, [debouncedSync]);

  const persistPurchases = useCallback((next) => {
    setPurchasesState(next); storage.setPurchases(next);
    debouncedSync({ purchases: next });
  }, [debouncedSync]);

  const persistPlannedExpenses = useCallback((next) => {
    setPlannedExpensesState(next); storage.setPlannedExpenses(next);
    debouncedSync({ plannedExpenses: next });
  }, [debouncedSync]);

  const persistNotes = useCallback((next) => {
    setNotesState(next); storage.setNotes(next);
    debouncedSync({ notes: next });
  }, [debouncedSync]);

  const persistJobs = useCallback((next) => {
    setJobsState(next); storage.setJobs(next);
    debouncedSync({ jobs: next });
  }, [debouncedSync]);

  const persistShifts = useCallback((next) => {
    setShiftsState(next); storage.setShifts(next);
    debouncedSync({ shifts: next });
  }, [debouncedSync]);

  const persistBudgetCategories = useCallback((next) => {
    setBudgetCategoriesState(next); storage.setBudgetCategories(next);
    debouncedSync({ budgetCategories: next });
  }, [debouncedSync]);

  const persistBudgetSpends = useCallback((next) => {
    setBudgetSpendsState(next); storage.setBudgetSpends(next);
    debouncedSync({ budgetSpends: next });
  }, [debouncedSync]);

  // ── Bills ──
  const addBill = useCallback((bill) => persistBills([...bills, { ...bill, id: generateId() }]), [bills, persistBills]);
  const updateBill = useCallback((id, u) => persistBills(bills.map((b) => b.id === id ? { ...b, ...u } : b)), [bills, persistBills]);
  const deleteBill = useCallback((id) => persistBills(bills.filter((b) => b.id !== id)), [bills, persistBills]);

  const toggleBillPaid = useCallback((id, month) => {
    const mk = month || currentMonthKey();
    persistBills(bills.map((b) => {
      if (b.id !== id) return b;
      const next = nextBillStatus(getBillStatus(b, mk));
      return { ...b, statusMonths: { ...(b.statusMonths || {}), [mk]: next } };
    }));
  }, [bills, persistBills]);

  const setBillStatusDirect = useCallback((id, mk, status) => {
    persistBills(bills.map((b) => b.id === id ? { ...b, statusMonths: { ...(b.statusMonths || {}), [mk]: status } } : b));
  }, [bills, persistBills]);

  // ── Income ──
  const addIncome = useCallback((item) => persistIncome([...income, { ...item, id: generateId() }]), [income, persistIncome]);
  const updateIncome = useCallback((id, u) => persistIncome(income.map((i) => i.id === id ? { ...i, ...u } : i)), [income, persistIncome]);
  const deleteIncome = useCallback((id) => persistIncome(income.filter((i) => i.id !== id)), [income, persistIncome]);

  // ── Budget ──
  const setBudgetForMonth = useCallback((mk, amount) => persistBudget({ ...budget, [mk]: amount }), [budget, persistBudget]);

  // ── Debts ──
  const addDebt = useCallback((debt) => persistDebts([...debts, { ...debt, id: generateId() }]), [debts, persistDebts]);
  const updateDebt = useCallback((id, u) => persistDebts(debts.map((d) => d.id === id ? { ...d, ...u } : d)), [debts, persistDebts]);
  const deleteDebt = useCallback((id) => persistDebts(debts.filter((d) => d.id !== id)), [debts, persistDebts]);

  const toggleDebtPaid = useCallback((id, month) => {
    persistDebts(debts.map((d) => {
      if (d.id !== id) return d;
      const mk = month || currentMonthKey();
      return { ...d, paidMonths: { ...(d.paidMonths || {}), [mk]: !(d.paidMonths || {})[mk] } };
    }));
  }, [debts, persistDebts]);

  // ── Savings ──
  const addSaving = useCallback((s) => persistSavings([...savings, { ...s, id: generateId() }]), [savings, persistSavings]);
  const updateSaving = useCallback((id, u) => persistSavings(savings.map((s) => s.id === id ? { ...s, ...u } : s)), [savings, persistSavings]);
  const deleteSaving = useCallback((id) => persistSavings(savings.filter((s) => s.id !== id)), [savings, persistSavings]);

  // ── Commitments ──
  const addCommitment = useCallback((c) => persistCommitments([...commitments, { ...c, id: generateId(), completed: false, createdAt: new Date().toISOString() }]), [commitments, persistCommitments]);
  const updateCommitment = useCallback((id, u) => persistCommitments(commitments.map((c) => c.id === id ? { ...c, ...u } : c)), [commitments, persistCommitments]);
  const deleteCommitment = useCallback((id) => persistCommitments(commitments.filter((c) => c.id !== id)), [commitments, persistCommitments]);
  const toggleCommitment = useCallback((id) => persistCommitments(commitments.map((c) => c.id === id ? { ...c, completed: !c.completed } : c)), [commitments, persistCommitments]);

  // ── Notes ──
  const addNote = useCallback((note) => {
    const now = new Date().toISOString();
    persistNotes([{ ...note, id: generateId(), createdAt: now, updatedAt: now }, ...notes]);
  }, [notes, persistNotes]);
  const updateNote = useCallback((id, u) => persistNotes(notes.map((n) => n.id === id ? { ...n, ...u, updatedAt: new Date().toISOString() } : n)), [notes, persistNotes]);
  const deleteNote = useCallback((id) => persistNotes(notes.filter((n) => n.id !== id)), [notes, persistNotes]);
  const toggleNotePin = useCallback((id) => persistNotes(notes.map((n) => n.id === id ? { ...n, pinned: !n.pinned } : n)), [notes, persistNotes]);
  const toggleNoteDashboardPin = useCallback((id) => persistNotes(notes.map((n) => n.id === id ? { ...n, pinnedToDashboard: !n.pinnedToDashboard } : n)), [notes, persistNotes]);

  // ── Purchases ──
  const addPurchase = useCallback((p) => persistPurchases([{ ...p, id: generateId(), createdAt: new Date().toISOString() }, ...purchases]), [purchases, persistPurchases]);
  const updatePurchase = useCallback((id, u) => persistPurchases(purchases.map((p) => p.id === id ? { ...p, ...u } : p)), [purchases, persistPurchases]);
  const deletePurchase = useCallback((id) => persistPurchases(purchases.filter((p) => p.id !== id)), [purchases, persistPurchases]);

  // ── Jobs ──
  const addJob = useCallback((job) => persistJobs([...jobs, { ...job, id: generateId(), createdAt: new Date().toISOString() }]), [jobs, persistJobs]);
  const updateJob = useCallback((id, u) => persistJobs(jobs.map((j) => j.id === id ? { ...j, ...u } : j)), [jobs, persistJobs]);
  const deleteJob = useCallback((id) => persistJobs(jobs.filter((j) => j.id !== id)), [jobs, persistJobs]);

  // ── Shifts ──
  const addShift = useCallback((sh) => persistShifts([{ ...sh, id: generateId(), createdAt: new Date().toISOString() }, ...shifts]), [shifts, persistShifts]);
  const updateShift = useCallback((id, u) => persistShifts(shifts.map((s) => s.id === id ? { ...s, ...u } : s)), [shifts, persistShifts]);
  const deleteShift = useCallback((id) => persistShifts(shifts.filter((s) => s.id !== id)), [shifts, persistShifts]);
  const bulkSaveShifts = useCallback((entries) => {
    let updated = [...shifts];
    for (const { existingId, ...data } of entries) {
      if (existingId) {
        updated = updated.map((s) => s.id === existingId ? { ...s, ...data } : s);
      } else {
        updated = [{ ...data, id: generateId(), createdAt: new Date().toISOString() }, ...updated];
      }
    }
    persistShifts(updated);
  }, [shifts, persistShifts]);

  // ── Planned Expenses ──
  const addPlannedExpense = useCallback((pe) => persistPlannedExpenses([...plannedExpenses, { ...pe, id: generateId(), status: 'planned', createdAt: new Date().toISOString() }]), [plannedExpenses, persistPlannedExpenses]);
  const updatePlannedExpense = useCallback((id, u) => persistPlannedExpenses(plannedExpenses.map((pe) => pe.id === id ? { ...pe, ...u } : pe)), [plannedExpenses, persistPlannedExpenses]);
  const deletePlannedExpense = useCallback((id) => persistPlannedExpenses(plannedExpenses.filter((pe) => pe.id !== id)), [plannedExpenses, persistPlannedExpenses]);

  // ── Budget Categories (envelopes) ──
  const addBudgetCategory = useCallback((cat) => persistBudgetCategories([...budgetCategories, { ...cat, id: generateId(), createdAt: new Date().toISOString() }]), [budgetCategories, persistBudgetCategories]);
  const updateBudgetCategory = useCallback((id, u) => persistBudgetCategories(budgetCategories.map((c) => c.id === id ? { ...c, ...u } : c)), [budgetCategories, persistBudgetCategories]);
  const deleteBudgetCategory = useCallback((id) => persistBudgetCategories(budgetCategories.filter((c) => c.id !== id)), [budgetCategories, persistBudgetCategories]);

  // ── Budget Spends ──
  const addBudgetSpend = useCallback((spend) => persistBudgetSpends([{ ...spend, id: generateId(), createdAt: new Date().toISOString() }, ...budgetSpends]), [budgetSpends, persistBudgetSpends]);
  const updateBudgetSpend = useCallback((id, u) => persistBudgetSpends(budgetSpends.map((s) => s.id === id ? { ...s, ...u } : s)), [budgetSpends, persistBudgetSpends]);
  const deleteBudgetSpend = useCallback((id) => persistBudgetSpends(budgetSpends.filter((s) => s.id !== id)), [budgetSpends, persistBudgetSpends]);

  return (
    <AppContext.Provider value={{
      cloudLoaded,
      bills, addBill, updateBill, deleteBill, toggleBillPaid, setBillStatusDirect,
      income, addIncome, updateIncome, deleteIncome,
      budget, setBudgetForMonth,
      notes, addNote, updateNote, deleteNote, toggleNotePin, toggleNoteDashboardPin,
      debts, addDebt, updateDebt, deleteDebt, toggleDebtPaid,
      savings, addSaving, updateSaving, deleteSaving,
      commitments, addCommitment, updateCommitment, deleteCommitment, toggleCommitment,
      purchases, addPurchase, updatePurchase, deletePurchase,
      plannedExpenses, addPlannedExpense, updatePlannedExpense, deletePlannedExpense,
      jobs, addJob, updateJob, deleteJob,
      shifts, addShift, updateShift, deleteShift, bulkSaveShifts,
      budgetCategories, addBudgetCategory, updateBudgetCategory, deleteBudgetCategory,
      budgetSpends, addBudgetSpend, updateBudgetSpend, deleteBudgetSpend,
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

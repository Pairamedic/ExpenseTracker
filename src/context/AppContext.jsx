import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { storage } from '../utils/storage';
import { saveUserData, loadUserData, saveSharedView, saveFCMToken } from '../utils/firestoreSync';
import { generateId, currentMonthKey, getBillStatus, nextBillStatus } from '../utils/helpers';
import { notificationPermission, sendNotification, getDueDateMs, registerFCMToken, onForegroundMessage } from '../utils/notifications';

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
  const [agreements, setAgreementsState] = useState(() => storage.getAgreements());
  const [shoppingLists, setShoppingListsState] = useState(() => storage.getShoppingLists());
  const [shoppingItems, setShoppingItemsState] = useState(() => storage.getShoppingItems());
  const [planningSettings, setPlanningSettingsState] = useState(() => storage.getPlanningSettings());
  const [recurringTemplates, setRecurringTemplatesState] = useState(() => storage.getRecurringTemplates());
  const [paycheckActuals, setPaycheckActualsState] = useState(() => storage.getPaycheckActuals());
  const [cloudLoaded, setCloudLoaded] = useState(false);

  // Use refs to always have fresh values for the save function
  const stateRef = useRef({});
  stateRef.current = { bills, income, budget, settings, notes, debts, savings, commitments, purchases, plannedExpenses, jobs, shifts, budgetCategories, budgetSpends, agreements, shoppingLists, shoppingItems, planningSettings, recurringTemplates, paycheckActuals };

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
        if (data.agreements) { setAgreementsState(data.agreements); storage.setAgreements(data.agreements); }
        if (data.shoppingLists) { setShoppingListsState(data.shoppingLists); storage.setShoppingLists(data.shoppingLists); }
        if (data.shoppingItems) { setShoppingItemsState(data.shoppingItems); storage.setShoppingItems(data.shoppingItems); }
        if (data.planningSettings) {
          const ps = storage.getPlanningSettings();
          const merged = {
            tax: { ...ps.tax, ...(data.planningSettings.tax || {}) },
            ira: { ...ps.ira, ...(data.planningSettings.ira || {}) },
            pto: { ...ps.pto, ...(data.planningSettings.pto || {}) },
          };
          setPlanningSettingsState(merged); storage.setPlanningSettings(merged);
        }
        if (data.recurringTemplates) { setRecurringTemplatesState(data.recurringTemplates); storage.setRecurringTemplates(data.recurringTemplates); }
        if (data.paycheckActuals) { setPaycheckActualsState(data.paycheckActuals); storage.setPaycheckActuals(data.paycheckActuals); }
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

  const persistAgreements = useCallback((next) => {
    setAgreementsState(next); storage.setAgreements(next);
    debouncedSync({ agreements: next });
  }, [debouncedSync]);

  const persistShoppingLists = useCallback((next) => {
    setShoppingListsState(next); storage.setShoppingLists(next);
    debouncedSync({ shoppingLists: next });
  }, [debouncedSync]);

  const persistShoppingItems = useCallback((next) => {
    setShoppingItemsState(next); storage.setShoppingItems(next);
    debouncedSync({ shoppingItems: next });
  }, [debouncedSync]);

  const persistPlanningSettings = useCallback((next) => {
    setPlanningSettingsState(next); storage.setPlanningSettings(next);
    debouncedSync({ planningSettings: next });
  }, [debouncedSync]);

  const persistRecurringTemplates = useCallback((next) => {
    setRecurringTemplatesState(next); storage.setRecurringTemplates(next);
    debouncedSync({ recurringTemplates: next });
  }, [debouncedSync]);

  const persistPaycheckActuals = useCallback((next) => {
    setPaycheckActualsState(next); storage.setPaycheckActuals(next);
    debouncedSync({ paycheckActuals: next });
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

  // ── Agreements ──
  const addAgreement = useCallback((ag) => persistAgreements([{ ...ag, id: generateId(), status: 'active', createdAt: new Date().toISOString() }, ...agreements]), [agreements, persistAgreements]);
  const updateAgreement = useCallback((id, u) => persistAgreements(agreements.map((a) => a.id === id ? { ...a, ...u } : a)), [agreements, persistAgreements]);
  const deleteAgreement = useCallback((id) => persistAgreements(agreements.filter((a) => a.id !== id)), [agreements, persistAgreements]);

  // ── Shopping Lists ──
  const addShoppingList = useCallback((list) => persistShoppingLists([
    ...shoppingLists,
    { ...list, id: generateId(), archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ]), [shoppingLists, persistShoppingLists]);

  const updateShoppingList = useCallback((id, u) => persistShoppingLists(
    shoppingLists.map((l) => l.id === id ? { ...l, ...u, updatedAt: new Date().toISOString() } : l)
  ), [shoppingLists, persistShoppingLists]);

  const deleteShoppingList = useCallback((id) => {
    const newLists = shoppingLists.filter((l) => l.id !== id);
    const newItems = shoppingItems.filter((i) => i.listId !== id);
    setShoppingListsState(newLists); storage.setShoppingLists(newLists);
    setShoppingItemsState(newItems); storage.setShoppingItems(newItems);
    debouncedSync({ shoppingLists: newLists, shoppingItems: newItems });
  }, [shoppingLists, shoppingItems, debouncedSync]);

  // ── Shopping Items ──
  const addShoppingItem = useCallback((item) => persistShoppingItems([
    ...shoppingItems,
    { ...item, id: generateId(), createdAt: new Date().toISOString() },
  ]), [shoppingItems, persistShoppingItems]);

  const updateShoppingItem = useCallback((id, u) => persistShoppingItems(
    shoppingItems.map((i) => i.id === id ? { ...i, ...u } : i)
  ), [shoppingItems, persistShoppingItems]);

  const deleteShoppingItem = useCallback((id) => persistShoppingItems(
    shoppingItems.filter((i) => i.id !== id)
  ), [shoppingItems, persistShoppingItems]);

  const toggleShoppingItem = useCallback((id) => persistShoppingItems(
    shoppingItems.map((i) => i.id === id ? { ...i, checked: !i.checked } : i)
  ), [shoppingItems, persistShoppingItems]);

  // Creates a list + all its items in one atomic write (used by paste-import)
  const importList = useCallback((listData, itemNames) => {
    const listId = generateId();
    const now = new Date().toISOString();
    const newList = { ...listData, id: listId, archived: false, createdAt: now, updatedAt: now };
    const newItems = itemNames.map((name) => ({
      id: generateId(), listId, name: name.trim(), createdAt: now,
      qty: null, price: null, checked: false,
      status: 'pending', notes: null,
      dueDate: listData.dueDate || null, dueTime: null, notifyEnabled: false,
    }));
    const nextLists = [...shoppingLists, newList];
    const nextItems = [...shoppingItems, ...newItems];
    setShoppingListsState(nextLists); storage.setShoppingLists(nextLists);
    setShoppingItemsState(nextItems); storage.setShoppingItems(nextItems);
    debouncedSync({ shoppingLists: nextLists, shoppingItems: nextItems });
  }, [shoppingLists, shoppingItems, debouncedSync]);

  // ── Planning Settings ──
  const updatePlanningSettings = useCallback((patch) => {
    const next = { ...planningSettings, ...patch };
    persistPlanningSettings(next);
  }, [planningSettings, persistPlanningSettings]);

  // ── Recurring Templates ──
  const addRecurringTemplate = useCallback((t) => persistRecurringTemplates([
    ...recurringTemplates,
    { ...t, id: generateId(), active: true, createdAt: new Date().toISOString() },
  ]), [recurringTemplates, persistRecurringTemplates]);

  const updateRecurringTemplate = useCallback((id, u) => persistRecurringTemplates(
    recurringTemplates.map((t) => t.id === id ? { ...t, ...u } : t)
  ), [recurringTemplates, persistRecurringTemplates]);

  const deleteRecurringTemplate = useCallback((id) => persistRecurringTemplates(
    recurringTemplates.filter((t) => t.id !== id)
  ), [recurringTemplates, persistRecurringTemplates]);

  // Auto-log recurring purchases on load (after cloud data is ready)
  useEffect(() => {
    if (!cloudLoaded || !recurringTemplates.length) return;
    const today = new Date();
    const todayDay = today.getDate();
    const currentMk = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const toLog = recurringTemplates.filter((t) => {
      if (!t.active) return false;
      if (t.lastLoggedMonth === currentMk) return false;
      if (t.dayOfMonth && t.dayOfMonth > todayDay) return false;
      return true;
    });

    if (!toLog.length) return;

    const newPurchases = toLog.map((t) => {
      const day = t.dayOfMonth ? String(Math.min(t.dayOfMonth, todayDay)).padStart(2, '0') : String(todayDay).padStart(2, '0');
      return {
        id: generateId(),
        merchant: t.merchant,
        amount: t.amount,
        category: t.category || 'Subscriptions',
        person: t.person || 'me',
        date: `${currentMk}-${day}`,
        notes: 'Auto-logged recurring',
        recurringTemplateId: t.id,
        createdAt: new Date().toISOString(),
      };
    });

    const updatedTemplates = recurringTemplates.map((t) =>
      toLog.find((tl) => tl.id === t.id) ? { ...t, lastLoggedMonth: currentMk } : t
    );

    // Use state refs to avoid stale closures
    const freshPurchases = stateRef.current.purchases;
    setRecurringTemplatesState(updatedTemplates); storage.setRecurringTemplates(updatedTemplates);
    const nextPurchases = [...newPurchases, ...freshPurchases];
    setPurchasesState(nextPurchases); storage.setPurchases(nextPurchases);
    debouncedSync({ purchases: nextPurchases, recurringTemplates: updatedTemplates });
  }, [cloudLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Paycheck Actuals ──
  const addPaycheckActual = useCallback((a) => persistPaycheckActuals([
    ...paycheckActuals,
    { ...a, id: generateId(), createdAt: new Date().toISOString() },
  ]), [paycheckActuals, persistPaycheckActuals]);

  const updatePaycheckActual = useCallback((id, u) => persistPaycheckActuals(
    paycheckActuals.map((a) => a.id === id ? { ...a, ...u } : a)
  ), [paycheckActuals, persistPaycheckActuals]);

  const deletePaycheckActual = useCallback((id) => persistPaycheckActuals(
    paycheckActuals.filter((a) => a.id !== id)
  ), [paycheckActuals, persistPaycheckActuals]);

  // ── Share Link ──
  const buildSnapshot = useCallback(() => {
    const today = new Date();
    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    const oldestMk = `${threeMonthsAgo.getFullYear()}-${String(threeMonthsAgo.getMonth() + 1).padStart(2, '0')}`;
    return {
      settings: { myName: settings.myName, spouseName: settings.spouseName, spouseEnabled: settings.spouseEnabled },
      bills,
      income,
      purchases: purchases.filter((p) => p.date && p.date >= oldestMk),
      debts,
      savings,
      commitments: commitments.filter((c) => !c.completed),
    };
  }, [bills, income, purchases, debts, savings, commitments, settings]);

  const generateShareLink = useCallback(async () => {
    const token = generateId() + generateId();
    try {
      await saveSharedView(token, buildSnapshot());
    } catch (err) {
      return { ok: false, error: err.message || 'Firestore write failed' };
    }
    persistSettings({ ...settings, shareToken: token });
    return { ok: true, token };
  }, [buildSnapshot, settings, persistSettings]);

  const revokeShareLink = useCallback(() => {
    persistSettings({ ...settings, shareToken: null });
  }, [settings, persistSettings]);

  const refreshShareLink = useCallback(async () => {
    const token = settings.shareToken;
    if (!token) return { ok: false, error: 'No active share token' };
    try {
      await saveSharedView(token, buildSnapshot());
    } catch (err) {
      return { ok: false, error: err.message || 'Firestore write failed' };
    }
    return { ok: true };
  }, [buildSnapshot, settings]);

  // ── Firebase Cloud Messaging: register token + handle foreground messages ──
  useEffect(() => {
    if (notificationPermission() !== 'granted') return;
    let unsub = () => {};
    registerFCMToken().then((token) => { if (token && uid) saveFCMToken(uid, token); });
    onForegroundMessage().then((fn) => { unsub = fn; });
    return () => unsub();
  }, [uid]);

  // ── Global To-Do notification scheduling ──
  const todoNotifiedRef = useRef(new Set());
  useEffect(() => {
    if (notificationPermission() !== 'granted') return;
    const timers = {};
    const now = Date.now();
    const todoListIds = new Set(shoppingLists.filter((l) => l.type === 'todo').map((l) => l.id));
    const todoItems = shoppingItems.filter((i) =>
      todoListIds.has(i.listId) && (i.status === 'pending' || !i.status) && i.dueDate && i.notifyEnabled
    );
    todoItems.forEach((item) => {
      if (todoNotifiedRef.current.has(item.id)) return;
      const dueMs = getDueDateMs(item.dueDate, item.dueTime);
      if (!dueMs) return;
      const delay = dueMs - now;
      const list = shoppingLists.find((l) => l.id === item.listId);
      if (delay <= 0) {
        todoNotifiedRef.current.add(item.id);
        sendNotification(`Overdue: ${item.name}`, { body: list ? `List: ${list.name}` : 'To-do is past due', tag: `todo-${item.id}` });
      } else if (delay < 7 * 24 * 60 * 60 * 1000) {
        timers[item.id] = setTimeout(() => {
          todoNotifiedRef.current.add(item.id);
          sendNotification(`Due now: ${item.name}`, { body: list ? `List: ${list.name}` : 'Your to-do is due', tag: `todo-${item.id}` });
        }, Math.min(delay, 2147483647));
      }
    });
    return () => Object.values(timers).forEach(clearTimeout);
  }, [shoppingItems, shoppingLists]);

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
      budgetCategories, addBudgetCategory, updateBudgetCategory, deleteBudgetCategory, persistBudgetCategories,
      budgetSpends, addBudgetSpend, updateBudgetSpend, deleteBudgetSpend,
      agreements, addAgreement, updateAgreement, deleteAgreement,
      shoppingLists, addShoppingList, updateShoppingList, deleteShoppingList,
      shoppingItems, addShoppingItem, updateShoppingItem, deleteShoppingItem, toggleShoppingItem, importList,
      planningSettings, updatePlanningSettings,
      recurringTemplates, addRecurringTemplate, updateRecurringTemplate, deleteRecurringTemplate,
      paycheckActuals, addPaycheckActual, updatePaycheckActual, deletePaycheckActual,
      settings, setSettings: persistSettings,
      generateShareLink, revokeShareLink, refreshShareLink,
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

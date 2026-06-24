const KEYS = {
  BILLS: 'bt_bills',
  INCOME: 'bt_income',
  BUDGET: 'bt_budget',
  SETTINGS: 'bt_settings',
  NOTES: 'bt_notes',
  DEBTS: 'bt_debts',
  SAVINGS: 'bt_savings',
  COMMITMENTS: 'bt_commitments',
  PURCHASES: 'bt_purchases',
  PLANNED_EXPENSES: 'bt_planned_expenses',
  JOBS: 'bt_jobs',
  SHIFTS: 'bt_shifts',
  BUDGET_CATEGORIES: 'bt_budget_categories',
  BUDGET_SPENDS: 'bt_budget_spends',
  AGREEMENTS: 'bt_agreements',
  NET_WORTH_HISTORY: 'bt_nw_history',
  SHOPPING_LISTS: 'bt_shopping_lists',
  SHOPPING_ITEMS: 'bt_shopping_items',
};

function get(key) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

function set(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const DEFAULT_SETTINGS = {
  spouseEnabled: true,
  spouseName: 'Cameron',
  myName: 'Aaron',
  monthlySpendingBudget: 0,
  monthlySavingsTarget: 0,
  lightMode: false,
  purchasesInAvailable: false,
  dashboardSections: {
    pinnedNotes: true,
    savings: true,
    commitments: true,
    billsStatus: true,
    spending: true,
    nextPaycheck: true,
    payDates: true,
    plannedExpenses: true,
    netWorth: true,
    spendingTrend: true,
    topCategories: true,
    spendingByPerson: true,
    envelopes: true,
    agreements: true,
  },
};

export const storage = {
  getBills: () => get(KEYS.BILLS) || [],
  setBills: (bills) => set(KEYS.BILLS, bills),

  getIncome: () => get(KEYS.INCOME) || [],
  setIncome: (income) => set(KEYS.INCOME, income),

  getBudget: () => get(KEYS.BUDGET) || {},
  setBudget: (budget) => set(KEYS.BUDGET, budget),

  getSettings: () => ({ ...DEFAULT_SETTINGS, ...(get(KEYS.SETTINGS) || {}) }),
  setSettings: (settings) => set(KEYS.SETTINGS, settings),

  getNotes: () => get(KEYS.NOTES) || [],
  setNotes: (notes) => set(KEYS.NOTES, notes),

  getDebts: () => get(KEYS.DEBTS) || [],
  setDebts: (debts) => set(KEYS.DEBTS, debts),

  getSavings: () => get(KEYS.SAVINGS) || [],
  setSavings: (s) => set(KEYS.SAVINGS, s),

  getCommitments: () => get(KEYS.COMMITMENTS) || [],
  setCommitments: (c) => set(KEYS.COMMITMENTS, c),

  getPurchases: () => get(KEYS.PURCHASES) || [],
  setPurchases: (p) => set(KEYS.PURCHASES, p),

  getPlannedExpenses: () => get(KEYS.PLANNED_EXPENSES) || [],
  setPlannedExpenses: (p) => set(KEYS.PLANNED_EXPENSES, p),

  getJobs: () => get(KEYS.JOBS) || [],
  setJobs: (v) => set(KEYS.JOBS, v),

  getShifts: () => get(KEYS.SHIFTS) || [],
  setShifts: (v) => set(KEYS.SHIFTS, v),

  getBudgetCategories: () => get(KEYS.BUDGET_CATEGORIES) || [],
  setBudgetCategories: (v) => set(KEYS.BUDGET_CATEGORIES, v),

  getBudgetSpends: () => get(KEYS.BUDGET_SPENDS) || [],
  setBudgetSpends: (v) => set(KEYS.BUDGET_SPENDS, v),

  getAgreements: () => get(KEYS.AGREEMENTS) || [],
  setAgreements: (v) => set(KEYS.AGREEMENTS, v),

  getNetWorthHistory: () => get(KEYS.NET_WORTH_HISTORY) || [],
  setNetWorthHistory: (v) => set(KEYS.NET_WORTH_HISTORY, v),

  getShoppingLists: () => get(KEYS.SHOPPING_LISTS) || [],
  setShoppingLists: (v) => set(KEYS.SHOPPING_LISTS, v),
  getShoppingItems: () => get(KEYS.SHOPPING_ITEMS) || [],
  setShoppingItems: (v) => set(KEYS.SHOPPING_ITEMS, v),
};
